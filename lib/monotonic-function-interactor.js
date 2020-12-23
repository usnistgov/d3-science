(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.monotonicFunctionInteractor = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _exports.monotonicFunctionInteractor = monotonicFunctionInteractor;

  function monotonicFunctionInteractor(state, x, y) {
    var d3_import = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    return function (x, y) {
      var d3 = d3_import != null ? d3_import : window.d3; // x, y are d3.scale objects (linear, log, etc) from parent
      // dispatch is the d3 event dispatcher: should have event "update" register
      //var state = options;

      var name = state.name;
      var radius = state.radius == null ? 5 : state.radius;
      var event_name = "functional." + state.name;
      var dispatch = d3.dispatch("update");
      var x = x || d3.scaleLinear();
      var y = y || d3.scaleLinear();
      var interpolation = state.interpolation == null ? 'Linear' : state.interpolation;
      var line = d3.line().defined(function (d) {
        return d && d != null && isFinite(d) && isFinite(y(state.functional(x.invert(d))));
      }).x(function (d) {
        return d;
      }).y(function (d) {
        return y(state.functional(x.invert(d)));
      }).curve(d3["curve" + interpolation]);

      function interactor(selection) {
        var group = selection.append("g").classed("interactors interactor-" + name, true).style("cursor", "auto");
        var knot_group = group.append("g").attr("class", "knots").style("stroke", state.color1).style("stroke-linecap", "round").style("stroke-width", "4px").style("fill", "none");
        var path = knot_group.append("path").classed("functional", true);
        interactor.path = path;

        interactor.update = function () {
          var knot_x = state.show_lines == false ? [] : d3.range(0, x.range()[1], state.dx || 1);
          var knots = knot_group.selectAll("path.functional").data([knot_x]);
          knots.attr("d", line); //.attr("visibility", (state.show_lines) ? "visible" : "hidden"); 
          // fire!

          dispatch.call("update");
        };

        interactor.update();
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

      interactor.state = state;
      interactor.dispatch = dispatch;
      return interactor;
    }(x, y);
  }
});
