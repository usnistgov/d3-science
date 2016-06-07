// requires: 
//   - jquery-extend.js (or jQuery, to get jQuery.extend)
//   - d3.js

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
    legend: {show: false, left: 65},
    axes: {
      xaxis: {label: "x-axis"},
      yaxis: {label: "y-axis"}
    },
    point_size: 2.5,
    series: new Array()
  }
    
  var options = jQuery.extend(true, {}, options_defaults); // copy
  jQuery.extend(true, options, options_override); // process any overrides from creation;
    
  var id = d3.id();
  var interactors = [];
  
  this.options = options;
  var max_y = -Infinity;
  var min_y = Infinity;
  var max_x = -Infinity;
  var min_x = Infinity;
  var zoomRect = false;
  var zoomScroll = false;
    
  var labels = options.series.map(function(d, i) { return d.label || i });
  var x = d3.scale[options.xtransform]();
  var y = d3.scale[options.ytransform]();
  var xAxis = d3.svg.axis(),
      yAxis = d3.svg.axis(),
      xAxisGrid = d3.svg.axis(),
      yAxisGrid = d3.svg.axis();
  
  var zoom = d3.behavior.zoom().x(x).y(y).on("zoom", zoomed);
  var base_zoom_offset = 0.05; // zoom out 5% from min and max by default;
  var resetzoom = function() {
    var xoffset = (x.range()[1] - x.range()[0]) * base_zoom_offset,
        yoffset = (y.range()[1] + y.range()[0]) * base_zoom_offset;
    zoom.x(x.domain([min_x, max_x]))
        .y(y.domain([min_y, max_y]))
        .scale(1.0 - (2.0 * base_zoom_offset)).translate([xoffset, yoffset]);
    zoomed();
    //.call(this);
  }
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
    /*
    var dx = (x(max_x) - x(min_x)) || 1.0,
        dy = (y(max_y) - y(min_y)) || 1.0;
    
    min_x = x.invert(x(min_x) - (dx * base_zoom_offset));
    max_x = x.invert(x(max_x) + (dx * base_zoom_offset));
    min_y = y.invert(y(min_y) - (dy * base_zoom_offset)); 
    max_y = y.invert(y(max_y) + (dy * base_zoom_offset));
    */
    var xav= max_x - min_x,
        yrange = max_y - min_y;
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
  this.do_autoscale = do_autoscale;
    
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
      chart.update = zoomed;
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
            
      xAxisGrid
        .scale(x)
	      .tickSize(-height)
	      .ticks(options.numberOfTicks)
	      .tickPadding(10)	
	      .tickSubdivide(true)	
        .orient("bottom")
        .tickFormat("");	
	
      yAxisGrid
        .scale(y)
	      .tickPadding(10)
	      .ticks(options.numberOfTicks)
	      .tickSize(-width)
	      .tickSubdivide(true)	
        .orient("left")
        .tickFormat("");
        
      xAxis
        .scale(x)
        .ticks(options.numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("bottom");
      
      yAxis
        .scale(y)
        .ticks(options.numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)
        .orient("left");
    
      zoom.x(x).y(y);

      //************************************************************
      // Generate our SVG object
      //************************************************************
      var svg = outercontainer.append("svg")
        .attr("class", "mainplot")
        //.call(zoom) // call this from zoomScroll setter
        .on("dblclick.zoom", null)
        //.on("dblclick.resetzoom", null)
        .on("dblclick.resetzoom", resetzoom)
          
      var axes = svg.append("g")
        .attr("class", "axes")
        .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");
        
      var mainview = svg.append("g")
        .attr("class", "mainview")
        .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");  

      var drag = d3.behavior.drag();
      svg.call(drag);
      
      drag
        .on("dragstart.zoomRect", function() {
          if (!zoomRect) return;
          var e = mainview.node(),
            origin = d3.mouse(e),
            rect = mainview.append("rect").attr("class", "zoom");
          d3.select("body").classed("noselect", true);
          origin[0] = Math.max(0, Math.min(width, origin[0]));
          origin[1] = Math.max(0, Math.min(height, origin[1]));
          //d3.select(window)
          drag
            .on("drag.zoomRect", function() {
              var m = d3.mouse(e);
              m[0] = Math.max(0, Math.min(width, m[0]));
              m[1] = Math.max(0, Math.min(height, m[1]));
              rect.attr("x", Math.min(origin[0], m[0]))
                .attr("y", Math.min(origin[1], m[1]))
                .attr("width", Math.abs(m[0] - origin[0]))
                .attr("height", Math.abs(m[1] - origin[1]));
            })
            .on("dragend.zoomRect", function() {
              //d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
              drag.on("drag.zoomRect", null).on("drag.zoomRect", null);
              d3.select("body").classed("noselect", false);
              var m = d3.mouse(e);
              m[0] = Math.max(0, Math.min(width, m[0]));
              m[1] = Math.max(0, Math.min(height, m[1]));
              if (m[0] !== origin[0] && m[1] !== origin[1]) {
                zoom.x(x.domain([origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b})))
                    .y(y.domain([origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b})));
              } 
              else {
                // reset zoom on single click? No!
                /*
                zoom.scale(1);
                zoom.translate([0,0]);
                zoom.x(x.domain([min_x, max_x]))
                    .y(y.domain([min_y, max_y]));
                */
              }
              rect.remove();
              zoomed();
            }, true);
          d3.event.sourceEvent.stopPropagation();
        });
      
      mainview.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width-65) + ",25)");
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
      
      axes.select(".x.axis").call(xAxis);
      axes.select(".y.axis").call(yAxis);
      axes.select(".x.grid").call(xAxisGrid);
      axes.select(".y.grid").call(yAxisGrid);
      axes.select(".x.axis-label").text(((options.axes || {}).xaxis || {}).label || "x-axis");
      axes.select(".y.axis-label").text(((options.axes || {}).yaxis || {}).label || "y-axis");
      
      svg.attr("width", width + options.margin.left + options.margin.right)
          .attr("height", height + options.margin.top + options.margin.bottom);
                
      axes.selectAll("g.x")
        .attr("transform", "translate(0," + height + ")");
       
      chart.svg = svg;
      chart.g = svg.selectAll("g.mainview");
      resetzoom(); // set to 10% zoom out.
	
      //************************************************************
      // Create D3 legend
      //************************************************************
      if (options.legend && options.legend.show) {
	      var el = svg.select("g.legend");
	      el.selectAll('g').data(data)
          .enter()
            .append('g')
            .each(function(d, i) {
              var g = d3.select(this);
              g.append("rect")
                .attr("x", -options.legend.left)
                .attr("y", i*25 + 15)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", colors[i%colors.length])
                .on("mouseover", function() {
                  d3.selectAll('.line')[0][i].classList.add('highlight');
                })
                .on("mouseout", function() {
                  d3.selectAll('.line')[0][i].classList.remove('highlight');
                });
              
              g.append("text")
                .attr("x", 15-options.legend.left)
                .attr("y", i * 25 + 25)
                .attr("height",30)
                .attr("width",100)
                .style("text-anchor", "start")
                .style("fill", colors[i%colors.length])
                .on("mouseover", function() {
                  d3.selectAll('.line')[0][i].classList.add('highlight');
                })
                .on("mouseout", function() {
                  d3.selectAll('.line')[0][i].classList.remove('highlight');
                });
            });
          el.selectAll("text")
            .each(function(d, i) {
              d3.select(this).text((options.series[i] && options.series[i].label != null) ? options.series[i].label : i+1)
            });
      }
	
      chart.draw_lines(data);
      chart.draw_points(data);
      chart.draw_errorbars(data);
	  
      //************************************************************
      // Position cursor (shows position of mouse in data coords)
      //************************************************************
      if (options.position_cursor) {
        var position_cursor = mainview.selectAll(".position-cursor")
          .data([0])
        position_cursor
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
            .on("mousemove.position_cursor", null)
            .on("mouseover.position_cursor", null)
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
    
    
    var line = d3.svg.line()
      .defined(function(d) { return (d && d[1] != null && isFinite(x(d[0])) && isFinite(y(d[1]))); })
      .x(function(d) { return x(d[0]); })
      .y(function(d) { return y(d[1]); });

    //************************************************************
    // Create D3 line object and draw data on our SVG object
    //************************************************************
    chart.draw_lines = function(data) {
      chart.g.selectAll('.line')
        .data(filterShowOption('show_line', data))
        .enter()
          .append("path")
          .attr("class", "line")
          .attr('stroke', function(d,i){
            return colors[i%colors.length];
          })
      
      chart.g.selectAll('path.line')
        .attr("d", line);
    }      
    
    //************************************************************
    // Draw points on SVG object based on the data given
    //************************************************************
    chart.draw_points = function(data) {
      chart.g.selectAll("g.series")
        .data(filterShowOption('show_points', data))
        .enter().append("g")
          .attr("class", "series")
          .style("fill", function(d, i) { return colors[i % colors.length];  });
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
              unplottable_xp = (!isFinite(xp) || d[0] == null || xp == null)
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
      chart.g.selectAll(".errorbars")
       .data(filterShowOption('show_errorbars', data))
       .enter().append("g")
          .classed("errorbars", true)
          .style("stroke", function(d, i) { return colors[i % colors.length];  })
          .style("stroke-width", "1.5px")
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
    function zoomed() {
      var svg = chart.svg;
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis); 
      svg.select(".x.grid").call(xAxisGrid);
      svg.select(".y.grid").call(yAxisGrid);
      svg.selectAll("rect.zoom").remove();

      chart.draw_lines(source_data);
      chart.draw_points(source_data);
      chart.draw_errorbars(source_data);
      
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
    
    chart.options = function(_) {
      if (!arguments.length) return options;
      jQuery.extend(true, options, _);
      return chart;
    };
    
    chart.source_data = function(_) {
      if (!arguments.length) return source_data;
      source_data = _;
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
    
    chart.zoomRect = function(_) {
      if (!arguments.length) return zoomRect;
      zoomRect = _;
      return chart;
    };
    
    chart.zoomScroll = function(_) {
      if (!arguments.length) return zoomScroll;
      zoomScroll = _;
      if (zoomScroll == true) {
        chart.svg.call(zoom);
      }
      else if (zoomScroll == false) {
        chart.svg.on(".zoom", null);
      }
      return chart;
    };
    
    chart.xtransform = function(_) {
    if (!arguments.length) return options.xtransform;
      options.xtransform = _;
      var old_range = x.range(),
          old_domain = x.domain();
      x = d3.scale[options.xtransform]()
      do_autoscale();
      x.domain([min_x, max_x]).range(old_range);
      xAxis.scale(x);
      xAxisGrid.scale(x);
      chart.resetzoom();
      return chart;
    };
    
    chart.ytransform = function(_) {
    if (!arguments.length) return options.ytransform;
      options.ytransform = _;
      var old_range = y.range(),
          old_domain = y.domain();
      y = d3.scale[options.ytransform]()
      do_autoscale();
      y.domain([min_y, max_y]).range(old_range);
      yAxis.scale(y);
      yAxisGrid.scale(y);
      chart.resetzoom();
      return chart;
    };
    
    chart.interactors = function(_) {
      if (!arguments.length) return interactors;
      chart.svg.select("g.mainview").call(_);
      _.x(x).y(y).update();
      interactors.push(_);
      return chart;
    };
    
    chart.export_svg = function() {
      var dsvg = d3.select(chart.svg.node().cloneNode(true));
      dsvg.style("font-family", "sans-serif")
        .style("font-size", "14px")
      dsvg.selectAll("line").style("fill", "none");
      dsvg.selectAll("path").style("fill", "none");
      dsvg.selectAll(".mainview>rect").style("fill", "none");
      dsvg.selectAll("clippath rect").style("fill", "none");
      dsvg.selectAll(".axis-label").style("font-size", "18px");
      dsvg.selectAll(".axis path,line").style("stroke", "black"); //.css("stroke-width", "1.5px");
      dsvg.selectAll(".grid .tick").style("stroke", "lightgrey")
        .style("opacity", "0.7");
      dsvg.selectAll(".grid path").style("stroke-width", "0");                  
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
      
      zoom.x(x).y(y);
      xAxis.scale(x);
      yAxis.scale(y);
      xAxisGrid.scale(x).tickSize(-height);
      yAxisGrid.scale(y).tickSize(-width);
        
      chart.svg.attr("width", width + options.margin.left + options.margin.right)
        .attr("height", height + options.margin.top + options.margin.bottom);
      chart.svg.select("clipPath rect").attr("width", width).attr("height", height);
      chart.svg.selectAll("g.axes g.x").attr("transform", "translate(0," + height + ")");
      
      chart.svg.selectAll("g.x.axis text").attr("x", width/2.0);
      chart.svg.selectAll("g.y.axis text").attr("x", -height/2.0);
      chart.svg.select(".position-cursor").attr("x", width-10).attr("y", height-10);
      chart.svg.select("g.legend").attr("transform", "translate(" + (width-65) + ",25)");
      
      zoomed();
    }
    
    chart.resetzoom = resetzoom;
    
    return chart;
}
