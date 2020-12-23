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
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _rectangleSelect) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _exports.rectangleSelectPoints = rectangleSelectPoints;

  function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

  function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

  function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

  function rectangleSelectPoints(state, x, y) {
    var d3_import = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    return function (x, y) {
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
                  // ii is the index of the point in that dataset.
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

          dispatch.call("selection", {
            indices: indices,
            elements: elements,
            limits: {
              xmin: xmin,
              xmax: xmax,
              ymin: ymin,
              ymax: ymax
            }
          });
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
    }(x, y);
  }
});
