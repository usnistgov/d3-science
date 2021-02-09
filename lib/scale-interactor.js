(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./jquery-extend.js"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./jquery-extend.js"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.jqueryExtend);
    global.scaleInteractor = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _jqueryExtend) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _exports.scaleInteractor = scaleInteractor;

  function scaleInteractor(state, x, y) {
    var d3_import = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    return function (x, y) {
      var d3 = d3_import != null ? d3_import : window.d3;
      var x = x || d3.scaleLinear();
      var y = y || d3.scaleLinear();
      var dispatch = d3.dispatch("start", "update", "end");

      function interactor(selection) {
        var unscaled_data = [];
        selection.selectAll("g.series").each(function (d, i) {
          unscaled_data[i] = (0, _jqueryExtend.extend)(true, [], d);
        });
        selection.selectAll(".dot").on("click", null); // clear previous handlers

        var update = function update() {
          selection.selectAll("g.series").each(function (d, i) {
            // i is index of dataset
            // make a copy of the data:
            var new_scale = state.scales[i] || 1;
            d.forEach(function (ddd, iii) {
              var old_point = unscaled_data[i][iii];
              ddd[1] = new_scale * old_point[1];

              if (ddd[2] && ddd[2].yupper != null) {
                ddd[2].yupper = new_scale * old_point[2].yupper;
              }

              if (ddd[2] && ddd[2].ylower != null) {
                ddd[2].ylower = new_scale * old_point[2].ylower;
              }
            });
          });
        };

        interactor.update = update;
        selection.selectAll("g.series").each(function (d, i) {
          var dragmove_point = function dragmove_point(dd, ii) {
            var new_x = x.invert(d3.event.x),
                new_y = y.invert(d3.event.y),
                old_point = unscaled_data[i][ii],
                old_x = old_point[0],
                old_y = old_point[1];
            var new_scale = new_y / old_y;
            state.scales[i] = new_scale; // * original_datum[i];

            dispatch.call("update");
          };

          var drag_point = d3.drag().on("drag", dragmove_point).on("start", function () {
            d3.event.sourceEvent.stopPropagation();
            dispatch.call("start");
          }).on("end", function () {
            dispatch.call("end");
          });
          var series_select = d3.select(this);
          series_select.selectAll(".dot").attr("r", state.point_size || 7) // bigger for easier drag...
          .call(drag_point);
        });
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
