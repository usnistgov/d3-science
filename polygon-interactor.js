"use strict";

function polygonInteractor(state, x, y) {
  // x, y are d3.scale objects (linear, log, etc) from parent
  // dispatch is the d3 event dispatcher: should have event "update" register
  //var state = options;
  var name = state.name;
  var radius = ( state.radius == null ) ? 5 : state.radius;
  var event_name = "polygon." + state.name;
  var dispatch = d3.dispatch("update");
  var x = x || d3.scale.linear();
  var y = y || d3.scale.linear();
  var show_points = (state.show_points == null) ? true : state.show_points;
  var show_lines = (state.show_lines == null) ? true : state.show_lines;
  var close_path = (state.close_path == null) ? false : state.close_path;
  var fixed = (state.fixed == null) ? false : state.fixed;
  var cursor = (fixed) ? "auto" : "move";

  var line = d3.svg.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });
         
  
  var drag_corner = d3.behavior.drag()
    .on("drag", dragmove_corner)
    .on("dragstart", function() { d3.event.sourceEvent.stopPropagation(); });
  
  function interactor(selection) {
    var group = selection.append("g")
      .classed("interactors interactor-" + name, true)
      .style("cursor", cursor)
    var edges = group.append("g")
          .attr("class", "edges")
          .style("stroke", state.color1)
          .style("stroke-linecap", "round")
          .selectAll(".edge")
        .data([state.points])
          .enter().append("path")
          .classed("edge", true)
          .attr("side", function(d,i) { return i.toFixed()})
          .attr("fill", "none")
          .attr("stroke-width", "4px")
          .attr("d", line)
    //if (!fixed) edges.call(drag_edge);
      
    var corners = group.append("g")
      .classed("corners", true)
      .attr("fill", state.color1)
      .selectAll("corner")
      .data(state.points)
        .enter().append("circle")
        .classed("corner", true)
        .attr("vertex", function(d,i) { return i.toFixed()})
        .attr("r", radius)
        .attr("cx", function(d) {return x(d[0])})
        .attr("cy", function(d) {return y(d[1])})
    if (!fixed) corners.call(drag_corner);
    

    interactor.update = function() {
        
      group.selectAll('.corner').data(state.points)
        .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); });
        
      group.selectAll('.edge').data([state.points])
        .attr("d", line);
        
      // fire!
      dispatch.update();
    }
  }
  
  function dragmove_corner(d,i) {
    var new_x = x.invert(d3.event.x),
        new_y = y.invert(d3.event.y);
    var vertex = parseInt(d3.select(this).attr("vertex"));  
    //console.log(this, d, i);
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
