(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./rectangle-select.js"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./rectangle-select.js"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.rectangleSelect);
    global.rectangleSelectPoints = mod.exports;
  }
})(this, function (exports, _rectangleSelect) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = exports.rectangleSelectPoints = undefined;

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  exports.rectangleSelectPoints = rectangleSelectPoints;
  exports.default = rectangleSelectPoints;


  function rectangleSelectPoints(state, x, y) {
    var d3_import = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    var d3 = d3_import != null ? d3_import : window.d3;
    var x = x || d3.scaleLinear();
    var y = y || d3.scaleLinear();
    var drag_instance = d3.drag();
    var dispatch = d3.dispatch("selection");

    function interactor(selection) {
      selection.call(drag_instance);
      var selector = new _rectangleSelect.rectangleSelect(drag_instance, null, null, d3);
      interactor.selector = selector;
      selection.call(selector);

      var onselect = function onselect(xmin, xmax, ymin, ymax) {
        var indices = [];
        var elements = [];
        if (!state.skip_points) {
          selection.selectAll("g.series").each(function (d, i) {
            // i is index of 
            var index_list = [];
            indices.push(index_list);
            var series_select = d3.select(this);
            if (!series_select.classed("hidden")) {
              // don't interact with hidden series.
              series_select.selectAll(".dot").each(function (dd, ii) {
                var _dd = _slicedToArray(dd, 2),
                    x = _dd[0],
                    y = _dd[1];

                if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
                  index_list.push(ii);
                  elements.push(this);
                }
              });
            }
          });
        }
        dispatch.call("selection", { indices: indices, elements: elements, limits: { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax } });
      };
      selector.callbacks(onselect);
    }

    interactor.update = function () {
      interactor.selector.update();
    };

    interactor.x = function (_) {
      if (!arguments.length) return x;
      x = _;
      interactor.selector.x(_);
      return interactor;
    };

    interactor.y = function (_) {
      if (!arguments.length) return y;
      y = _;
      interactor.selector.y(_);
      return interactor;
    };

    interactor.state = state;
    interactor.dispatch = dispatch;

    return interactor;
  }
});
