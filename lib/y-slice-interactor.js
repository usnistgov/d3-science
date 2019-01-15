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
    global.ySliceInteractor = mod.exports;
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

  exports.default = ySliceInteractor;


  function ySliceInteractor(state, x, y) {
    // dispatch is the d3 event dispatcher: should have event "update" register
    var name = state.name;
    var dispatcher = d3.dispatch("update");
    var x = x || d3.scaleLinear();
    var y = y || d3.scaleLinear();

    var show_lines = state.show_lines == null ? true : state.show_lines;
    var show_range = state.show_range == null ? true : state.show_range;
    var fixed = state.fixed == null ? false : state.fixed;
    var cursor = fixed ? "auto" : "move";

    var yval_to_path = function yval_to_path(yval) {
      var xd = x.range(),
          yd = y.range();
      var pathstring = "";
      // start in the center and draw to the edge
      pathstring += "M" + xd[0].toFixed();
      pathstring += "," + y(yval).toFixed();
      pathstring += "L" + xd[1].toFixed();
      pathstring += "," + y(yval).toFixed();
      return pathstring;
    };

    var state_to_paths = function state_to_paths(state) {
      // convert from cx, cy, angle_offset and angle_range to paths for
      // boundaries and center lines

      // calculate angles of graph corners
      if (show_lines) {
        var y1_line = yval_to_path(state.y1),
            y2_line = yval_to_path(state.y2);

        return [{
          "path": y1_line,
          "classname": "y1 y-slice"
        }, {
          "path": y2_line,
          "classname": "y2 y-slice"
        }];
      } else {
        return [];
      }
    };

    var state_to_rect = function state_to_rect(state) {
      if (show_range) {
        var xd = x.range();
        var x0 = Math.min(xd[0], xd[1]);
        var x1 = Math.max(xd[0], xd[1]);
        var y0 = Math.min(y(state.y1), y(state.y2));
        var y1 = Math.max(y(state.y1), y(state.y2));
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

    var drag_rect = d3.drag().on("drag", dragmove_rect).on("start", function () {
      d3.event.sourceEvent.stopPropagation();
    });

    function interactor(selection) {
      var group = selection.append("g").classed("interactors interactor-" + name, true);

      var fill = group.append("rect").attr("class", "range-fill").style("stroke", "none").style("pointer-events", state.drag_rect ? "all" : "none").style("cursor", state.drag_rect ? "move" : "auto").datum(state_to_rect(state));
      fill.style("fill", state.color1).attr("opacity", 0.1).attr("x", function (d) {
        return d.x;
      }).attr("y", function (d) {
        return d.y;
      }).attr("width", function (d) {
        return d.width;
      }).attr("height", function (d) {
        return d.height;
      });
      if (state.drag_rect) fill.call(drag_rect);

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
      var new_y = y.invert(d3.event.y);
      if (d3.select(this).classed("y1")) {
        state.y1 = new_y;
      } else {
        state.y2 = new_y;
      }
      interactor.update();
    }

    function dragmove_rect() {
      var dy = d3.event.dy;
      state.y1 = y.invert(y(state.y1) + dy);
      state.y2 = y.invert(y(state.y2) + dy);
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
