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
    global.xSliceInteractor = mod.exports;
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

  exports.default = xSliceInteractor;


  function xSliceInteractor(state, x, y) {
    // dispatch is the d3 event dispatcher: should have event "update" register
    var name = state.name;
    var dispatcher = d3.dispatch("update");
    var x = x || d3.scaleLinear();
    var y = y || d3.scaleLinear();

    var show_lines = state.show_lines == null ? true : state.show_lines;
    var show_range = state.show_range == null ? true : state.show_range;
    var fixed = state.fixed == null ? false : state.fixed;
    var cursor = fixed ? "auto" : "move";

    var xval_to_path = function xval_to_path(xval) {
      var xd = x.range(),
          yd = y.range();
      var pathstring = "";
      // start in the center and draw to the edge
      pathstring += "M" + x(xval).toFixed();
      pathstring += "," + yd[0].toFixed();
      pathstring += "L" + x(xval).toFixed();
      pathstring += "," + yd[1].toFixed();
      return pathstring;
    };

    var state_to_paths = function state_to_paths(state) {
      // convert from cx, cy, angle_offset and angle_range to paths for
      // boundaries and center lines

      // calculate angles of graph corners
      if (show_lines) {
        var x1_line = xval_to_path(state.x1),
            x2_line = xval_to_path(state.x2);

        return [{
          "path": x1_line,
          "classname": "x1 x-slice"
        }, {
          "path": x2_line,
          "classname": "x2 x-slice"
        }];
      } else {
        return [];
      }
    };

    var state_to_rect = function state_to_rect(state) {
      if (show_range) {
        var yd = y.range();
        var x0 = Math.min(x(state.x1), x(state.x2));
        var x1 = Math.max(x(state.x1), x(state.x2));
        var y0 = Math.min(yd[0], yd[1]);
        var y1 = Math.max(yd[0], yd[1]);
        var rect = {
          "x": x0,
          "y": y0,
          "width": x1 - x0,
          "height": y1 - y0
        };
        return rect;
      } else {
        return null;
      }
    };

    var drag_lines = d3.drag().on("drag", dragmove_lines).on("start", function () {
      d3.event.sourceEvent.stopPropagation();
    });

    function interactor(selection) {
      var group = selection.append("g").classed("interactors interactor-" + name, true);

      var fill = group.append("rect").attr("class", "range-fill").style("stroke", "none").style("pointer-events", "none").datum(state_to_rect(state));
      fill.style("fill", state.color1).attr("opacity", 0.1).attr("x", function (d) {
        return d.x;
      }).attr("y", function (d) {
        return d.y;
      }).attr("width", function (d) {
        return d.width;
      }).attr("height", function (d) {
        return d.height;
      });

      var lines_group = group.append("g").attr("class", "lines-group").style("fill", "none").style("cursor", cursor).style("stroke", state.color1).style("stroke-width", "4px");

      var lines = lines_group.selectAll(".lines").data(state_to_paths(state)).enter().append("path").attr("class", function (d) {
        return d['classname'];
      }).classed("lines", true).attr("d", function (d) {
        return d['path'];
      });
      if (!fixed) lines.call(drag_lines);

      interactor.update = function (preventPropagation) {
        group.selectAll('rect').datum(state_to_rect(state)).attr("x", function (d) {
          return d.x;
        }).attr("y", function (d) {
          return d.y;
        }).attr("width", function (d) {
          return d.width;
        }).attr("height", function (d) {
          return d.height;
        });

        group.selectAll('.lines').data(state_to_paths(state)).attr("d", function (d) {
          return d['path'];
        });
        // fire!
        if (!preventPropagation) {
          dispatcher.call("update");
        }
      };
    }

    function dragmove_lines() {
      var new_x = x.invert(d3.event.x);
      if (d3.select(this).classed("x1")) {
        state.x1 = new_x;
      } else {
        state.x2 = new_x;
      }
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
    interactor.dispatch = dispatcher;

    return interactor;
  }
});
