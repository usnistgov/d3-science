"use strict";
import * as d3 from 'd3';
import {extend} from './jquery-extend';

export default profileInteractor;

function profileInteractor(state, x, y) {
  // x, y are d3.scale objects (linear, log, etc) from parent
  // dispatch is the d3 event dispatcher: should have event "update" register
  //var state = options;
  var name = state.name;
  var radius = ( state.radius == null ) ? 5 : state.radius;
  var event_name = "profile." + state.name;
  var dispatch = d3.dispatch("update","changed");
  var x = x || d3.scaleLinear();
  var y = y || d3.scaleLinear();
  var interpolation = (state.interpolation == null) ? 'StepBefore' : state.interpolation;
  var prevent_crossing = (state.prevent_crossing == null) ? false : state.prevent_crossing;
  var show_points = (state.show_points == null) ? true : state.show_points;
  var show_lines = (state.show_lines == null) ? true : state.show_lines;
  var close_path = (state.close_path == null) ? false : state.close_path;
  var fixed = (state.fixed == null) ? false : state.fixed;
  var cursor = (fixed) ? "auto" : "move";
  var draw_extensions = (state.draw_extensions == null) ? true : false;
  var series = state.series || [];
  var constraints = [];

  var line = d3.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); })
    .curve(d3["curve" + interpolation]);  
         
  
  function data_to_pairs(data, column) {
    var xi = 0;    
    return data.map(function(d, i) { return [xi+=d.thickness, d[column], column] });
  }
  
  function data_to_arrays(data) {
    //var columns = ["sld_n", "sld_m", "theta_m"];
    return series.map(function(s) { return data_to_pairs(data, s.id) });
  }
  
  function data_to_edges(data) {
    return series.map(function(s) { 
      var xi = 0,
          column = s.id,
          yi = data[0][column],
          edges = [];
      data.forEach(function(d, i) {
        edges.push([[xi, yi, column, i, 'v'], [xi, yi=d[column], column, i, 'v']])
        edges.push([[xi, yi, column, i, 'h'], [xi+=d.thickness, yi, column, i, 'h']])
      });
      return edges;
    })
  } 
  
  function arrays_to_data(arrays) {
    var columns = series.map(function(s) { return s.id });
    var x = 0;
    var output_array = [];
    // assume all arrays are the same length:
    arrays[0].forEach(function(a,i) {
      var d = {};
      columns.forEach(function(c, ci) {
        d[c] = arrays[ci][i][1];
      });
      d.thickness = a[0] - x;
      if (d.thickness < 0) {
        d.thickness = 0;
      } else {
        x = a[0];
      }
      output_array[i] = d;
    });
    return output_array;
  }
  
  var colors = [
      "#4bb2c5", 
      "#EAA228", 
      "#c5b47f", 
      "#579575", 
      "#839557", 
      "#958c12", 
      "#953579", 
      "#4b5de4", 
      "#d8b83f", 
      "#ff5800", 
      "#0085cc", 
      "#c747a3", 
      "#cddf54", 
      "#FBD178", 
      "#26B4E3", 
      "#bd70c7"
  ] 
  
  var drag_corner = d3.drag()
    .on("drag", dragmove_corner)
    .on("start", function() { d3.event.sourceEvent.stopPropagation(); });
    
  var drag_edge = d3.drag()
    .on("drag", dragmove_edge)
    .on("start", function() { d3.event.sourceEvent.stopPropagation(); });
  
  function interactor(selection) {
    var group = selection.append("g")
      .classed("interactors interactor-" + name, true)
      .style("cursor", cursor)

    interactor.update = function() {
      var edge_groups_sel = group.selectAll("g.edges")
        .data(data_to_edges(state.profile_data))
      edge_groups_sel
        .enter().append("g")
            .attr("class", "edges")
            .style("stroke", function(d,i) {return (series[i] || {}).color1 || colors[i] })
            .style("stroke-linecap", "round")
            .style("stroke-width", "4px")
            .style("fill", "none")
      edge_groups_sel
        .exit().remove()
      
      var corner_groups_sel = group.selectAll("g.corners")
        .data(data_to_arrays(state.profile_data))
      corner_groups_sel
        .enter().append("g")
        .classed("corners", true)
        .attr("fill", function(d,i) {return (series[i] || {}).color1 || colors[i] });
      corner_groups_sel
        .exit().remove()
        
      corner_groups_sel.each(function(d,i) {
        var corners = d3.select(this).selectAll('.corner').data(d)
        var new_corners = corners.enter().append("circle")
          .classed("corner", true)
          .attr("vertex", function(dd,ii) { return ii.toFixed()})
          .attr("r", radius);
        if (!fixed) new_corners.call(drag_corner);
        corners
          .attr("cx", function(dd) { return x(dd[0]); })
          .attr("cy", function(dd) { return y(dd[1]); })
          .on("click", function() { 
            corner_groups_sel.selectAll("circle.corner")
              .attr("r", radius)
              .classed("selected", false);
            d3.select(this).attr("r", radius*1.2).classed("selected", true);
          })
            
        corners.exit().remove();
      });
        
      edge_groups_sel.each(function(d,i) {
        var edges = d3.select(this).selectAll('.edge').data(d);
        var new_edges = edges.enter().append("path")
          .classed("edge", true)
          .attr("side", function(dd,ii) { return ii.toFixed()})
          .attr("direction", function(d) { return d[0][4] })
        if (!fixed) new_edges.call(drag_edge);
        d3.select(this).selectAll('.edge').on("dblclick", function(dd, ii) {
          var direction = d3.select(this).attr("direction"),
              old_row_index = dd[0][3],
              old_row = state.profile_data[old_row_index],
              new_row = extend(true, {}, old_row); 
          if (direction == "h") {
            var xi = x.invert(d3.mouse(this)[0]),
                thickness_below = xi - d[ii][0][0],
                thickness_above = d[ii][1][0] - xi;
            new_row.thickness = thickness_below;
            old_row.thickness = thickness_above;
          }
          else if (direction == "v") {
            var yi = y.invert(d3.mouse(this)[1]),
                col = state.series[i].id;
            new_row.thickness = 0;
            new_row[col] = yi;
          }            
          state.profile_data.splice(old_row_index, 0, new_row); 
          d3.event.preventDefault();
          d3.event.stopPropagation();
          dispatch.call("changed", null, state.profile_data);
          interactor.update();
        })
                
        edges.exit().remove();
        if (draw_extensions) {
          var left_d = extend(true, [], d[0][0]);
          left_d[0] = x.invert(-10);
          var left_ext = d3.select(this).selectAll('.left.extension')
            .data([[left_d, d[0][0]]])
            .enter().append("path")
            .classed("left extension", true)
            .attr("direction", "h");
          if (!fixed) left_ext.call(drag_edge);
          
          var right_d = extend(true, [], d.slice(-1)[0][0]);
          right_d[0] = x.invert(x.range()[1]+10);
          var right_ext = d3.select(this).selectAll('.right.extension')
            .data([[right_d, d.slice(-1)[0][0]]])
            .enter().append("path")
            .classed("right extension", true)
            .attr("direction", "h");
          if (!fixed) right_ext.call(drag_edge);
        }
        d3.select(this).selectAll(".edge, .extension").attr("d", line).attr("visibility", (state.show_lines) ? "visible" : "hidden");
        
      });
        
      // fire!
      dispatch.call("update");
    }
    
    interactor.update();
  }
  
  function dragmove_corner(d,i) {
    var new_x = x.invert(d3.event.x),
        new_y = y.invert(d3.event.y);
    var new_dx = x.invert(x(0) + d3.event.dx),
        new_dy = y.invert(y(0) + d3.event.dy);
    state.profile_data[i].thickness += new_dx; //= Math.max(0, state.profile_data[i].thickness + new_dx);
    state.profile_data[i][d[2]] = new_y;
    constraints.forEach(function(constraint) {
      constraint(state.profile_data, d, i);
    });
    dispatch.call("changed", null, state.profile_data);
    interactor.update();
  }
  
  function dragmove_edge(d,i) {
    var new_x = x.invert(d3.event.x),
        new_y = y.invert(d3.event.y);
    var new_dx = x.invert(x(0) + d3.event.dx),
        new_dy = y.invert(y(0) + d3.event.dy);
    var direction = d3.select(this).attr("direction"),
        old_row_index = d[0][3];
    if (direction == "h") {
      state.profile_data[old_row_index][d[0][2]] = new_y;
    }
    else if (direction == "v") {
      var new_thickness = new_x - d[0][0];
      old_row_index -= 1;
      if (old_row_index >= 0) {
        state.profile_data[old_row_index].thickness += new_dx;
      }
    }
    constraints.forEach(function(constraint) {
      constraint(state.profile_data, d, old_row_index);
    });
    dispatch.call("changed", null, state.profile_data);
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
  
  interactor.constraints = function(_) {
    if (!arguments.length) return constraints;
    constraints = _;
    return interactor;
  };
  
  interactor.state = state;
  interactor.dispatch = dispatch;
  
  return interactor
}
