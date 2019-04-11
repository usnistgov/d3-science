"use strict";
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';

export default crosshairInteractor;

function crosshairInteractor(state, x, y) {
  // dispatch is the d3 event dispatcher: should have event "update" register
  // state: {cx: ..., cy: ..., angle_offset: ..., angle_range: ...}
  // angle is in pixel coords
  var name = state.name;
  var point_radius = ( state.point_radius == null ) ? 5 : state.point_radius;
  var dispatch = d3.dispatch("update");
  var x = x || d3.scaleLinear();
  var y = y || d3.scaleLinear();
  
  // TODO: need to check for linear scale somehow - doesn't work otherwise

  var show_lines = (state.show_lines == null) ? true : state.show_lines;
  var show_center = (state.show_center == null) ? true : state.show_center;
  var fixed = (state.fixed == null) ? false : state.fixed;
  var cursor = (fixed) ? "auto" : "move";
  
  var center_to_paths = function(cx, cy) {
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
  }
         
  var state_to_paths = function(state) {
    // convert from cx, cy, angle_offset and angle_range to paths for
    // boundaries and center lines
    
    // calculate angles of graph corners
    if (show_lines) {
      var [h_path, v_path] = center_to_paths(state.cx, state.cy);
      return [
        {
          "path": h_path,
          "classname": "horizontal crosshair"
        },
        {
            "path": v_path,
            "classname": "vertical crosshair"
        }
      ]
    }
    else {
      return [];
    }
  }
  
  var state_to_center = function(state) {
    if (show_center) {
      return [
        [state.cx, state.cy],
      ]
    }
    else { 
      return [];
    }
  }
  
  var drag_center = d3.drag()
    .on("drag", dragmove_center)
    .on("start", function() { currentEvent.sourceEvent.stopPropagation(); });  
    
  var drag_lines = d3.drag()
    .on("drag", dragmove_lines)
    .on("start", function() { currentEvent.sourceEvent.stopPropagation(); });
  

  function interactor(selection) {
    var group = selection.append("g")
      .classed("interactors interactor-" + name, true)
      .style("cursor", cursor)
    var lines_group = group.append("g")
          .attr("class", "lines_group")
          .style("fill", "none")
          .style("stroke", state.color1)
          .style("stroke-width", "4px");
          
    var lines = lines_group.selectAll(".lines")
      .data(state_to_paths(state))
        .enter().append("path")
        .attr("class", function(d) {return d['classname']})
        .classed("lines", true)
        .attr("d", function(d) {return d['path']})    
    if (!fixed) lines.call(drag_lines);
    
    var center_group = group.append("g")
      .classed("center_group", true)
      .attr("fill", state.color1)
      .selectAll("center")
      .data(state_to_center(state))
        .enter().append("circle")
        .classed("center", true)
        .attr("r", point_radius)
        .attr("cx", function(d) {return x(d[0])})
        .attr("cy", function(d) {return y(d[1])})
    if (!fixed) center_group.call(drag_center);

    interactor.update = function(preventPropagation) {
      group.select('.center')
        .attr("cx", x(state.cx))
        .attr("cy", y(state.cy));
      
      group.selectAll('.lines')
        .data(state_to_paths(state))
        .attr("d", function(d) {return d['path']})
        
      // fire!
      if (!preventPropagation) {
        dispatch.call("update");
      }
    }
  }
  
  function dragmove_center() {
    state.cx = x.invert(x(state.cx) + currentEvent.dx);
    state.cy = y.invert(y(state.cy) + currentEvent.dy);
    interactor.update();
  }
  
  
  function dragmove_lines() {
    if (d3.select(this).classed("vertical")) {
      state.cx = x.invert(x(state.cx) + currentEvent.dx);
    }
    else if (d3.select(this).classed("horizontal")) {
        state.cy = y.invert(y(state.cy) + currentEvent.dy);
    }
    interactor.update();
  }
  
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
  interactor.dispatch = dispatch;
  
  return interactor
}
