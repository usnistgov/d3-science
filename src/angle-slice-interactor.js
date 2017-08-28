"use strict";
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';

export default angleSliceInteractor;

function angleSliceInteractor(state, x, y) {
  // dispatch is the d3 event dispatcher: should have event "update" register
  // state: {cx: ..., cy: ..., angle_offset: ..., angle_range: ...}
  // angle is in pixel coords
  var name = state.name;
  var point_radius = ( state.point_radius == null ) ? 5 : state.point_radius;
  var dispatch = d3.dispatch("update");
  var x = x || d3.scaleLinear();
  var y = y || d3.scaleLinear();
  
  // TODO: need to check for linear scale somehow - doesn't work otherwise

  var show_points = (state.show_points == null) ? true : state.show_points;
  var show_lines = (state.show_lines == null) ? true : state.show_lines;
  var show_center = (state.show_center == null) ? true : state.show_center;
  var fixed = (state.fixed == null) ? false : state.fixed;
  var cursor = (fixed) ? "auto" : "move";
  
  var angle_to_path = function(cx, cy, angle) {
    var yd = y.range(),
        xd = x.range(),
        rm = Math.sqrt(Math.pow(xd[1] - xd[0], 2) + Math.pow(yd[1] - yd[0], 2));        
        
    var s = Math.sin(angle),
        c = Math.cos(angle),
        cxp = x(cx),
        cyp = y(cy);
        
    var y1 = cyp - rm * s,
        y2 = cyp + rm * s,
        x1 = cxp + rm * c,
        x2 = cxp - rm * c;
        
    var pathstring = ""; 
    // start in the center and draw to the edge
    pathstring += "M" + cxp.toFixed();
    pathstring += "," + cyp.toFixed();
    pathstring += "L" + x1.toFixed();
    pathstring += "," + y1.toFixed();
    if (state.mirror) {
      // and back to the center to draw the other sector
      pathstring += "M" + cxp.toFixed();
      pathstring += "," + cyp.toFixed();
      pathstring += "L" + x2.toFixed();
      pathstring += "," + y2.toFixed();
    }
    return pathstring
  }
         
  var state_to_paths = function(state) {
    // convert from cx, cy, angle_offset and angle_range to paths for
    // boundaries and center lines
    
    // calculate angles of graph corners
    if (show_lines) {
      var centerline = angle_to_path(state.cx, state.cy, state.angle_offset), 
          upperline = angle_to_path(state.cx, state.cy, state.angle_offset + state.angle_range), 
          lowerline = angle_to_path(state.cx, state.cy, state.angle_offset - state.angle_range);
      
      return [
        {
          "path": centerline,
          "classname": "centerline"
        },
        {
          "path": upperline, 
          "classname": "upperline"
        },
        {
          "path": lowerline, 
          "classname": "lowerline"
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
        
      group.selectAll('.edge').data(state_to_paths(state))
        .attr("cx", function(d) {return x(d['cx'])})
        .attr("cy", function(d) {return y(d['cy'])})
        .attr("rx", function(d) {return Math.abs(x(d['rx'] + d['cx']) - x(d['cx']))})
        .attr("ry", function(d) {return Math.abs(y(d['ry'] + d['cy']) - y(d['cy']))});
        
      // fire!
      if (!preventPropagation) {
        dispatch.call("update");
      }
    }
  }
  
  function dragmove_corner(d) {
    var new_x = x.invert(currentEvent.x),
        new_y = y.invert(currentEvent.y);
    var vertex = parseInt(d3.select(this).attr("vertex"));  
    // enforce relationship between corners:
    switch (vertex) {
      case 0:
        state.rx = new_x - state.cx;
        break
      case 1:
        state.ry = new_y - state.cy;
        break
      default:
    }
    interactor.update();
  }
  
  function dragmove_center() {
    state.cx = x.invert(x(state.cx) + currentEvent.dx);
    state.cy = y.invert(y(state.cy) + currentEvent.dy);
    interactor.update();
  }
  
  
  function dragmove_lines() {
    var new_angle = Math.atan2(y(state.cy) - currentEvent.y, currentEvent.x - x(state.cx));
    if (d3.select(this).classed("centerline")) {
      state.angle_offset = new_angle;
    }
    else if (d3.select(this).classed("upperline")) {
      state.angle_range = new_angle - state.angle_offset;
    }
    else if (d3.select(this).classed("lowerline")) {
      state.angle_range = -(new_angle - state.angle_offset);
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
