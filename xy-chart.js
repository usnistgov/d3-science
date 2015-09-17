// requires: 
//   - jquery-extend.js (or jQuery, to get jQuery.extend)
//   - d3.js

function xyChart(options_override) {
  var debug=false;
  var options_defaults = {
    margin: {top: 10, right: 10, bottom: 50, left: 50},
    show_points: true,
    show_errorbars: true,
    numberOfTicks: 4,
    vcursor: false,
    hcursor: false,
    xlabel: "x-axis",
    ylabel: "y-axis",
    zlabel: "z-axis",
    errorbar_width: 12,
    xtransform: "linear",
    ytransform: "linear",
    legend: {show: true},
    series: []
  }
    
  var options = jQuery.extend(true, {}, options_defaults); // copy
  jQuery.extend(true, options, data_obj.options); // overwrite from data_obj
  jQuery.extend(true, options, options_override); // process any overrides from creation;
    
  this.options = options;
  var max_y = -Infinity;
  var min_y = Infinity;
  var max_x = -Infinity;
  var min_x = Infinity;
    
  var labels = data_obj.options.series.map(function(d, i) { return d.label || i });
  var x = d3.scale[options.xtransform]();
  var y = d3.scale[options.ytransform]();
  var xAxis = d3.svg.axis(),
      yAxis = d3.svg.axis(),
      xAxisGrid = d3.svg.axis(),
      yAxisGrid = d3.svg.axis();
  
  var zoom = d3.behavior.zoom().x(x).y(y).on("zoom", zoomed);
  var source_data;
   
  function fullrange() {
    var extents;
    var merged_data = d3.merge(data);
    if (this.options.show_errorbars) {
      max_y = d3.extent(merged_data, function(d) { return isFinite(y(d[2].yupper))? d[2].yupper : null })[1];
      min_y = d3.extent(merged_data, function(d) { return isFinite(y(d[2].ylower))? d[2].ylower : null })[0];
      max_x = d3.extent(merged_data, function(d) { return isFinite(x(d[2].xupper))? d[2].xupper : null })[1];
      min_x = d3.extent(merged_data, function(d) { return isFinite(x(d[2].xlower))? d[2].xlower : null })[0];
    } else {
      extents = d3.extent(merged_data, function(d) { return isFinite(y(d[1]))? d[1] : null });
      min_y = extents[0];
      max_y = extents[1];
      extents = d3.extent(merged_data, function(d) { return isFinite(x(d[0]))? d[0] : null });
      min_x = extents[0];
      max_x = extents[1];
    }
    return {min_x: min_x, max_x: max_x, min_y: min_y, max_y: max_y}
  }
  this.fullrange = fullrange;
  fullrange();
    
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
        innerwidth = outercontainer.node().clientWidth - offset_right,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - options.margin.right - options.margin.left,
        height = innerheight - options.margin.top - options.margin.bottom;
      chart.outercontainer = outercontainer;
      source_data = data;
      chart.update = function() { outercontainer.transition().call(chart); chart.colorbar.update(); };   
      if (options.autoscale) {
        fullrange();
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
        .orient("bottom");	
	
      yAxisGrid
        .scale(y)
	      .tickPadding(10)
	      .ticks(options.numberOfTicks)
	      .tickSize(-width)
	      .tickSubdivide(true)	
        .orient("left");
        
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

      var zoomRect = false;
      
      d3.select("#zoom-rect").on("change", function() {
        zoomRect = this.checked;
      });
    
      //************************************************************
      // Generate our SVG object
      //************************************************************
      var svg = container.selectAll("svg.mainplot").data([0]);
      var esvg = svg.enter()
        .append("svg")
          .attr("class", "mainplot")
          .call(zoom)
          .on("dblclick.zoom", null)
          .on("dblclick.resetzoom", null)
          .on("dblclick.resetzoom", resetzoom);
	      .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .call(zoom)
        .append("g")
          .on("mousedown", function() {
            if (!zoomRect) return;
            var e = this,
                origin = d3.mouse(e),
                rect = svg.append("rect").attr("class", "zoom");
            d3.select("body").classed("noselect", true);
            origin[0] = Math.max(0, Math.min(width, origin[0]));
            origin[1] = Math.max(0, Math.min(height, origin[1]));
            d3.select(window)
                .on("mousemove.zoomRect", function() {
                  var m = d3.mouse(e);
                  m[0] = Math.max(0, Math.min(width, m[0]));
                  m[1] = Math.max(0, Math.min(height, m[1]));
                  rect.attr("x", Math.min(origin[0], m[0]))
                      .attr("y", Math.min(origin[1], m[1]))
                      .attr("width", Math.abs(m[0] - origin[0]))
                      .attr("height", Math.abs(m[1] - origin[1]));
                })
                .on("mouseup.zoomRect", function() {
                  d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
                  d3.select("body").classed("noselect", false);
                  var m = d3.mouse(e);
                  m[0] = Math.max(0, Math.min(width, m[0]));
                  m[1] = Math.max(0, Math.min(height, m[1]));
                  if (m[0] !== origin[0] && m[1] !== origin[1]) {
                    zoom.x(x.domain([origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b})))
                        .y(y.domain([origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b})));
                  } else {
                      zoom.scale(1);
                      zoom.translate([0,0]);
                      zoom.x(x.domain([min_x, max_x]))
                          .y(y.domain([min_y, max_y]));
                  }
                  rect.remove();
                  zoomed();
                }, true);
            d3.event.stopPropagation();
          });
    

      esvg.append("rect")
          .attr("width", width)
          .attr("height", height)
          //.call(zoom);
      esvg.append("g")
        .attr("class", "x axis");
      esvg.append("g")
        .attr("class", "x axis")
        .append("text")
        .attr("class", "x axis-label")
        .attr("x", width/2.0)
        .attr("text-anchor", "middle")
        .attr("y", 35)
      esvg.append("g")
	      .attr("class", "y axis")
	      .append("text")
	      .attr("class", "y axis-label")
	      .attr("text-anchor", "middle")
	      .attr("transform", "rotate(-90)")
	      .attr("y", -35 )
	      .attr("x", -height/2)
	    esvg.append("defs").append("clipPath")
	      .attr("id", "myClip") // local def
	      .append("rect")
	      .attr("width", width)
	      .attr("height", height);
	    
      esvg.append("g")
        .attr("class", "y axis");
      esvg.append("g")
        .attr("class", "x grid");           
      esvg.append("g")
        .attr("class", "y grid");
      
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis);
      svg.select(".x.grid").call(xAxisGrid);
      svg.select(".y.grid").call(yAxisGrid);
      svg.select(".x.axis-label").text(options.xlabel);
      svg.select(".y.axis-label").text(options.ylabel);        
      
       
      
	
      //************************************************************
      // Create D3 legend
      //************************************************************
      if (options.legend) {
	      var legend = svg.append("g")
	        .attr("class", "legend")
	        .attr("x", width - 65)
	        .attr("y", 25)
	        .attr("height", 100)
	        .attr("width", 100);
	
	      legend.selectAll('g').data(data)
            .enter()
            .append('g')
            .each(function(d, i) {
              var g = d3.select(this);
              g.append("rect")
                .attr("x", width - 65)
                .attr("y", i*25)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", colors[i%colors.length]);
              
              g.append("text")
                .attr("x", width - 50)
                .attr("y", i * 25 + 8)
                .attr("height",30)
                .attr("width",100)
                .style("text-anchor", "start")
                .style("fill", colors[i%colors.length])
                .text(labels[i])
                .on("mouseover", function() {
                  d3.selectAll('.line')[0][i].classList.add('highlight');
                })
                .on("mouseout", function() {
                  d3.selectAll('.line')[0][i].classList.remove('highlight');
                });
            });
      }
	
      //************************************************************
      // Create D3 line object and draw data on our SVG object
      //************************************************************
      if (options.show_line) {
          
          var line = d3.svg.line()
              .defined(function(d) { return (d && d[1] != null && isFinite(x(d[0])) && isFinite(y(d[1]))); })
              //.interpolate("linear")	
              .x(function(d) { return x(d[0]); })
              .y(function(d) { return y(d[1]); });
          

          svg.selectAll('.line')
              .data(data)
              .enter()
              .append("path")
              //.filter(function(d) { return (d && isFinite(x(d.x)) && isFinite(y(d.y))); })
              .attr("class", "line")
              .attr("clip-path", "url(#myClip)")
              .attr('stroke', function(d,i){
	              return colors[i%colors.length];
              })
              .attr("d", line);
      } else {
          var line = null;
      }
	
	    chart.line = line;
	
	
      //************************************************************
      // Draw points on SVG object based on the data given
      //************************************************************
      if (options.show_points) {

          var points = svg.selectAll(".points")
            .data(data)
          points
          .enter().append("g")
            .attr("class", "series")
            .style("fill", function(d, i) { return colors[i % colors.length];  })
          .selectAll(".dot")
            .data(function(d) { return d; })
          .enter().append("circle")
            .filter(function(d) { return (d && d[1] != null && isFinite(x(d[0])) && isFinite(y(d[1]))); })
            .attr("class", "dot")
            .attr("r", 2.5)
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); });
          
      } else {
          var points = null;
      }	
      chart.points = points;
      
	    //************************************************************
      // Draw error bars on SVG object based on the data given
      //************************************************************
      
	    
      if (options.show_errorbars) {
        var errorbars = svg.selectAll(".errorbars")
            .data(data)
          errorbars
          .enter().append("g")
            .attr("class", "errorbars")
            .style("fill", function(d, i) { return colors[i % colors.length];  })
            .style("stroke", function(d, i) { return colors[i % colors.length];  })
          .selectAll(".errorbar")
            .data(function(d) { return d; })
          .enter().append("path")
            .filter(function(d) {
              return (d && d[1] != null &&
                isFinite(x(d[2].xlower)) && 
                isFinite(x(d[2].xupper)) && 
                isFinite(y(d[2].ylower)) &&
                isFinite(y(d[2].yupper))) })
            .attr("class", "errorbar")
            .attr("stroke-width", "1.5px")
            .attr("d", errorbar_generator);
      } else {
        var errorbars = null;
      }	
	
	    chart.errorbars = errorbars;
	  
	    //************************************************************
      // Position cursor (shows position of mouse in data coords)
      //************************************************************
      if (options.position_cursor) {
          var position_disp = svg.append("text")
            .attr("x", width - 10)
            .attr("y", height - 10)
            .style("text-anchor", "end");
          
          var follow = function (){  
              var mouse = d3.mouse(this);
              position_disp.text(
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
              var mouse = d3.mouse(this);
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
              var mouse = d3.mouse(this);
              var mousey = mouse[1];
              horizontal.attr("d", "M 0 " + mousey.toFixed(1) + " L " + width + " " + mousey.toFixed(1));
          }
          
          svg
            .on("mousemove.hcursor", follow_y)
            .on("mouseover.hcursor", follow_y); 
               
      }
    }
    
    //************************************************************
    // Zoom specific updates
    //************************************************************
    function zoomed() {
      var svg = chart.svg;
	    svg.select(".x.axis").call(xAxis);
	    svg.select(".y.axis").call(yAxis);   
	    if (chart.line) svg.selectAll('path.line').attr('d', chart.line);  
     
	    if (chart.points) {
        chart.points.selectAll('.dot')
	      .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); });
      }
      
      if (chart.errorbars) {
        chart.errorbars.selectAll('.errorbar')
          .attr("d", errorbar_generator);
      }
    }
    
    function refresh() {
      chart.svg.select(".x.axis").call(xAxis);
      chart.svg.select(".y.axis").call(yAxis);
    }
    
    
    
    
    
    function errorbar_generator(d) {
      var pathstring = "";
      var draw_top_bottom = (d[2].yupper != d[2].ylower);
      var draw_left_right = (d[2].xupper != d[2].xlower);
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
    
    return chart;
}
