import * as d3 from 'd3';
import {extend} from './jquery-extend';

//var extend = jQuery.extend;
export default xyChart;

if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

function xyChart(options_override) {
  var debug=false;
  var options_defaults = {
    margin: {top: 10, right: 10, bottom: 75, left: 100},
    autoscale: true,
    show_points: true,
    show_line: true,
    show_errorbars: false,
    show_grid: true,
    numberOfTicks: 4,
    position_cursor: true,
    vcursor: false,
    hcursor: false,
    xlabel: "x-axis",
    ylabel: "y-axis",
    zlabel: "z-axis",
    errorbar_width: 12,
    xtransform: "linear",
    ytransform: "linear",
    legend: {show: false, left: 165, top: 15},
    axes: {
      xaxis: {label: "x-axis"},
      yaxis: {label: "y-axis"}
    },
    point_size: 2.5,
    series: new Array()
  }
    
  var options = extend(true, {}, options_defaults, options_override); // copy
    
  var id = d3.id();
  var interactors = [];
  
  this.options = options;
  var max_y = (options.max_y == null) ? -Infinity : options.max_y;
  var min_y = (options.min_y == null) ? Infinity : options.min_y;
  var max_x = (options.max_x == null) ? -Infinity : options.max_x;
  var min_x = (options.min_x == null) ? Infinity : options.min_x;
  var zoomRect = false;
  var zoomScroll = false;
  var is_zoomed = false; // zoomed state.
    
  var labels = options.series.map(function(d, i) { return d.label || i });

  var x = getScale(options.xtransform);
  var y = getScale(options.ytransform);
  var orig_x, orig_y, orig_z;
  var xAxis = d3.axisBottom(x),
      yAxis = d3.axisLeft(y),
      xAxisGrid = d3.axisBottom(x),
      yAxisGrid = d3.axisLeft(y);
  
  function zoomed() { 
    is_zoomed = true;
    if (d3.event && d3.event.transform) {
      // emulating old zoom behavior:
      var new_x = d3.event.transform.rescaleX(orig_x),
          new_y = d3.event.transform.rescaleY(orig_y);
      
      x.domain(new_x.domain());
      y.domain(new_y.domain());
    }
    update();
  }
  var zoom = d3.zoom().on("zoom.xy", zoomed);
  var base_zoom_offset = 0.05; // zoom out 5% from min and max by default;
  
  var source_data;
  
  function do_autoscale() {
    var extents;
    var merged_data = d3.merge(source_data);
    if (options.show_errorbars) {
      max_y = d3.extent(merged_data, function(d) {
        var yy = (d[2] && d[2].yupper != undefined) ? d[2].yupper : d[1];
        return (isFinite(y(yy))) ? yy : null;
      })[1];
      min_y = d3.extent(merged_data, function(d) {
        var yy = (d[2] && d[2].ylower != undefined) ? d[2].ylower : d[1];
        return (isFinite(y(yy))) ? yy : null;
      })[0];
      max_x = d3.extent(merged_data, function(d) {
        var xx = (d[2] && d[2].xupper != undefined) ? d[2].xupper : d[0];
        return (isFinite(x(xx))) ? xx : null;
      })[1];
      min_x = d3.extent(merged_data, function(d) {
        var xx = (d[2] && d[2].xlower != undefined) ? d[2].xlower : d[0];
        return (isFinite(x(xx))) ? xx : null;
      })[0];
    } else {
      extents = d3.extent(merged_data, function(d) { return isFinite(y(d[1]))? d[1] : null });
      min_y = extents[0];
      max_y = extents[1];
      extents = d3.extent(merged_data, function(d) { return isFinite(x(d[0]))? d[0] : null });
      min_x = extents[0];
      max_x = extents[1];
    }
    
    // if datasets are empty, don't break things.
    if (min_x == null) { min_x = 1; }
    if (max_x == null) { max_x = 1; }
    if (min_y == null) { min_y = 1; }
    if (max_y == null) { max_y = 1; }
    
    if (max_x == min_x) {
      max_x += (max_x * 0.1) || 0.1;
      min_x -= (min_x * 0.1) || 0.1;
    }
    if (max_y == min_y) {
      max_y += (max_y * 0.1) || 0.1;
      min_y -= (min_y * 0.1) || 0.1;
    }
    return {min_x: min_x, max_x: max_x, min_y: min_y, max_y: max_y}
  }
  chart.do_autoscale = do_autoscale;
    
  // make it possible to show single data points:
  if (min_x == max_x) {
    min_x -= 1;
    max_x += 1;
  }
  if (min_y == max_y) {
    min_y -= 1;
    max_y += 1;
  }
    
  var old_colors = [
    'steelblue',
    'green',
    'red',
    'purple'
  ]

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
  
  function chart(selection) {
    selection.each(function(data) {
      var outercontainer = d3.select(this),
        innerwidth = outercontainer.node().clientWidth,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - options.margin.right - options.margin.left,
        height = innerheight - options.margin.top - options.margin.bottom;
      chart.outercontainer = outercontainer;
      source_data = data;
      //chart.update = function() { outercontainer.transition().call(chart); };   
      chart.update = update;
      if (options.autoscale) {
        do_autoscale();
      }
      
      //************************************************************
      // Create Margins and Axis and hook our zoom function
      //************************************************************
	
	    x
          .domain([min_x, max_x])
          .range([0, width]);
       
      y
          .domain([min_y, max_y])
          .range([height, 0]);
          
      orig_x = x.copy();
      orig_y = y.copy();
            
      xAxisGrid
        .scale(x)
	      .tickSize(-height)
	      .ticks(options.numberOfTicks)
	      .tickPadding(10)	
        .tickFormat("");	
	
      yAxisGrid
        .scale(y)
	      .tickPadding(10)
	      .ticks(options.numberOfTicks)
	      .tickSize(-width)
        .tickFormat("");
        
      xAxis
        .scale(x)
        .ticks(options.numberOfTicks)
        .tickPadding(10);
      
      yAxis
        .scale(y)
        .ticks(options.numberOfTicks)
        .tickPadding(10);
            
      //zoom.x(x).y(y);

      //************************************************************
      // Generate our SVG object
      //************************************************************
      var svg = outercontainer.append("svg")
        .attr("class", "mainplot")
        //.call(zoom) // call this from zoomScroll setter
        .on("dblclick.zoom", null)
        //.on("dblclick.resetzoom", null)
        .on("dblclick.resetzoom", chart.resetzoom)
          
      var axes = svg.append("g")
        .attr("class", "axes")
        .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");
        
      var mainview = svg.append("g")
        .attr("class", "mainview")
        .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");  
      
      function drag_started() {
        if (!zoomRect) return;
        var e = mainview.node(),
            origin = d3.mouse(e),
            rect = mainview.append("rect").attr("class", "zoom");
            
        d3.event.on("drag", dragged).on("end", ended);

        function dragged(d) {
          var m = d3.mouse(e);
          m[0] = Math.max(0, Math.min(width, m[0]));
          m[1] = Math.max(0, Math.min(height, m[1]));
          rect.attr("x", Math.min(origin[0], m[0]))
            .attr("y", Math.min(origin[1], m[1]))
            .attr("width", Math.abs(m[0] - origin[0]))
            .attr("height", Math.abs(m[1] - origin[1]));
        }

        function ended() {
          d3.select("body").classed("noselect", false);
          var m = d3.mouse(e);
          m[0] = Math.max(0, Math.min(width, m[0]));
          m[1] = Math.max(0, Math.min(height, m[1]));
          if (m[0] !== origin[0] && m[1] !== origin[1]) {
            var x_domain = [origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b}),
                y_domain = [origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b});
            x.domain(x_domain);
            y.domain(y_domain);
            update();
          }
          rect.remove();
          is_zoomed = true;
        }
      }
      
      chart.zoomRect = function(_) {
        if (!arguments.length) return zoomRect;
        if (_ == zoomRect) { return }
        else {
          zoomRect = _;
          if (zoomRect == true) {
            var drag = d3.drag();
            drag.on("start", drag_started);
            svg.call(drag);
          } 
          else {
            svg.on('.drag', null);
          }
        }
        return chart;
      };
      
      chart.zoom = zoom;
      
      
        //.call(zoom);
      axes.append("g")
        .attr("class", "x axis")
        .append("text")
        .attr("class", "x axis-label")
        .attr("x", width/2.0)
        .attr("text-anchor", "middle")
        .attr("y", options.margin.bottom - 15)
      axes.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -options.margin.left + 15 )
        .attr("x", -height/2)
      
      mainview.append("defs").append("clipPath")
        .attr("id", "d3clip_" + id.toFixed()) // local def
        .append("rect")
        //.attr("x", 0) // x(min_x)) // options.margin.left)
        //.attr("y", 0)
	      .attr("width", width)
	      .attr("height", height);
	      
	    mainview.attr("clip-path", "url(#d3clip_" + id.toFixed() + ")");    
	    
      axes.append("g")
        .attr("class", "x grid");           
      axes.append("g")
        .attr("class", "y grid");
        
      mainview.append("rect")
        .classed("zoom-box", true)
        .attr("width", width)
        .attr("height", height)
        .style("visibility", "hidden")
        .attr("pointer-events", "all")
      
      // legend on top so it can be moved...
      mainview.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + [width-options.legend.left, options.legend.top] + ")");
        
      axes.select(".x.axis").call(xAxis);
      axes.select(".y.axis").call(yAxis);
      axes.select(".x.grid").call(xAxisGrid);
      axes.select(".y.grid").call(yAxisGrid);
      // remove added attr that blocks styling:
      axes.selectAll(".grid .tick line").attr("stroke", null);
      axes.select(".x.axis-label").html(((options.axes || {}).xaxis || {}).label || "x-axis");
      axes.select(".y.axis-label").html(((options.axes || {}).yaxis || {}).label || "y-axis");
      
      svg.attr("width", width + options.margin.left + options.margin.right)
          .attr("height", height + options.margin.top + options.margin.bottom);
                
      axes.selectAll("g.x")
        .attr("transform", "translate(0," + height + ")");
       
      chart.svg = svg;
      chart.g = svg.selectAll("g.mainview");
      chart.resetzoom(); // set to 10% zoom out.
	
      chart.draw_lines(data);
      chart.draw_errorbars(data);
      chart.draw_points(data);
      chart.draw_legend(data);
	  
      //************************************************************
      // Position cursor (shows position of mouse in data coords)
      //************************************************************
      if (options.position_cursor) {
        var pcurse_selection = mainview.selectAll(".position-cursor")
          .data([0])
        var position_cursor = pcurse_selection
          .enter().append("text")
            .attr("class", "position-cursor")
            .attr("x", width - 10)
            .attr("y", height - 10)
            .style("text-anchor", "end");
          
        var follow = function (){
          var mouse = d3.mouse(mainview.node());
          position_cursor.text(
            x.invert(mouse[0]).toPrecision(5) + 
            ", " + 
            y.invert(mouse[1]).toPrecision(5));
        }
          
          svg
            .on("mousemove.position_cursor", follow)
            .on("mouseover.position_cursor", follow);
      }
      
      //************************************************************
      // Vertical cursor (or horizontal)
      //************************************************************
      if (options.vcursor) {
          var vertical = svg
              .append("path")
              .attr("class", "vertical-cursor")
              .attr("d", "M 0 0 L 0 " + height)
              .attr("stroke", "black")
              .attr("stroke-width", 2);
              
          var follow_x = function (){  
              var mouse = d3.mouse(mainview.node());
              var mousex = mouse[0];
              vertical.attr("d", "M " + mousex.toFixed(1) + " 0 L " + mousex.toFixed(1) + " " + height);
          }
               
          svg
            .on("mousemove.vcursor", follow_x)
            .on("mouseover.vcursor", follow_x);
            
      }
      
      if (options.hcursor) {
          var horizontal = svg
              .append("path")
              .attr("class", "horizontal-cursor")
              .attr("d", "M 0 0 L " + width + " 0")
              .attr("stroke", "black")
              .attr("stroke-width", 2);

          var follow_y = function (){  
              var mouse = d3.mouse(mainview.node());
              var mousey = mouse[1];
              horizontal.attr("d", "M 0 " + mousey.toFixed(1) + " L " + width + " " + mousey.toFixed(1));
          }
          
          svg
            .on("mousemove.hcursor", follow_y)
            .on("mouseover.hcursor", follow_y); 
               
      }
    });
  }
    var legend_offset = {x: 0, y: 0};
    var drag_legend = d3.drag()
      .on("drag", function(d,i) {
        legend_offset.x += d3.event.dx;
        legend_offset.y += d3.event.dy;
        chart.draw_legend(source_data);
        })
      .on("start", function() { d3.event.sourceEvent.stopPropagation(); })

    //************************************************************
    // Create D3 legend
    //************************************************************
    chart.draw_legend = function(data) {
      if (!options.legend.show) { return }
      var el = chart.svg.select("g.legend");
      // if there are more options.series defined than datasets, 
      // use the extra series:
      var ldata = d3.range(Math.max(data.length, (options.series || []).length));
      var update_sel = el.selectAll('g').data(ldata);
      update_sel
        .enter()
          .append('g')
          .each(function(d, i) {
            var g = d3.select(this);
            g.append("rect")
              .attr("x", legend_offset.x)
              .attr("y", i*25 + 10)
              .attr("width", 14)
              .attr("height", 14)
              .style("fill", get_series_color(null, i))
              .style("stroke", get_series_color(null, i))
              .style("cursor", "pointer")
              .on("mouseover", function() {
                chart.svg.selectAll('path.line')
                  .classed('highlight', function(d,ii) {return ii == i})
                  .classed('unhighlight', function(d,ii) {return ii != i});
              })
              .on("mouseout", function() {
                chart.svg.selectAll('path.line')
                  .classed('highlight', false)
                  .classed('unhighlight', false);
              })
              .on("click", function() {
                let hidden = d3.select(this).classed("hidden");
                // toggle:
                hidden = !hidden;
                d3.select(this).classed('hidden', hidden);
                chart.svg.selectAll('path.line')
                  .filter(function(d,ii) { return ii == i })
                  .classed('hidden', hidden);
                chart.svg.selectAll('g.series')
                  .filter(function(d,ii) { return ii == i })
                  .classed('hidden', hidden);
                chart.svg.selectAll('g.errorbars')
                  .filter(function(d,ii) { return ii == i })
                  .classed('hidden', hidden);
              })
              .append("title").text("click to hide/unhide")
              //.call(drag_legend);
            
            g.append("text")
              .attr("x", 18 + legend_offset.x)
              .attr("y", i * 25 + 25)
              .attr("height",30)
              .attr("width",100)
              .style("text-anchor", "start")
              .style("cursor", "move")
              .style("fill", get_series_color(null, i))
              .on("mouseover", function() {
                chart.svg.selectAll('path.line')
                  .classed('highlight', function(d,ii) {return ii == i})
                  .classed('unhighlight', function(d,ii) {return ii != i});
              })
              .on("mouseout", function() {
                chart.svg.selectAll('path.line')
                  .classed('highlight', false)
                  .classed('unhighlight', false);
              })
              .call(drag_legend)

          });
      update_sel.exit().remove();
      
      el.selectAll("rect")
        .attr("x", legend_offset.x)
        .attr("y", function(d,i) {return i*25 + 12 + legend_offset.y});

      el.selectAll("text")
        .attr("x", 18 + legend_offset.x)
        .attr("y", function(d,i) { return i * 25 + 25 + legend_offset.y})
        .each(function(d, i) {
          d3.select(this).text((options.series[i] && options.series[i].label != null) ? options.series[i].label : i+1)
        });
    }
    
    var line = d3.line()
      .defined(function(d) { return (d && d[1] != null && isFinite(x(d[0])) && isFinite(y(d[1]))); })
      .x(function(d) { return x(d[0]); })
      .y(function(d) { return y(d[1]); });

    //************************************************************
    // Create D3 line object and draw data on our SVG object
    //************************************************************
    chart.draw_lines = function(data) {
      var update_sel = chart.g.selectAll('.line')
        .data(filterShowOption('show_line', data))
      update_sel
        .enter()
          .append("path")
          .attr("class", "line")
          .attr('stroke', get_series_color);
      update_sel.exit().remove();
      
      chart.g.selectAll('path.line')
        .attr("d", line);
    }      
    
    //************************************************************
    // Draw points on SVG object based on the data given
    //************************************************************
    chart.draw_points = function(data) {
      var series_sel = chart.g.selectAll("g.series")
        .data(filterShowOption('show_points', data))
      series_sel
        .enter().append("g")
          .attr("class", "series")
          .style("fill", get_series_color);
      series_sel.exit().remove();
      
      var update_sel = chart.g.selectAll("g.series").selectAll(".dot")
          .data(function(d) { return d; });
      update_sel.enter().append("circle")
          //.filter(function(d) { return (d && d[1] != null && isFinite(x(d[0])) && isFinite(y(d[1]))); })
          .attr("class", "dot")
          .attr("clip-path", "url(#d3clip_" + id.toFixed() + ")")
          .attr("r", options.point_size)
      update_sel.exit().remove();
          
      chart.g.selectAll("g.series .dot")
        .each(function(d,i) {
          var xp = x(d[0]),
              unplottable_xp = (!isFinite(xp) || d[0] == null || xp == null),
              yp = y(d[1]),
              unplottable_yp = (!isFinite(yp) || d[1] == null || yp == null);
          d3.select(this)
            .attr("cx", unplottable_xp ? null : xp) // isFinite(xp)?function(d) { var xp = x(d[0]); return isFinite(xp) ? xp : null })
            .attr("cy", unplottable_yp ? null : yp) //function(d) { var yp = y(d[1]); return isFinite(yp) ? yp : null });
            .style("visibility", (unplottable_xp || unplottable_yp) ? "hidden" : "visible");
        });
    }
    
    //************************************************************
    // Draw error bars on SVG object based on the data given
    //************************************************************
    chart.draw_errorbars = function(data) {
      var series_sel = chart.g.selectAll(".errorbars")
       .data(filterShowOption('show_errorbars', data))
      series_sel
       .enter().append("g")
          .classed("errorbars", true)
          .style("stroke", get_series_color)
          .style("stroke-width", "1.5px")
      series_sel.exit().remove();
      
      var update_sel = chart.g.selectAll(".errorbars").selectAll(".errorbar")
          .data(function(d,i) { return d; })
      update_sel.enter().append("path")
          .classed("errorbar", true)
      update_sel.exit().remove();
          
      chart.g.selectAll(".errorbars").selectAll("path.errorbar")
          .attr("d", errorbar_generator);
    }	
      
    //************************************************************
    // Zoom specific updates
    //************************************************************
    function update() {
      var svg = chart.svg;
      
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis); 
      svg.select(".x.axis .x.axis-label").html(options.axes.xaxis.label);
      svg.select(".y.axis .y.axis-label").html(options.axes.yaxis.label);
      svg.select(".x.grid").call(xAxisGrid);
      svg.select(".y.grid").call(yAxisGrid);
      // remove added attr that blocks styling:
      svg.selectAll(".grid .tick line").attr("stroke", null);
      svg.selectAll("rect.zoom").remove();

      chart.draw_lines(source_data);
      chart.draw_errorbars(source_data);
      chart.draw_points(source_data);
      chart.draw_legend(source_data);
      
      chart.interactors().forEach(function(d,i) { if (d.update) {d.update();}});
    }
    
    function refresh() {
      chart.svg.select(".x.axis").call(xAxis);
      chart.svg.select(".y.axis").call(yAxis);
    }
    
    function filterShowOption(optname, data) { 
      return data.map(function(d,i) {
        var localopt = (((options || {}).series || [])[i] || {});
        if (localopt[optname] == false || (localopt[optname] === undefined && !options[optname])) {
          return []
        } else {
          return d;
        }
      })
    }
    
    function get_series_color(_, i) {
      // use color specified in options.series, if it exists
      // otherwise grab from the default colors list:
      return (options.series[i] || {}).color || colors[i % colors.length];
    }
    
    function errorbar_generator(d) {
      var errorbar_width = options.errorbar_width;
      var pathstring = "";
      if (!d[2]) {return pathstring}
      var draw_top_bottom = (
        (d[2].yupper != d[2].ylower) &&
          isFinite(y(d[2].ylower)) &&
          isFinite(y(d[2].yupper))
      );
      var draw_left_right = (
        (d[2].xupper != d[2].xlower) &&
        isFinite(x(d[2].xlower)) && 
        isFinite(x(d[2].xupper)) 
      );
      var px = x(d[0]),
          py = y(d[1]),
          pux = x(d[2].xupper),
          plx = x(d[2].xlower),
          puy = y(d[2].yupper),
          ply = y(d[2].ylower);
      if (draw_top_bottom) {
        // draw the top bar...
        pathstring += "M" + (px - errorbar_width/2.0).toFixed(3);
        pathstring += "," + (puy).toFixed(3);
        pathstring += "L" + (px + errorbar_width/2.0).toFixed(3);
        pathstring += "," + (puy).toFixed(3);     
        // draw the vertical...
        pathstring += "M" + (px).toFixed(3);
        pathstring += "," + (puy).toFixed(3);
        pathstring += "L" + (px).toFixed(3);
        pathstring += "," + (ply).toFixed(3);
        // draw the bottom bar
        pathstring += "M" + (px - errorbar_width/2.0).toFixed(3);
        pathstring += "," + (ply).toFixed(3);
        pathstring += "L" + (px + errorbar_width/2.0).toFixed(3);
        pathstring += "," + (ply).toFixed(3);
      }
      if (draw_left_right) {
        // draw the left bar...
        pathstring += "M" + (plx).toFixed(3);
        pathstring += "," + (py - errorbar_width/2.0).toFixed(3);
        pathstring += "L" + (plx).toFixed(3);
        pathstring += "," + (py + errorbar_width/2.0).toFixed(3); 
        // draw the horizontal...
        pathstring += "M" + (plx).toFixed(3);
        pathstring += "," + (py).toFixed(3);
        pathstring += "L" + (pux).toFixed(3);
        pathstring += "," + (py).toFixed(3);
        // draw the right bar
        pathstring += "M" + (pux).toFixed(3);
        pathstring += "," + (py - errorbar_width/2.0).toFixed(3);
        pathstring += "L" + (pux).toFixed(3);
        pathstring += "," + (py + errorbar_width/2.0).toFixed(3);
      }
      
      return pathstring;
    }
    
    chart.resetzoom = function() {
      var xoffset = (x.range()[1] - x.range()[0]) * base_zoom_offset,
          yoffset = (y.range()[1] + y.range()[0]) * base_zoom_offset;
      var zoombox = chart.g.select("rect.zoom-box");
      x.domain([min_x, max_x]);
      y.domain([min_y, max_y]);
      orig_x = x.copy();
      orig_y = y.copy();
      //zoombox.call(zoom.transform, d3.zoomIdentity);
      zoombox
        .call(zoom.transform, d3.zoomIdentity.translate(xoffset, yoffset).scale(1.0 - 2*base_zoom_offset) );
      is_zoomed = false;
    }
    
    chart.options = function(_, clear) {
      if (!arguments.length) return options;
      if (clear) {
        options = extend(true, {}, options_defaults, _);
      } else {
        extend(true, options, _);
      }
      return chart;
    };
    
    chart.source_data = function(_) {
      if (!arguments.length) return source_data;
      source_data = _;
      do_autoscale();
      if (!is_zoomed && options.autoscale) { chart.resetzoom(); }
      return chart;
    };
    
    chart.is_zoomed = function() { return is_zoomed; }
    
    chart.show_grid = function(_) {
      if (!arguments.length) return options.show_grid;
      options.show_grid = _;
      chart.outercontainer.selectAll(".grid").style(
        "display", (options.show_grid == true || options.show_grid == "true") ? "inline" : "none"
      );
      return chart;
    };
    
    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };
    
    chart.min_x = function(_) {
      if (!arguments.length) return min_x;
      min_x = _;
      return chart;
    };
    
    chart.max_x = function(_) {
      if (!arguments.length) return max_x;
      max_x = _;
      return chart;
    };
    
    chart.min_y = function(_) {
      if (!arguments.length) return min_y;
      min_y = _;
      return chart;
    };
    
    chart.max_y = function(_) {
      if (!arguments.length) return max_y;
      max_y = _;
      return chart;
    };
    
    chart.zoomScroll_old = function(_) {
      if (!arguments.length) return zoomScroll;
      zoomScroll = _;
      if (zoomScroll == true) {
        chart.svg.call(zoom);
        chart.svg.on("dblclick.zoom", null);
      }
      else if (zoomScroll == false) {
        chart.svg.on(".zoom", null);
      }
      return chart;
    };
    
    chart.zoomScroll = function(_) {
      if (!arguments.length) return zoomScroll;
      zoomScroll = _;
      //var scrollLayer = chart.svg.select("g.mainview rect");
      var zoombox = chart.svg.select("g.mainview rect.zoom-box");
      if (zoomScroll == true) {
        zoombox.call(zoom).on("dblclick.zoom", null);
      }
      else if (zoomScroll == false) {
        zoombox.on(".zoom", null);
      }
      return chart;
    };
    
    chart.xtransform = function(_) {
    if (!arguments.length) return options.xtransform;
      options.xtransform = _;
      var old_range = x.range(),
          old_domain = x.domain();
      x = getScale(options.xtransform);
      do_autoscale();
      x.domain([min_x, max_x]).range(old_range);
      orig_x = x.copy();
      xAxis.scale(x);
      xAxisGrid.scale(x);
      interactors.forEach(function(d) {d.x(x)});
      chart.resetzoom();
      return chart;
    };
    
    chart.ytransform = function(_) {
    if (!arguments.length) return options.ytransform;
      options.ytransform = _;
      var old_range = y.range(),
          old_domain = y.domain();
      y = getScale(options.ytransform);
      do_autoscale();
      y.domain([min_y, max_y]).range(old_range);
      orig_y = y.copy();
      yAxis.scale(y);
      yAxisGrid.scale(y);
      interactors.forEach(function(d) {d.y(y)});
      chart.resetzoom();
      return chart;
    };
    
    chart.interactors = function(_) {
      if (!arguments.length) return interactors;
      if ( _ == null ) {
        // null passed intentionally: clear all
        chart.svg.selectAll("g.interactors").remove();
        interactors = [];
        return chart;
      }
      else {
        chart.svg.select("g.mainview").call(_);
        _.x(x).y(y).update();
        interactors.push(_);
        return chart;
      }
    };
    
    chart.export_svg = function() {
      var dsvg = d3.select(chart.svg.node().cloneNode(true));
      dsvg.style("font-family", "sans-serif")
        .style("font-size", "14px")
      dsvg.selectAll("line").style("fill", "none");
      dsvg.selectAll("path").style("fill", "none");
      dsvg.selectAll(".mainview>rect").style("fill", "none");
      dsvg.selectAll("clippath rect").style("fill", "none");
      dsvg.selectAll(".axis text").style("font-size", "14px").style("fill", "black");
      dsvg.selectAll(".axis-label").style("font-size", "18px");
      dsvg.selectAll(".axis path, .axis line").style("stroke", "black"); //.css("stroke-width", "1.5px");
      dsvg.selectAll(".grid .tick").style("stroke", "lightgrey")
        .style("opacity", "0.7");
      dsvg.selectAll(".grid path").style("stroke-width", "0");    
      dsvg.selectAll("text.position-cursor").remove();              
      return dsvg.node(); // user outerHTML of this
    }
  
    chart.print_plot = function() {
      var svg = chart.export_svg();
      var serializer = new XMLSerializer();
      var svg_blob = new Blob([serializer.serializeToString(svg)],
                            {'type': "image/svg+xml"});
      var url = URL.createObjectURL(svg_blob);
      var svg_win = window.open(url, "svg_win");  
    }
    
    chart.autofit = function() {
      var outercontainer = chart.outercontainer,
          innerwidth = outercontainer.node().clientWidth,
          innerheight = outercontainer.node().clientHeight,
          width = innerwidth - options.margin.right - options.margin.left,
          height = innerheight - options.margin.top - options.margin.bottom;
          
      x.range([0, width]);
      y.range([height, 0]);
      
      orig_x = x.copy();
      orig_y = y.copy();
      
      //zoom.x(x).y(y);
      xAxis.scale(x);
      yAxis.scale(y);
      xAxisGrid.scale(x).tickSize(-height);
      yAxisGrid.scale(y).tickSize(-width);
        
      chart.svg.attr("width", width + options.margin.left + options.margin.right)
        .attr("height", height + options.margin.top + options.margin.bottom);
      chart.svg.select("clipPath rect").attr("width", width).attr("height", height);
      chart.svg.selectAll("g.axes g.x").attr("transform", "translate(0," + height + ")");
      
      chart.svg.selectAll("g.x.axis text.axis-label").attr("x", width/2.0);
      chart.svg.selectAll("g.y.axis text.axis-label").attr("x", -height/2.0);
      chart.svg.select(".position-cursor").attr("x", width-10).attr("y", height-10);
      chart.svg.select("g.legend").attr("transform", "translate(" + (width-65) + ",25)");
      
      update();
    }
    
    //chart.resetzoom = resetzoom;
    
    chart.type = "xy";
    
    return chart;
}

function getScale(scalename) {
  return d3['scale' + scalename.slice(0,1).toUpperCase() + scalename.slice(1).toLowerCase()]();
}
