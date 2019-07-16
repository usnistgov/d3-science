"use strict";
import * as d3 from 'd3';
//import {event as currentEvent} from 'd3';

export default overlayInteractor;

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

  var show_overlay = (state.show_overlay == null) ? true : state.show_overlay;
    
  function interactor(selection) {
    var group = selection.append("g")
      .classed("interactors interactor-" + name, true)
    
    var foreignObject = group.append("foreignObject")

    // add embedded canvas to embedded body
    var canvas = foreignObject.append("xhtml:canvas")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .classed("overlay", true)
      //.attr("x", 0)
      //.attr("y", 0)
      .style("width", "100%")
      .style("height", "100%")
      //.attr("width", 100)
      //.attr("height", 200)
      //.attr("width", canvasDim.width)
      //.attr("height", canvasDim.height)
      .style("cursor", "crosshair")
    
    var context = canvas.node().getContext('2d');
    context.fillStyle = 'rgba(0,200,0,0.7)';
    context.fillRect(0,0,50,75);
    
    interactor.update = function(preventPropagation) {      
      // fire!
      
      //let [w0, w1] = x.range();
      //let [h0, h1] = y.range();
      //let width = Math.abs(w0 - w1);
      //let height = Math.abs(h0 - h1);
      let width = Math.abs(x(state.dims.xmax) - x(state.dims.xmin));
      let height = Math.abs(y(state.dims.ymax) - y(state.dims.ymin));
      let top = Math.min(y(state.dims.ymax), y(state.dims.ymin));
      let left = Math.min(x(state.dims.xmax), x(state.dims.xmin));
      foreignObject
        .attr("width", width)
        .attr("height", height)
        .attr("x", left)
        .attr("y", top)

      console.log(canvas);
      if (canvas.attr("width") != state.dims.xdim) {
        canvas.attr("width", state.dims.xdim);
        //canvas.style("width", width + "px");
      }
      if (canvas.attr("height") != state.dims.ydim) {
        canvas.attr("height", state.dims.ydim);
        //canvas.style("height", height + "px")
      }
      
      var context = canvas.node().getContext('2d');
      context.fillStyle = 'rgba(0,200,0,0.7)';
      context.fillRect(0,0,state.dims.xdim, state.dims.ydim);

      //console.log(get_sxdx());
      if (!preventPropagation) {
        dispatcher.call("update");
      }
    }
  }
  
  function get_sxdx(){
    let dims = state.dims;
    var delta_x = (dims.xmax - dims.xmin)/(dims.xdim),
        delta_y = (dims.ymax - dims.ymin)/(dims.ydim);
    
    var graph_xmax = Math.max.apply(Math, x.domain()),
        graph_xmin = Math.min.apply(Math, x.domain()),
        graph_ymax = Math.max.apply(Math, y.domain()),
        graph_ymin = Math.min.apply(Math, y.domain());
    
    var xmin = Math.max(graph_xmin, dims.xmin), xmax = Math.min(graph_xmax, dims.xmax);
    var ymin = Math.max(graph_ymin, dims.ymin), ymax = Math.min(graph_ymax, dims.ymax);
    if (debug) {
      console.log('x', xmin,xmax, 'y', ymin,ymax, 'w', (xmax-xmin), 'h', (ymax-ymin));
      console.log('dims', dims);
    }
    
    var sx  = (xmin - dims.xmin)/delta_x, sy  = (dims.ymax - ymax)/delta_y,
      sx2 = (xmax - dims.xmin)/delta_x, sy2 = (dims.ymax - ymin)/delta_y,
      sw = sx2 - sx, sh = sy2 - sy;
    if (debug)
      console.log('sx', sx, 'sy', sy, 'sw', sw, 'sh', sh, '   sx2 ', sx2, 'sy2 ', sy2);
    
    var dx = x(xmin),
      dy = y(ymax),
      dw = x(xmax) - dx, 
      dh = y(ymin) - dy;
    if (debug)
      console.log('dx', dx, 'dy', dy, 'dw', dw, 'dh', dh);
    return {sx:sx, sy:sy, sw:sw, sh:sh, dx:dx, dy:dy, dw:dw, dh:dh}
  };
  
  interactor.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    return interactor;
  };

  interactor.y = function(_) {
    if (!arguments.length) return y;
    y = _;
    return interactor;
  };

  interactor.state = state;
  interactor.dispatch = dispatcher;
  
  return interactor
}
