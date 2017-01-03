(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'd3'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('d3'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.d3);
    global.ellipseInteractor = mod.exports;
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

  exports.default = ellipseInteractor;


  function ellipseInteractor(state, x, y) {
    // dispatch is the d3 event dispatcher: should have event "update" register
    // state: {cx: ..., cy: ..., rx: ..., ry: ...}
    // if dragging the ellipse itself, the eccentricity (ry/rx) is preserved
    var name = state.name;
    var point_radius = state.point_radius == null ? 5 : state.point_radius;
    var dispatch = d3.dispatch("update");
    var x = x || d3.scaleLinear();
    var y = y || d3.scaleLinear();
    //if (x.name != 'i' || y.name != 'i') {
    //  throw "circle only defined for linear scales";
    //  return
    //}
    if (!('ry' in state)) {
      state.ry = Math.abs(state.rx);
    }
    var show_points = state.show_points == null ? true : state.show_points;
    var show_lines = state.show_lines == null ? true : state.show_lines;
    var show_center = state.show_center == null ? true : state.show_center;
    var fixed = state.fixed == null ? false : state.fixed;
    var cursor = fixed ? "auto" : "move";

    var state_to_ellipse = function state_to_ellipse(state) {
      // convert from xmin, xmax... to pairs of points for circle
      if (show_lines) {
        return [{ cx: state.cx, cy: state.cy, rx: state.rx, ry: state.ry }];
      } else {
        return [];
      }
    };

    var state_to_points = function state_to_points(state) {
      if (show_points) {
        return [[state.cx + state.rx, state.cy], [state.cx, state.cy + state.ry]];
      } else {
        return [];
      }
    };

    var state_to_center = function state_to_center(state) {
      if (show_center) {
        return [[state.cx, state.cy]];
      } else {
        return [];
      }
    };

    var drag_corner = d3.drag().on("drag", dragmove_corner).on("start", function () {
      _d.event.sourceEvent.stopPropagation();
    });

    var drag_center = d3.drag().on("drag", dragmove_center).on("start", function () {
      _d.event.sourceEvent.stopPropagation();
    });

    var drag_edge = d3.drag().on("drag", dragmove_edge).on("start", function () {
      _d.event.sourceEvent.stopPropagation();
    });

    function interactor(selection) {
      var group = selection.append("g").classed("interactors interactor-" + name, true).style("cursor", cursor);
      var edges = group.append("g").attr("class", "edges").style("stroke", state.color1).style("stroke-linecap", "round").selectAll(".edge").data(state_to_ellipse(state)).enter().append("ellipse").classed("edge", true).attr("fill", "none").attr("stroke-width", "4px").attr("cx", function (d) {
        return x(d['cx']);
      }).attr("cy", function (d) {
        return y(d['cy']);
      }).attr("rx", function (d) {
        return Math.abs(x(d['rx'] + d['cx']) - x(d['cx']));
      }).attr("ry", function (d) {
        return Math.abs(y(d['ry'] + d['cy']) - y(d['cy']));
      });
      if (!fixed) edges.call(drag_edge);

      var corners = group.append("g").classed("corners", true).attr("fill", state.color1).selectAll("corner").data(state_to_points(state)).enter().append("circle").classed("corner", true).attr("vertex", function (d, i) {
        return i.toFixed();
      }).attr("r", point_radius).attr("cx", function (d) {
        return x(d[0]);
      }).attr("cy", function (d) {
        return y(d[1]);
      });
      if (!fixed) corners.call(drag_corner);

      var center_group = group.append("g").classed("center_group", true).attr("fill", state.color1).selectAll("center").data(state_to_center(state)).enter().append("circle").classed("center", true).attr("r", point_radius).attr("cx", function (d) {
        return x(d[0]);
      }).attr("cy", function (d) {
        return y(d[1]);
      });
      if (!fixed) center_group.call(drag_center);

      interactor.update = function (preventPropagation) {
        group.selectAll('.center').data(state_to_center(state)).attr("cx", function (d) {
          return x(d[0]);
        }).attr("cy", function (d) {
          return y(d[1]);
        });

        group.selectAll('.corner').data(state_to_points(state)).attr("cx", function (d) {
          return x(d[0]);
        }).attr("cy", function (d) {
          return y(d[1]);
        });

        group.selectAll('.edge').data(state_to_ellipse(state)).attr("cx", function (d) {
          return x(d['cx']);
        }).attr("cy", function (d) {
          return y(d['cy']);
        }).attr("rx", function (d) {
          return Math.abs(x(d['rx'] + d['cx']) - x(d['cx']));
        }).attr("ry", function (d) {
          return Math.abs(y(d['ry'] + d['cy']) - y(d['cy']));
        });

        // fire!
        if (!preventPropagation) {
          dispatch.call("update");
        }
      };
    }

    function dragmove_corner(d) {
      var new_x = x.invert(_d.event.x),
          new_y = y.invert(_d.event.y);
      var vertex = parseInt(d3.select(this).attr("vertex"));
      // enforce relationship between corners:
      switch (vertex) {
        case 0:
          state.rx = new_x - state.cx;
          break;
        case 1:
          state.ry = new_y - state.cy;
          break;
        default:
      }
      interactor.update();
    }

    function dragmove_center() {
      state.cx = x.invert(x(state.cx) + _d.event.dx);
      state.cy = y.invert(y(state.cy) + _d.event.dy);
      interactor.update();
    }

    function dragmove_edge() {
      var eccentricity = state.ry / state.rx,
          new_x = x.invert(_d.event.x),
          new_y = y.invert(_d.event.y),
          new_rx = Math.sqrt(Math.pow(new_x - state.cx, 2) + Math.pow(new_y - state.cy, 2) / Math.pow(eccentricity, 2)),
          new_ry = eccentricity * new_rx;
      state.rx = new_rx;
      state.ry = new_ry;
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
  }
});
