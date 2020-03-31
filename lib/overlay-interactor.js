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
    global.overlayInteractor = mod.exports;
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

  exports.default = overlayInteractor;


  var debug = false;

  function overlayInteractor(state, x, y) {
    // dispatch is the d3 event dispatcher: should have event "update" register
    var name = state.name;
    var dispatcher = d3.dispatch("update");
    var x = x || d3.scaleLinear();
    var y = y || d3.scaleLinear();
    var backing_canvas = document.createElement("canvas");
    backing_canvas.setAttribute("width", state.dims.xdim);
    backing_canvas.setAttribute("height", state.dims.ydim);

    var show_overlay = state.show_overlay == null ? true : state.show_overlay;

    function interactor(selection) {
      var _redraw_backing = true;

      var group = selection.append("g").classed("interactors interactor-" + name, true);

      var foreignObject = group.append("foreignObject");

      // add embedded canvas to embedded body
      var canvas = foreignObject.append("xhtml:canvas").attr("xmlns", "http://www.w3.org/1999/xhtml").classed("overlay", true)
      //.attr("x", 0)
      //.attr("y", 0)
      .style("width", "100%").style("height", "100%")
      //.attr("width", 100)
      //.attr("height", 200)
      //.attr("width", canvasDim.width)
      //.attr("height", canvasDim.height)
      .style("cursor", "crosshair");

      interactor.update = function (preventPropagation) {
        var width = Math.abs(x(state.dims.xmax) - x(state.dims.xmin));
        var height = Math.abs(y(state.dims.ymax) - y(state.dims.ymin));
        var top = Math.min(y(state.dims.ymax), y(state.dims.ymin));
        var left = Math.min(x(state.dims.xmax), x(state.dims.xmin));

        var xdim = state.dims.xdim;
        var ydim = state.dims.ydim;

        foreignObject.attr("width", width).attr("height", height).attr("x", left).attr("y", top);

        if (canvas.attr("width") != xdim) {
          canvas.attr("width", xdim);
          _redraw_backing = true;
        }
        if (canvas.attr("height") != ydim) {
          canvas.attr("height", ydim);
          _redraw_backing = true;
        }

        if (_redraw_backing) {
          var context = canvas.node().getContext('2d');
          context.clearRect(0, 0, xdim, ydim);
          var size = xdim * ydim;
          var bi = context.createImageData(xdim, ydim);
          var di = bi.data;
          var cs = d3.rgb(state.color);
          var source = state.source_data;
          var p = 0;
          for (var i = 0; i < size; i++) {
            di[p++] = cs.r;
            di[p++] = cs.g;
            di[p++] = cs.b;
            di[p++] = source[i] * 255;
          }

          context.putImageData(bi, 0, 0);
        }

        //console.log(get_sxdx());
        if (!preventPropagation) {
          dispatcher.call("update");
        }
      };
    }

    function draw_mask(canvas) {
      var context = canvas.node().getContext('2d');
    }

    function get_sxdx() {
      var dims = state.dims;
      var delta_x = (dims.xmax - dims.xmin) / dims.xdim,
          delta_y = (dims.ymax - dims.ymin) / dims.ydim;

      var graph_xmax = Math.max.apply(Math, x.domain()),
          graph_xmin = Math.min.apply(Math, x.domain()),
          graph_ymax = Math.max.apply(Math, y.domain()),
          graph_ymin = Math.min.apply(Math, y.domain());

      var xmin = Math.max(graph_xmin, dims.xmin),
          xmax = Math.min(graph_xmax, dims.xmax);
      var ymin = Math.max(graph_ymin, dims.ymin),
          ymax = Math.min(graph_ymax, dims.ymax);
      if (debug) {
        console.log('x', xmin, xmax, 'y', ymin, ymax, 'w', xmax - xmin, 'h', ymax - ymin);
        console.log('dims', dims);
      }

      var sx = (xmin - dims.xmin) / delta_x,
          sy = (dims.ymax - ymax) / delta_y,
          sx2 = (xmax - dims.xmin) / delta_x,
          sy2 = (dims.ymax - ymin) / delta_y,
          sw = sx2 - sx,
          sh = sy2 - sy;
      if (debug) console.log('sx', sx, 'sy', sy, 'sw', sw, 'sh', sh, '   sx2 ', sx2, 'sy2 ', sy2);

      var dx = x(xmin),
          dy = y(ymax),
          dw = x(xmax) - dx,
          dh = y(ymin) - dy;
      if (debug) console.log('dx', dx, 'dy', dy, 'dw', dw, 'dh', dh);
      return { sx: sx, sy: sy, sw: sw, sh: sh, dx: dx, dy: dy, dw: dw, dh: dh };
    };

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
