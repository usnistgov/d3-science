"use strict";
import * as d3 from "d3";

export default rectangleInteractor;

function rectangleInteractor(state, x, y) {
  // x, y are d3.scale objects (linear, log, etc) from parent
  // dispatch is the d3 event dispatcher: should have event "update" register
  //var state = options;
  var name = state.name;
  var radius = ( state.radius == null ) ? 5 : state.radius;
  var event_name = "rectangle." + state.name;
  var dispatch = d3.dispatch("update");
  var x = x || d3.scaleLinear();
  var y = y || d3.scaleLinear();
  var fixed = (state.fixed == null) ? false : state.fixed;
  var cursor = (fixed) ? "auto" : "move";

  var line = d3.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });
         
  var state_to_pairs = function(state) {
    // convert from xmin, xmax... to pairs of points for rectangle
    if (state.show_lines != false) {
      return [
        [[state.xmin, state.ymin], [state.xmax, state.ymin]],
        [[state.xmax, state.ymin], [state.xmax, state.ymax]],
        [[state.xmax, state.ymax], [state.xmin, state.ymax]],
        [[state.xmin, state.ymax], [state.xmin, state.ymin]]
      ]
    }
    else {
      return [];
    }
  }
  
  var state_to_points = function(state) {
    if (state.show_points != false) {
      return [
        [state.xmin, state.ymin],
        [state.xmax, state.ymin],
        [state.xmax, state.ymax],
        [state.xmin, state.ymax],
      ]
    }
    else { 
      return [];
    }
  }
  
  var state_to_center = function(state) {
    if (state.show_center != false) {
      return [
        [x.invert((x(state.xmax) + x(state.xmin)) / 2.0),
         y.invert((y(state.ymax) + y(state.ymin)) / 2.0)]
      ]
    }
    else {
      return [];
    }
  }
  
  var drag_corner = d3.drag()
    .on("drag", dragmove_corner)
    .on("start", function() { d3.event.sourceEvent.stopPropagation(); });
  
  var drag_center = d3.drag()
    .on("drag", dragmove_center)
    .on("start", function() { d3.event.sourceEvent.stopPropagation(); });  
    
  var drag_edge = d3.drag()
    .on("drag", dragmove_edge)
    .on("start", function() { d3.event.sourceEvent.stopPropagation(); });
  

  function interactor(selection) {
    var group = selection.append("g")
      .classed("interactors interactor-" + name, true)
      .style("cursor", cursor)
    var edges = group.append("g")
          .attr("class", "edges")
          .style("stroke", state.color1)
          .style("stroke-linecap", "round")
          .selectAll(".edge")
        .data(state_to_pairs(state))
          .enter().append("path")
          .classed("edge", true)
          .attr("side", function(d,i) { return i.toFixed()})
          .attr("fill", "none")
          .attr("stroke-width", "4px")
          .attr("d", line)
    if (!fixed) edges.call(drag_edge);
      
    var corners = group.append("g")
      .classed("corners", true)
      .attr("fill", state.color1)
      .selectAll("corner")
      .data(state_to_points(state))
        .enter().append("circle")
        .classed("corner", true)
        .attr("vertex", function(d,i) { return i.toFixed()})
        .attr("r", radius)
        .attr("cx", function(d) {return x(d[0])})
        .attr("cy", function(d) {return y(d[1])})
    if (!fixed) corners.call(drag_corner);
    
    var center_group = group.append("g")
      .classed("center_group", true)
      .attr("fill", state.color1)
      .selectAll("center")
      .data(state_to_center(state))
        .enter().append("circle")
        .classed("center", true)
        .attr("r", radius)
        .attr("cx", function(d) {return x(d[0])})
        .attr("cy", function(d) {return y(d[1])})
    if (!fixed) center_group.call(drag_center);

    interactor.update = function() {
      group.selectAll('.center').data(state_to_center(state))
        .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); });
        
      group.selectAll('.corner').data(state_to_points(state))
        .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); });
        
      group.selectAll('.edge').data(state_to_pairs(state))
        .attr("d", line);
    }
  }
  
  function dragmove_center() {
    state.xmin = x.invert(x(state.xmin) + d3.event.dx);
    state.xmax = x.invert(x(state.xmax) + d3.event.dx);
    state.ymin = y.invert(y(state.ymin) + d3.event.dy);
    state.ymax = y.invert(y(state.ymax) + d3.event.dy);
    interactor.update();
    dispatch.call("update");
  }
  
  function dragmove_corner() {
    let grid_spacing = state.grid_spacing;
    let new_x = x.invert(d3.event.x);
    let new_y = y.invert(d3.event.y);
    if (grid_spacing) {
      new_x = Math.round(new_x/grid_spacing) * grid_spacing;
      new_y = Math.round(new_y/grid_spacing) * grid_spacing;
    }
    var vertex = parseInt(d3.select(this).attr("vertex"));  
    // enforce relationship between corners:
    switch (vertex) {
      case 0:
        state.xmin = new_x;
        state.ymin = new_y;
        break
      case 1:
        state.xmax = new_x;
        state.ymin = new_y;
        break
      case 2:
        state.xmax = new_x;
        state.ymax = new_y;
        break
      case 3:
        state.xmin = new_x;
        state.ymax = new_y;
        break
      default:
        console.log("default", d3.event, d3.select(this));
    }
    interactor.update();
    dispatch.call("update");
  }
  
  function dragmove_edge() {
    let grid_spacing = state.grid_spacing;
    let new_x = x.invert(d3.event.x);
    let new_y = y.invert(d3.event.y);
    if (grid_spacing) {
      new_x = Math.round(new_x/grid_spacing) * grid_spacing;
      new_y = Math.round(new_y/grid_spacing) * grid_spacing;
    }
    let side = parseInt(d3.select(this).attr("side"));
    // enforce relationship between edges and corners:
    switch (side) {
      case 0:
        state.ymin = new_y;
        break
      case 1:
        state.xmax = new_x;
        break
      case 2:
        state.ymax = new_y;
        break
      case 3:
        state.xmin = new_x;
        break
      default:
        console.log("default", d3.event, d3.select(this));
    }
    interactor.update();
    dispatch.call("update");
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
