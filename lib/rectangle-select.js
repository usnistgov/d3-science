(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "d3"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("d3"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.d3);
    global.rectangleSelect = mod.exports;
  }
})(this, function (exports, _d) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var d3 = _interopRequireWildcard(_d);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  exports.default = rectangleSelect;


  function rectangleSelect(drag, x, y) {
    // x, y are d3.scale objects (linear, log, etc) from parent
    // dispatch is the d3 event dispatcher: should have event "update" register
    // 
    // drag is the drag behavior attached to the chart (initialize with this);
    var event_name = "rectangle_select";
    var dispatch = d3.dispatch("update");
    var x = x || d3.scaleLinear();
    var y = y || d3.scaleLinear();
    var selectRect = true;
    var callbacks = [];

    function interactor(selection) {
      // selection is chart mainview, need parent svg:
      //var svg = d3.select(selection.node().parentNode);
      //svg.call(drag);

      drag.on("start.select", drag_started);
      function drag_started() {
        if (!selectRect) return;
        var e = selection.node(),
            origin = d3.mouse(e),
            rect = selection.append("rect").attr("class", "zoom");
        d3.select("body").classed("noselect", true);
        var width = Math.max.apply(Math, x.range()),
            height = Math.max.apply(Math, y.range());
        origin[0] = Math.max(0, Math.min(width, origin[0]));
        origin[1] = Math.max(0, Math.min(height, origin[1]));

        d3.event.on("drag", dragged).on("end", ended);

        function dragged(d) {
          var m = d3.mouse(e);
          m[0] = Math.max(0, Math.min(width, m[0]));
          m[1] = Math.max(0, Math.min(height, m[1]));
          rect.attr("x", Math.min(origin[0], m[0])).attr("y", Math.min(origin[1], m[1])).attr("width", Math.abs(m[0] - origin[0])).attr("height", Math.abs(m[1] - origin[1]));
        }

        function ended() {
          d3.select("body").classed("noselect", false);
          var m = d3.mouse(e);
          m[0] = Math.max(0, Math.min(width, m[0]));
          m[1] = Math.max(0, Math.min(height, m[1]));
          if (m[0] !== origin[0] && m[1] !== origin[1]) {
            var x_domain = [origin[0], m[0]].map(x.invert).sort(function (a, b) {
              return a - b;
            }),
                y_domain = [origin[1], m[1]].map(y.invert).sort(function (a, b) {
              return a - b;
            }),
                new_xmin = x_domain[0],
                new_xmax = x_domain[1],
                new_ymin = y_domain[0],
                new_ymax = y_domain[1];
            callbacks.forEach(function (c) {
              c(new_xmin, new_xmax, new_ymin, new_ymax);
            });
          }
          rect.remove();
          dispatch.call("update");
        }
        d3.event.sourceEvent.stopPropagation();
      }
    }

    interactor.x = function (_) {
      if (!arguments.length) return x;
      x = _;
      return interactor;
    };

    interactor.y = function (_) {
      if (!arguments.length) return y;
      y = _;
      return interactor;
    };

    interactor.selectRect = function (_) {
      if (!arguments.length) return selectRect;
      selectRect = _;
      return interactor;
    };

    interactor.callbacks = function (_) {
      if (!arguments.length) return callbacks;
      callbacks.push(_);
      return interactor;
    };

    interactor.update = function () {};

    interactor.dispatch = dispatch;

    return interactor;
  }
});
