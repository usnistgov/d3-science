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
    global.crosshairInteractor = mod.exports;
  }
})(this, function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

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

  exports.crosshairInteractor = crosshairInteractor;
  exports.default = crosshairInteractor;


  function crosshairInteractor(state, x, y) {
    var d3_import = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    var d3 = d3_import != null ? d3_import : window.d3;
    // dispatch is the d3 event dispatcher: should have event "update" register
    // state: {cx: ..., cy: ..., angle_offset: ..., angle_range: ...}
    // angle is in pixel coords
    var name = state.name;
    var point_radius = state.point_radius == null ? 5 : state.point_radius;
    var dispatch = d3.dispatch("update");
    var x = x || d3.scaleLinear();
    var y = y || d3.scaleLinear();

    // TODO: need to check for linear scale somehow - doesn't work otherwise

    var show_lines = state.show_lines == null ? true : state.show_lines;
    var show_center = state.show_center == null ? true : state.show_center;
    var fixed = state.fixed == null ? false : state.fixed;
    var cursor = fixed ? "auto" : "move";

    var center_to_paths = function center_to_paths(cx, cy) {
      var yd = y.range(),
          xd = x.range();

      var h_pathstring = "";
      var v_pathstring = "";
      // start in the center and draw to the right edge
      h_pathstring += "M" + x(cx).toFixed();
      h_pathstring += "," + y(cy).toFixed();
      h_pathstring += "L" + xd[1].toFixed();
      h_pathstring += "," + y(cy).toFixed();
      // and back to the center to draw the left side
      h_pathstring += "M" + x(cx).toFixed();
      h_pathstring += "," + y(cy).toFixed();
      h_pathstring += "L" + xd[0].toFixed();
      h_pathstring += "," + y(cy).toFixed();
      // start in the center and draw to the top edge
      v_pathstring += "M" + x(cx).toFixed();
      v_pathstring += "," + y(cy).toFixed();
      v_pathstring += "L" + x(cx).toFixed();
      v_pathstring += "," + yd[1].toFixed();
      // and back to the center to draw the bottom side
      v_pathstring += "M" + x(cx).toFixed();
      v_pathstring += "," + y(cy).toFixed();
      v_pathstring += "L" + x(cx).toFixed();
      v_pathstring += "," + yd[0].toFixed();

      return [h_pathstring, v_pathstring];
    };

    var state_to_paths = function state_to_paths(state) {
      // convert from cx, cy, angle_offset and angle_range to paths for
      // boundaries and center lines

      // calculate angles of graph corners
      if (show_lines) {
        var _center_to_paths = center_to_paths(state.cx, state.cy),
            _center_to_paths2 = _slicedToArray(_center_to_paths, 2),
            h_path = _center_to_paths2[0],
            v_path = _center_to_paths2[1];

        return [{
          "path": h_path,
          "classname": "horizontal crosshair"
        }, {
          "path": v_path,
          "classname": "vertical crosshair"
        }];
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

    var drag_center = d3.drag().on("drag", dragmove_center).on("start", function () {
      d3.event.sourceEvent.stopPropagation();
    });

    var drag_lines = d3.drag().on("drag", dragmove_lines).on("start", function () {
      d3.event.sourceEvent.stopPropagation();
    });

    function interactor(selection) {
      var group = selection.append("g").classed("interactors interactor-" + name, true).style("cursor", cursor);
      var lines_group = group.append("g").attr("class", "lines_group").style("fill", "none").style("stroke", state.color1).style("stroke-width", "4px");

      var lines = lines_group.selectAll(".lines").data(state_to_paths(state)).enter().append("path").attr("class", function (d) {
        return d['classname'];
      }).classed("lines", true).attr("d", function (d) {
        return d['path'];
      });
      if (!fixed) lines.call(drag_lines);

      var center_group = group.append("g").classed("center_group", true).attr("fill", state.color1).selectAll("center").data(state_to_center(state)).enter().append("circle").classed("center", true).attr("r", point_radius).attr("cx", function (d) {
        return x(d[0]);
      }).attr("cy", function (d) {
        return y(d[1]);
      });
      if (!fixed) center_group.call(drag_center);

      interactor.update = function (preventPropagation) {
        group.select('.center').attr("cx", x(state.cx)).attr("cy", y(state.cy));

        group.selectAll('.lines').data(state_to_paths(state)).attr("d", function (d) {
          return d['path'];
        });

        // fire!
        if (!preventPropagation) {
          dispatch.call("update");
        }
      };
    }

    function dragmove_center() {
      state.cx = x.invert(x(state.cx) + d3.event.dx);
      state.cy = y.invert(y(state.cy) + d3.event.dy);
      interactor.update();
    }

    function dragmove_lines() {
      if (d3.select(this).classed("vertical")) {
        state.cx = x.invert(x(state.cx) + d3.event.dx);
      } else if (d3.select(this).classed("horizontal")) {
        state.cy = y.invert(y(state.cy) + d3.event.dy);
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
    interactor.dispatch = dispatch;

    return interactor;
  }
});
