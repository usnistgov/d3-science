// requires: 
//   - jquery-extend.js (or jQuery, to get jQuery.extend)
//   - d3.js

var sampleData = [
  {"sld_n": 0.000, "sld_m": 0.000, "thickness":   0.0, "theta_m": 270.0},
  {"sld_n": 4.000, "sld_m": 1.000, "thickness": 200.0, "theta_m":   0.0},
  {"sld_n": 2.000, "sld_m": 1.000, "thickness": 200.0, "theta_m": 270.0},
  {"sld_n": 4.000, "sld_m": 0.000, "thickness":  10.0, "theta_m": 270.0}
];

if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

function magProfileChart(options_override) {
  var debug=false;
  var options_defaults = {
    margin: {top: 10, right: 10, bottom: 75, left: 100},
    autoscale: true,
    show_points: true,
    show_line: true,
    numberOfTicks: 4,
    position_cursor: true,
    vcursor: false,
    hcursor: false,
    xlabel: "x-axis",
    ylabel: "y-axis",
    zlabel: "z-axis",
    errorbar_width: 12,
    legend: {show: true, left: 65},
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
  var x = d3.scale.linear();
  var y = d3.scale.linear();
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
  
  function data_to_pairs(data, column) {
    var x = 0;    
    return data.map(function(d, i) { return [x+=d.thickness, d[column]] });
  }
  
  function data_to_arrays(data) {
    //var columns = ["sld_n", "sld_m", "theta_m"];
    return options.series.map(function(s) { return data_to_pairs(data, s.id) });
  }
  
  function arrays_to_data(arrays) {
    var columns = options.series.map(function(s) { return s.id });
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
  
  function do_autoscale() {
    var columns = options.series.map(function(s) { return s.id });
    min_y = source_data.reduce(function(a,b) {
      var new_min = Math.min.apply(Math, columns.map(function(sid) { return b[sid] }));
      return Math.min(a, new_min)}, +Infinity);
    max_y = source_data.reduce(function(a,b) {
      var new_max = Math.max.apply(Math, columns.map(function(sid) { return b[sid] }));
      return Math.max(a, new_max)}, -Infinity);
    min_x = 0;
    max_x = source_data.reduce(function(a,b) {return a + b.thickness}, 0);
    
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
  
  function handle_line_dblclick(d,i) {
    var xi = x.invert(d3.mouse(this)[0]);
    var new_xlist = d.map(function(dd) {return dd[0]});
    new_xlist.push(xi);
    new_xlist = new_xlist.sort(function(a,b) {return Math.sign(a-b)});
    var new_index = new_xlist.indexOf(xi);
    var index_below = Math.max(new_index - 1, 0);
    var x_below = d[index_below][0];
    var old_thickness = source_data[new_index].thickness;
    var new_thickness_below = Math.max(xi - x_below, 0);
    var new_thickness_above = old_thickness - new_thickness_below;
    var new_layer = jQuery.extend(true, {}, source_data[new_index]);
    new_layer.thickness = new_thickness_above;
    source_data[new_index].thickness = new_thickness_below;
    source_data.splice(new_index+1, 0, new_layer);
    zoomed();
    d3.event.preventDefault();
    d3.event.stopPropagation();
  }
    
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
        .on("dblclick.resetzoom", function() {do_autoscale(); resetzoom()});
        
      var mainview = svg.append("g")
        .attr("class", "mainview")
        .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");  
      
      mainview.append("rect")
        .attr("width", width)
        .attr("height", height)
        .classed("background", true);
        
      mainview.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width-65) + ",25)");
      
      var axes = svg.append("g")
        .attr("class", "axes")
        .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");
            
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
      
      function apply_constraints(d, i, series, pd) {
        if (i==0) { d[0] = 0.0; }
        // fix mu for last point to be zero:
        if (i == (pd[0].length - 1) && series == 1) { d[1]=0; }
      }
      
      var point_drag = d3.behavior.drag();
      point_drag
        .on("dragstart.point", function() {d3.event.sourceEvent.stopPropagation()})
        .on("drag.point", function(d,i) {
            var xi = x.invert(x(d[0]) + d3.event.dx);
            var yi = y.invert(y(d[1]) + d3.event.dy);
            var pd = d3.select(this.parentNode).data();
            var series = parseInt(d3.select(this.parentNode).attr("series"));
            var arrays = svg.selectAll("g.series").data();
            d[0] = xi;
            d[1] = yi;
            apply_constraints(d, i, series, arrays);
            xi = d[0];
            yi = d[1];
            pd[0][i][1] = yi;
            arrays[0][i][0] = xi; // set the x value of the first array
            var new_sourcedata = arrays_to_data(arrays);
            //source_data = new_sourcedata;
            // go to some lengths to avoid destroying the original data object:
            // just empty it then fill it up again.
            source_data.splice(0, source_data.length);
            source_data.push.apply(source_data, new_sourcedata);
            zoomed();
            d3.event.sourceEvent.stopPropagation();
            //chart.update();
        });
      chart.point_drag = point_drag;
      
      resetzoom(); // set to 10% zoom out.
      
      //************************************************************
      // Create D3 legend
      //************************************************************
      if (options.legend && options.legend.show) {
	      var el = svg.select("g.legend");
	      el.selectAll('g').data(data_to_arrays(data))
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
      .x(function(d,i) { return x(d[0]); })
      .y(function(d,i) { return y(d[1]); })
      .interpolate('step-before');

    //************************************************************
    // Create D3 line object and draw data on our SVG object
    //************************************************************
    chart.draw_lines = function(data) {
      chart.g.selectAll('.line')
        .data(filterShowOption('show_line', data_to_arrays(data)))
        .enter()
          .append("path")
          .attr("class", "line")
          .attr("series", function(d,i) {return i.toFixed()})
          .attr('stroke', function(d,i){
            return colors[i%colors.length];
          })
      
      chart.g.selectAll('path.line')
        .attr("d", line)
        .on("dblclick", handle_line_dblclick);
    }      
    
    //************************************************************
    // Draw points on SVG object based on the data given
    //************************************************************
    chart.draw_points = function(data) {
      chart.g.selectAll("g.series")
        .data(filterShowOption('show_points', data_to_arrays(data)))
        .enter().append("g")
          .attr("class", "series")
          .attr("series", function(d,i) {return i.toFixed()})
          .style("fill", function(d, i) { return colors[i % colors.length];  });
      var update_sel = chart.g.selectAll("g.series").selectAll(".dot")
          .data(function(d) { return d; });
      update_sel.enter().append("circle")
          .attr("class", "dot")
          .attr("clip-path", "url(#d3clip_" + id.toFixed() + ")")
          .attr("r", options.point_size)
          .call(chart.point_drag);
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
    // Zoom specific updates
    //************************************************************
    chart.dispatch = d3.dispatch("zoomed");
    
    function zoomed() {
      var svg = chart.svg;
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis); 
      svg.select(".x.axis .x.axis-label").text(options.axes.xaxis.label);
      svg.select(".y.axis .y.axis-label").text(options.axes.yaxis.label);
      svg.select(".x.grid").call(xAxisGrid);
      svg.select(".y.grid").call(yAxisGrid);
      svg.selectAll("rect.zoom").remove();

      chart.draw_lines(source_data);
      chart.draw_points(source_data);
      
      chart.interactors().forEach(function(d,i) { if (d.update) {d.update()}});
      chart.dispatch.zoomed(source_data);
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
      zoomed();
      //do_autoscale();
      //x.domain([min_x, max_x]);
      //y.domain([min_y, max_y]);
      //chart.resetzoom();
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
        chart.svg.call(zoom)
          .on("dblclick.zoom", null);
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
      interactors.forEach(function(d) {d.x(x)});
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
      interactors.forEach(function(d) {d.y(y)});
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
      
      zoom.x(x).y(y);
      xAxis.scale(x);
      yAxis.scale(y);
      xAxisGrid.scale(x).tickSize(-height);
      yAxisGrid.scale(y).tickSize(-width);
        
      chart.svg.attr("width", width + options.margin.left + options.margin.right)
        .attr("height", height + options.margin.top + options.margin.bottom);
      chart.svg.selectAll("clipPath rect, rect.background").attr("width", width).attr("height", height);
      chart.svg.selectAll("g.axes g.x").attr("transform", "translate(0," + height + ")");
      
      chart.svg.selectAll("g.x.axis text").attr("x", width/2.0);
      chart.svg.selectAll("g.y.axis text").attr("x", -height/2.0);
      chart.svg.select(".position-cursor").attr("x", width-10).attr("y", height-10);
      chart.svg.select("g.legend").attr("transform", "translate(" + (width-65) + ",25)");
      
      zoomed();
    }
    
    chart.resetzoom = resetzoom;
    chart.do_autoscale = do_autoscale;

    
    return chart;
}
