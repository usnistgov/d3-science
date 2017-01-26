"use strict";
import * as d3 from 'd3';

export default polygonInteractor;

function polygonInteractor(state, x, y) {
  // x, y are d3.scale objects (linear, log, etc) from parent
  // dispatch is the d3 event dispatcher: should have event "update" register
  //var state = options;
  var name = state.name;
  var radius = ( state.radius == null ) ? 5 : state.radius;
  var event_name = "polygon." + state.name;
  var dispatch = d3.dispatch("update");
  var x = x || d3.scaleLinear();
  var y = y || d3.scaleLinear();
  var interpolation = (state.interpolation == null) ? 'Linear' : state.interpolation;
  var prevent_crossing = (state.prevent_crossing == null) ? false : state.prevent_crossing;
  var show_points = (state.show_points == null) ? true : state.show_points;
  var show_lines = (state.show_lines == null) ? true : state.show_lines;
  var close_path = (state.close_path == null) ? false : state.close_path;
  var fixed = (state.fixed == null) ? false : state.fixed;
  var cursor = (fixed) ? "auto" : "move";

  var line = d3.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); })
    .curve(d3["curve" + interpolation]);    
         
  var drag_corner = d3.drag()
    .on("drag", dragmove_corner)
    .on("start", function() { d3.event.sourceEvent.stopPropagation(); });
  
  function interactor(selection) {
    var group = selection.append("g")
      .classed("interactors interactor-" + name, true)
      .style("cursor", cursor)
    var edge_group = group.append("g")
          .attr("class", "edges")
          .style("stroke", state.color1)
          .style("stroke-linecap", "round")
          .style("stroke-width", "4px")
          .style("fill", "none")
    //if (!fixed) edges.call(drag_edge);
      
    var corner_group = group.append("g")
      .classed("corners", true)
      .attr("fill", state.color1)

    interactor.update = function() {
        
      var corners = corner_group.selectAll('.corner').data(state.points)
      var new_corners = corners.enter().append("circle")
        .classed("corner", true)
        .attr("vertex", function(d,i) { return i.toFixed()})
        .attr("r", radius);
      if (!fixed) new_corners.call(drag_corner);
      corners
        .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); })
        .attr("visibility", (state.show_points) ? "visible" : "hidden");
      corners.exit().remove();
      
      var edge_data = (state.close_path && state.points.length > 1) ?  state.points.concat([state.points[0]]) : state.points;
      var edges = edge_group.selectAll('.edge').data([edge_data]);  
      edges.enter().append("path")
        .classed("edge", true)
        .attr("side", function(d,i) { return i.toFixed()});
      edges
        .attr("d", line)
        .attr("visibility", (state.show_lines) ? "visible" : "hidden"); 
      edges.exit().remove();
        
      // fire!
      dispatch.call("update");
    }
    
    interactor.update();
  }
  
  function dragmove_corner(d,i) {
    var new_x = x.invert(d3.event.x),
        new_y = y.invert(d3.event.y);
    var sp = state.points;
    if (prevent_crossing && sp[i+1] != null && sp[i+1][0] <= new_x) {
      new_x = sp[i+1][0]
    }
    if (prevent_crossing && sp[i-1] != null && sp[i-1][0] >= new_x) {
      new_x = sp[i-1][0]
    }
    state.points[i] = [new_x, new_y];
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
