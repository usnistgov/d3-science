"use strict";
import * as d3 from 'd3';
import {event as currentEvent} from 'd3';
import {type, extend} from './jquery-extend';
import {generateID} from './generate-id';

export default function heatChartMulti(options_override) {
  var debug=false;
  var options_defaults = {
    margin: {top: 10, right: 10, bottom: 50, left: 50},
    cb_margin: {top: 10, right: 50, bottom: 50, left: 10},
    show_grid: true,
    show_colorbar: true,
    source_order: "C",
    position_cursor: true,
    colorbar_width: 120,
    numberOfTicks: 4,
    aspect_ratio: null,
    autoscale: false,
    axes: {
      xaxis: {label: "x-axis"},
      yaxis: {label: "y-axis"},
      zaxis: {label: "z-axis"}
    },
    ztransform: "linear",
    zmin: 1,
    zmax: 2
  }
  var options = extend(true, {}, options_defaults); // copy
  extend(true, options, options_override); // process any overrides from creation;
  
  //var zoomRect = false;
  var zoomScroll = false;
  var interactors = [];
  var plotdatas = [];
  var source_data = [];
  var z = getScale(options.ztransform);
    
  var dims = options.dims;
  // create working copy of zmax and zmin, for zooming colorbar
  var zdims = {}
  var id = generateID();
  
  var x = d3.scaleLinear();
  var y = d3.scaleLinear();
  var orig_x, orig_y, orig_z;
  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);
  var zAxis = d3.axisRight(z);
  var xAxisGrid = d3.axisBottom(x);
  var yAxisGrid = d3.axisLeft(y);
  var colormap = jet_colormap;  
  
  var zoomed = function() {
    //console.log(d3.event.transform);
    if (d3.event && d3.event.transform) {
      // emulating old zoom behavior:
      var new_x = d3.event.transform.rescaleX(orig_x),
          new_y = d3.event.transform.rescaleY(orig_y);
      
      x.domain(new_x.domain());
      y.domain(new_y.domain());
    }
    _redraw_main = true;
  }
  var zoom = d3.zoom().on("zoom.heatmap", zoomed);
  var resetzoom = function() {
    var zoombox = chart.mainview.select("rect.zoom.box");
    zoombox.call(zoom.transform, d3.zoomIdentity);
  }
  
  var cb_zoomed = function() {
    var svg = d3.select(this);
    if (d3.event && d3.event.transform) {
      // emulating old zoom behavior:
      var new_z = d3.event.transform.rescaleY(orig_z);
      z.domain(new_z.domain());
    }
    zdims.zmax = Math.max.apply(Math, z.domain());
    zdims.zmin = Math.min.apply(Math, z.domain());
    svg.select(".z.axis").call(zAxis);
    _recalculate_main = true;
    _redraw_colorbar = true;
    //chart.redrawImage();
  }
  var cb_zoom = d3.zoom()
    .on("zoom.colorbar", null)
    .on("zoom.colorbar", cb_zoomed);
    
  var cb_resetzoom = function() {
    chart.colorbar.svg.call(cb_zoom.transform, d3.zoomIdentity);
  }
  
  //var dispatch = d3.dispatch("update", "redrawImage");
  //dispatch.on("redrawImage", function() {
  //      _redraw_backing = true;
  //      chart.redrawImage();
  //});
  
  // some private working variables
  var backing_canvases; //  = [document.createElement('canvas');
  var backing_images = [];
  var colorbar_backing_canvas = document.createElement('canvas');
  var _recalculate_main = false;
  var _redraw_main = false;
  var _redraw_backing = true;
  var _redraw_colorbar = true;
  var _colormap_array = [];

  function chart(selection) {
    selection.each(function(data) {
      var offset_right = (options.show_colorbar) ? options.colorbar_width + 20 : 0;
      var outercontainer = d3.select(this),
        innerwidth = outercontainer.node().clientWidth - offset_right,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - options.margin.right - options.margin.left,
        height = innerheight - options.margin.top - options.margin.bottom;
      chart.outercontainer = outercontainer;
      source_data = data;
      backing_canvases = source_data.map(function() { return document.createElement('canvas') });
      //chart.update = function() { outercontainer.transition().call(chart); chart.colorbar.update(); };   
      if (options.autoscale) {
        var zmin = +Infinity;
        var zmax = -Infinity;
    
        source_data.forEach(function (sd) {
          var new_min_max = get_min_max(sd.data, z);
          zmin = Math.min(zmin, new_min_max.min);
          zmax = Math.max(zmax, new_min_max.max);
        })
        zdims.zmin = zmin;
        zdims.zmax = zmax;
      } else {
        zdims.zmin = options.zmin;
        zdims.zmax = options.zmax;
      }
      
      
      
      var limits = fixAspect(width, height);
      // Update the x-scale.
      x
        .domain([limits.xmin, limits.xmax])
        .range([0, width]);
        
      // Update the y-scale.
      y
        .domain([limits.ymin, limits.ymax])
        .range([height, 0]);
      
      z
        .domain([zdims.zmin, zdims.zmax])
      
      // store these for later use.    
      orig_x = x.copy();
      orig_y = y.copy();
      orig_z = z.copy();
      
      make_all_plotdata();
      
      xAxisGrid
        .scale(x)
        .ticks(options.numberOfTicks)
        .tickPadding(10)
        .tickSize(-height, 0, 0)
        .tickFormat("");
        
      yAxisGrid
        .scale(y)
        .ticks(options.numberOfTicks)
        .tickPadding(10)	
        .tickSize(-width, 0, 0)
        .tickFormat("");
      
      xAxis
        .scale(x)
        .ticks(options.numberOfTicks)
        .tickPadding(10);
                      
      yAxis
        .scale(y)
        .ticks(options.numberOfTicks)
        .tickPadding(10);        
      
      var container = outercontainer.append("div")
        .attr("class", "heatmap-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("display", "inline-block")
        .style("position", "relative")
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
      
      var mainCanvas = container.append("canvas");
      mainCanvas
          .attr("width", width)
          .attr("height", height)
          .attr("class", "mainplot")
          .style("position", "absolute")
          .style("left", options.margin.left + "px")
          .style("top", options.margin.top + "px")
          .style("width", width + "px")
          .style("height", height + "px")
          
      mainCanvas.call(drawImages);
                
      chart.mainCanvas = mainCanvas;
      
      var svg = container
        .append("svg")
        .attr("width", width + options.margin.left + options.margin.right)
        .attr("height", height + options.margin.top + options.margin.bottom)
        .attr("class", "mainplot")
        
      var mainview = svg
        .append("g")
          .attr("class", "mainview")
          .attr("width", width)
          .attr("height", height)
          .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")")
          .on("dblclick.resetzoom", resetzoom);
                
      mainview.append("g")
        .attr("class", "x axis")
        .append("text")
          .attr("class", "x axis-label")
          .attr("x", width/2.0)
          .attr("text-anchor", "middle")
          .attr("y", options.margin.bottom - 5)
      mainview.append("g")
        .attr("class", "y axis")
        .append("text")
          .attr("class", "y axis-label")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("y", -options.margin.left + 15 )
          .attr("x", -height/2)
      
      mainview.append("g")
        .attr("class", "x grid")
        //.attr("transform", "translate(0," + height + ")");         
      mainview.append("g")
        .attr("class", "y grid");
      
      mainview.append("rect")
        .attr("class", "zoom box")
        .attr("width", width)
        .attr("height", height)
        .style("visibility", "hidden")
        .attr("pointer-events", "all")
        
      mainview.append("g")
        .attr("class", "interactor-layer")
      
      mainview.select(".x.axis").call(xAxis);
      mainview.select(".y.axis").call(yAxis);
      mainview.select(".x.grid").call(xAxisGrid);
      mainview.select(".y.grid").call(yAxisGrid);
      // remove added attr that blocks styling:
      mainview.select(".x.axis-label").html(((options.axes || {}).xaxis || {}).label || "x-axis");
      mainview.select(".y.axis-label").html(((options.axes || {}).yaxis || {}).label || "y-axis");
      mainview.selectAll(".grid .tick line").attr("stroke", null);
      
      mainview.selectAll("g.x")
        .attr("transform", "translate(0," + height + ")");
        
      chart.svg = svg;
      chart.mainview = mainview;
      
      chart.position_cursor(options.position_cursor);
    });
    selection.call(chart.colorbar);
  }
  
  chart.colorbar = function(selection) {
    selection.each(function(data) {      
      var outercontainer = d3.select(this),
        offset_left = 0,
        innerwidth = options.colorbar_width,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - options.cb_margin.right,
        height = innerheight - options.cb_margin.top - options.cb_margin.bottom;
      //colorbar.name = "colorbar";
      chart.colorbar.outercontainer = outercontainer;
      
      
      // update the z axis
      z.range([height, 0]);
      orig_z = z.copy();
        
      zAxis
        .scale(z)
        .ticks(options.numberOfTicks)
        .tickPadding(10);
     
      chart.colorbar.resetzoom = cb_resetzoom;
      chart.colorbar.zoom = cb_zoom;
      
      // if inner container doesn't exist, build it.
      var colorbarCanvas;
      var container = outercontainer.append("div")
        .attr("class", "colorbar-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("display", "inline-block")
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
        
      var colorbarCanvas = container.append("canvas")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "colorbar")
        .style("width", width + "px")
        .style("height", height + "px")
        .style("padding-left", offset_left + "px")
        .style("padding-right", options.cb_margin.right + "px")
        .style("padding-top", options.cb_margin.top + "px")

      colorbarCanvas.call(drawScale);
                
      chart.colorbar.colorbarCanvas = colorbarCanvas;
      
      var svg = container
        .append("svg")
          .attr("class", "colorbar")
          .call(cb_zoom)
          .on("dblclick.zoom", null)
          .on("dblclick.resetzoom", null)
          .on("dblclick.resetzoom", cb_resetzoom);

      svg.append("g")
          .attr("class", "z axis");
    
      svg.select(".z.axis").call(zAxis);
      
      svg.attr("width", width + options.cb_margin.right)
          .attr("height", height + options.cb_margin.top + options.cb_margin.bottom);
      
      svg.selectAll("g.z")
        .attr("transform", "translate(" + width + "," + options.cb_margin.top + ")");
        
      chart.colorbar.svg = svg;
    });
  }

  chart.colorbar.update = function() { chart.colorbar.colorbarCanvas.call(drawScale); _redraw_colorbar = true; };   
  
  chart.colormap=function(_) {
    if (!arguments.length) return colormap;
    colormap = _;
    _colormap_array = [];
    for (var i=0; i<256; i++) {
        _colormap_array[i] = d3.rgb(colormap(i));
        _colormap_array[i].a = 255;
    }
    _colormap_array[256] = d3.rgb(0,0,0);
    _colormap_array[256].a = 0;
    _redraw_colorbar = true;
    return chart;
  };
  
  // cache the colormap:
  chart.colormap(colormap);

  //chart.dispatch = dispatch;
  
  chart.redrawImage = function() {
    _redraw_backing = true;
    make_all_plotdata();
    drawImages(this.mainCanvas);
    return chart;
  };
  
  chart.redrawLoop = function() {
    if (_recalculate_main == true) {
      _recalculate_main = false;
      make_all_plotdata();
      _redraw_backing = true;
      _redraw_main = true;
      //drawImage(chart.mainCanvas) //, plotdata);
    }
    if (_redraw_main == true) {
      _redraw_main = false;
      var mainview = chart.mainview;
      var canvas = chart.mainCanvas;
      var container = chart.outercontainer;
      mainview.select(".x.axis").call(xAxis);
      mainview.select(".y.axis").call(yAxis);
      mainview.select(".x.axis .x.axis-label").html(options.axes.xaxis.label);
      mainview.select(".y.axis .y.axis-label").html(options.axes.yaxis.label);
      mainview.select(".grid.x").call(xAxisGrid);
      mainview.select(".grid.y").call(yAxisGrid);
      // remove added attr that blocks styling:
      mainview.selectAll(".grid .tick line").attr("stroke", null);

      chart.mainCanvas.call(drawImages);
      
      chart.interactors().forEach(function(d,i) { if (d.update) {d.update();}});
    }
    window.requestAnimationFrame(chart.redrawLoop);
  };
  
  window.requestAnimationFrame(chart.redrawLoop);
  
  chart.update = function() { _redraw_main = true; return chart }
  
  chart.margin = function(_) {
    if (!arguments.length) return options.margin;
    options.margin = _;
    return chart;
  };

  chart.show_grid = function(_) {
    if (!arguments.length) return options.show_grid;
    options.show_grid = _;
    chart.svg.selectAll(".grid").style(
      "visibility", (options.show_grid == true || options.show_grid == "true") ? "visible" : "hidden"
    );
    return chart;
  };
  
  chart.ztransform = function(_) {
    if (!arguments.length) return options.ztransform;
    options.ztransform = _;
    var old_range = z.range(),
        old_domain = z.domain();
    z = getScale(options.ztransform);
    do_autoscale();
    z.domain([zdims.zmin, zdims.zmax]).range(old_range);
    orig_z = z.copy();
    zAxis.scale(z);
    //cb_zoom.y(z);
    cb_resetzoom.call(chart.colorbar.svg.node());
    return chart;
  };
  
  chart.xlabel = function(_) {
    if (!arguments.length) return options.xlabel;
    options.xlabel = _;
    if (options.axes && options.axes.xaxis) {
      options.axes.xaxis.label = _;
    }
    if (chart.svg && chart.svg.select) {
      chart.svg.select(".x.axis .x.axis-label").text(_);
    }
    return chart;
  }
  
  chart.ylabel = function(_) {
    if (!arguments.length) return options.ylabel;
    options.ylabel = _;
    if (options.axes && options.axes.yaxis) {
      options.axes.yaxis.label = _;
    }
    if (chart.svg && chart.svg.select) {
      chart.svg.select(".y.axis .y.axis-label").text(_);
    }
    return chart;
  }
  
  chart.aspect_ratio = function(_) {
    if (!arguments.length) return options.aspect_ratio;
    options.aspect_ratio = _;
    var offset_right = (options.show_colorbar) ? options.colorbar_width + 5 : 0;
    var outercontainer = this.outercontainer,
        innerwidth = outercontainer.node().clientWidth - offset_right,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - options.margin.right - options.margin.left,
        height = innerheight - options.margin.top - options.margin.bottom;
        
    var limits = fixAspect(width, height);
      // Update the x-scale.
      x.domain([limits.xmin, limits.xmax]);
        
      // Update the y-scale.
      y.domain([limits.ymin, limits.ymax]);
    orig_x = x.copy();
    orig_y = y.copy();
    return chart;
  }
  
  chart.position_cursor = function(_) {
    if (!arguments.length) return options.position_cursor;
    options.position_cursor = _;
    if (options.position_cursor) {
      var svg = chart.svg,
          mainview = chart.mainview;
      var position_cursor = mainview.select("text.position-cursor");
      if (position_cursor.empty()) {
        position_cursor = mainview.append("text")
          .attr("class", "position-cursor")
          .style("text-anchor", "end");
      }
       
      position_cursor
        .attr("x", parseFloat(mainview.attr("width")) - 10)
        .attr("y", parseFloat(mainview.attr("height")) + options.margin.bottom)
        
      function get_z(data, dims, x_coord, y_coord) {
        if (x_coord > dims.xmax || x_coord < dims.xmin || y_coord > dims.ymax || y_coord < dims.ymin) {
          return NaN
        }
        else {
          var x_bin = Math.floor((x_coord - dims.xmin) / (dims.xmax - dims.xmin) * dims.xdim),
              y_bin = Math.floor((y_coord - dims.ymin) / (dims.ymax - dims.ymin) * dims.ydim);

          // x_bin and y_bin are int
          // var row_major = options.source_order.toUpperCase() == "C";
          // var p = (row_major) ? ((x_bin * dims.ydim) + y_bin) : ((y_bin * dims.xdim) + x_bin);
          var p = ((x_bin * dims.ydim) + y_bin);
          return data[p];
        }
      }
      
      var follow = function (){  
        if (source_data == null || source_data[0] == null) { return }
        var mouse = d3.mouse(mainview.node());
        var x_coord = x.invert(mouse[0]),
            y_coord = y.invert(mouse[1]);
        // start at the top and move down through the datasets:
        var z_coord = NaN;
        var nd = source_data.length;
        while ((isNaN(z_coord) || z_coord == null) && nd--) {
          var sd = source_data[nd];
          z_coord = get_z(sd.data, sd.dims, x_coord, y_coord);
        }
        position_cursor.text(
          x_coord.toPrecision(5) + 
          ", " + 
          y_coord.toPrecision(5) + 
          ", " + 
          ((isNaN(z_coord) || z_coord == null) ? 'NaN' : z_coord.toPrecision(5)));
      }
      svg
        .on("mousemove.position_cursor", follow)
        .on("mouseover.position_cursor", follow);
    }
    else {
      chart.mainview.selectAll(".position-cursor").remove();
      chart.svg
        .on("mousemove.position_cursor", null)
        .on("mouseover.position_cursor", null)
    }
    return chart;
  }
  
  // drop all the other options into the chart namespace,
  // making objects update rather than overwrite
  for (var attr in options) {
    // ignore the ones we've already defined accessors for.
    if (!(attr in chart)) {
      chart[attr] = (function(attr) {     
        var accessor = function(_) {
          if (!arguments.length) return options[attr];
          if (type(options[attr]) == "object") {
            extend(options[attr], _); 
          } else {
            options[attr] = _;
          }
          return chart;
        }
        return accessor
      })(attr);
    }
  }
  
  //chart.zoomRect = function(_) {
  //  if (!arguments.length) return zoomRect;
  //  zoomRect = _;
  //  return chart;
  //};
  
  chart.zoomScroll = function(_) {
    if (!arguments.length) return zoomScroll;
    zoomScroll = _;
    //var scrollLayer = chart.svg.select("g.mainview rect");
    var zoombox = chart.svg.select("g.mainview rect.zoom.box");
    if (zoomScroll == true) {
      zoombox.call(zoom).on("dblclick.zoom", null);
    }
    else if (zoomScroll == false) {
      zoombox.on(".zoom", null);
    }
    return chart;
  };
  
  chart.resetzoom = resetzoom;
  
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
  
  chart.z = function(_) {
    if (!arguments.length) return z;
    z = _;
    return chart;
  };
  
  chart.source_data = function(_) {
    if (!arguments.length) return source_data;
    source_data = _;
    backing_canvases = source_data.map(function() {
        return document.createElement('canvas');
    })
    backing_images = [];
    if (options.autoscale) {
      do_autoscale();
    }
    _recalculate_main = true;
  };
  
  chart.interactors = function(_) {
    if (!arguments.length) return interactors;
    if ( _ == null ) {
      // null passed intentionally: clear all
      chart.svg.selectAll("g.interactor-layer g.interactors").remove();
      interactors = [];
      return chart;
    }
    else {
      chart.svg.select("g.interactor-layer").call(_);
      _.x(x).y(y).update();
      interactors.push(_);
      return chart;
    }
  };
  
  chart.destroy = function() {
    //delete backing_canvas;
    //delete colorbar_backing_canvas;
    var rs = this.outercontainer.selectAll("svg").remove();
    for (var i in rs) {delete rs[i]};
    var rd = this.outercontainer.selectAll("div").remove();
    for (var i in rd) {delete rd[i]};
    var rc = this.outercontainer.selectAll("canvas").remove();
    for (var i in rc) {delete rc[i]};
  };

  var get_sxdx = function(image_index){
    let dims = source_data[image_index].dims;
    var delta_x = (dims.xmax - dims.xmin)/(dims.xdim),
        delta_y = (dims.ymax - dims.ymin)/(dims.ydim);
    
    var graph_xmax = Math.max.apply(Math, x.domain()),
        graph_xmin = Math.min.apply(Math, x.domain()),
        graph_ymax = Math.max.apply(Math, y.domain()),
        graph_ymin = Math.min.apply(Math, y.domain());
    
    var xmin = Math.max(graph_xmin, dims.xmin), xmax = Math.min(graph_xmax, dims.xmax);
    var ymin = Math.max(graph_ymin, dims.ymin), ymax = Math.min(graph_ymax, dims.ymax);
    if (debug) {
      console.log('x', xmin,xmax, 'y', ymin,ymax, 'w', (xmax-xmin), 'h', (ymax-ymin));
      console.log('dims', dims);
    }
    
    var sx  = (xmin - dims.xmin)/delta_x, sy  = (dims.ymax - ymax)/delta_y,
      sx2 = (xmax - dims.xmin)/delta_x, sy2 = (dims.ymax - ymin)/delta_y,
      sw = sx2 - sx, sh = sy2 - sy;
    if (debug)
      console.log('sx', sx, 'sy', sy, 'sw', sw, 'sh', sh, '   sx2 ', sx2, 'sy2 ', sy2);
    
    var dx = x(xmin),
      dy = y(ymax),
      dw = x(xmax) - dx, 
      dh = y(ymin) - dy;
    if (debug)
      console.log('dx', dx, 'dy', dy, 'dw', dw, 'dh', dh);
    return {sx:sx, sy:sy, sw:sw, sh:sh, dx:dx, dy:dy, dw:dw, dh:dh}
  };
  
  var fixAspect = function(width, height) {
    var aspect_ratio = options.aspect_ratio;
    var xmin = Math.min.apply(
      null,
      source_data.map(function(sd) { return sd.dims.xmin})
    );
    var xmax = Math.max.apply(
      null,
      source_data.map(function(sd) { return sd.dims.xmax})
    );
    var ymin = Math.min.apply(
      null,
      source_data.map(function(sd) { return sd.dims.ymin})
    );
    var ymax = Math.max.apply(
      null,
      source_data.map(function(sd) { return sd.dims.ymax})
    );
    if (aspect_ratio == null) {
      return {'xmin': xmin, 'xmax': xmax, 'ymin': ymin, 'ymax': ymax}
    }
    var yrange = (ymax - ymin);
    var ycenter = (ymax + ymin) / 2.0;
    var xrange = (xmax - xmin);
    var xcenter = (xmax + xmin) / 2.0;
    var graph_ratio = width / height;
    var ratio = yrange/xrange * graph_ratio;
    if (isNaN(ratio) || ratio == aspect_ratio) { return };
    if (ratio < aspect_ratio) { // y-range is too small
        yrange = aspect_ratio * xrange / graph_ratio;
    }
    if (ratio > aspect_ratio) {
        xrange = yrange / aspect_ratio * graph_ratio;
    }
            
    var output = {
        'xmin': xcenter - xrange/2.0, 
        'xmax': xcenter + xrange/2.0,
        'ymin': ycenter - yrange/2.0, 
        'ymax': ycenter + yrange/2.0
    }
    return output;
  };
  
  // Compute the pixel colors; scaled by CSS.
  function drawImages(canvas) {
    // canvas is a d3 selection.
    //var plotdata = canvas.data()[0];
    var maxColorIndex = 255,
      overflowIndex = 256,
      context = canvas.node().getContext("2d");
    var source_contexts = backing_canvases.map(function(bc) {
      return bc.getContext('2d');
    })
    
        
    if (_redraw_backing) {
      _redraw_backing = false;
      for (var image_index in source_data) {
        let dims = source_data[image_index].dims;
        let bc = backing_canvases[image_index];
        let ctx = source_contexts[image_index];
        let plotdata = plotdatas[image_index];
        var height = dims.ydim,
            width = dims.xdim,
            size = height * width;
        let bi = (backing_images || [])[image_index];
        if (bi == null || bi.width != width || bi.height != height) {
            bc.width = width;
            bc.height = height;
            bi = ctx.createImageData(width, height);
        }
        var data = bi.data;
        backing_images[image_index] = bi;
        var p=0;
        for (var offset=0; offset < size; offset++) {
            var c = _colormap_array[plotdata[offset]];
            data[p++] = c.r;
            data[p++] = c.g;
            data[p++] = c.b;
            data[p++] = c.a;
        }
        ctx.putImageData(bi, 0, 0);
      }
    }
    
    //context.mozImageSmoothingEnabled = false;
    //context.webkitImageSmoothingEnabled = false;
    //context.msImageSmoothingEnabled = false;
    //context.imageSmoothingEnabled = false;

     
    context.clearRect(0,0, context.canvas.width, context.canvas.height);
    if (context.mozImageSmoothingEnabled) context.mozImageSmoothingEnabled = false;
    if (context.imageSmoothingEnabled) context.imageSmoothingEnabled = false;
    if (context.msImageSmoothingEnabled) context.msImageSmoothingEnabled = false;
    if (context.webkitImageSmoothingEnabled) context.webkitImageSmoothingEnabled = false;

    for (var image_index in source_contexts) {
      var sxdx = get_sxdx(image_index);
      let ctx = source_contexts[image_index];
      context.drawImage(ctx.canvas, sxdx.sx, sxdx.sy, sxdx.sw, sxdx.sh, sxdx.dx, sxdx.dy, sxdx.dw, sxdx.dh);
    }
    
  }
  
  // Compute the pixel colors; scaled by CSS.
  function drawScale(canvas) {
    var maxColorIndex = 255,
      overflowIndex = 256,
      context = canvas.node().getContext("2d"),
      ctx = colorbar_backing_canvas.getContext("2d");        
    if (_redraw_colorbar) {
      _redraw_colorbar = false;        
      colorbar_backing_canvas.width = 1;
      colorbar_backing_canvas.height = 256;
      var image = ctx.createImageData(1, 256);
      var data = image.data;
      for (var yp = 255, p = -1; yp >= 0; --yp) {
        var c = _colormap_array[yp];
        data[++p] = c.r;
        data[++p] = c.g;
        data[++p] = c.b;
        data[++p] = c.a;
      }
      ctx.putImageData(image, 0, 0);
    }
     
    context.clearRect(0,0, context.canvas.width, context.canvas.height);
    if (context.mozImageSmoothingEnabled) context.mozImageSmoothingEnabled = false;
    if (context.imageSmoothingEnabled) context.imageSmoothingEnabled = false;
    context.drawImage(ctx.canvas, 0, 0, 1, 256, 0, 0, context.canvas.width, context.canvas.height);
  }
  
  function make_all_plotdata() {
    var new_plotdatas = [];
    for (var sd of source_data) {
      new_plotdatas.push(make_single_plotdata(sd.data, sd.dims));  
    }
    plotdatas = new_plotdatas;
    _redraw_backing = true;
    return
  }

  // call after setting transform
  function make_single_plotdata(source_data, dims) {
    // source_data is 2d array
    var overflowIndex = 256;
    var plotz = z.copy().range([0,255]);
    var clamped = new Uint8ClampedArray(1);
    var height = dims.ydim,
        width = dims.xdim,
        size = height * width;
    // set the local plotdata:
    var new_plotdata = new Uint16Array(size);
    
    // source data is an array, but the order can be "F" or "C" (default)
    let f_order = (String(options.source_order).toUpperCase() == 'F');
    /* from the documentation for the ES ImageData object:
     * ...Each component is assigned a consecutive index within the array, with the
     * top left pixel's red component being at index 0 within the array. Pixels then
     * proceed from left to right, then downward, throughout the array.
     *
     * The image array is then "F"-ordered (x-coordinate changes fastest)
     * with an inversion in y, since the data coordinate system is defined
     * to begin (0,0) in the lower-left corner.
     *
     */

    let image_stride = [1, -width];
    let image_offset = (height-1) * width;
    let data_stride = (f_order) ? [1, width] : [height, 1];
    //let data_offset = 0;

    var image_p, data_p, image_p_i, data_p_i, source_data_p;
    for (let i=0; i<width; i++) {
      image_p_i = image_stride[0] * i + image_offset;
      data_p_i = data_stride[0] * i; // + data_offset; // always zero
      for (let j=0; j<height; j++) {
        image_p = image_p_i + image_stride[1] * j;
        data_p = data_p_i + data_stride[1] * j;
        source_data_p = source_data[data_p];
        if (isNaN(source_data_p) || source_data_p == null) {
          new_plotdata[image_p] = overflowIndex;
        }
        else {
          var pz = plotz(source_data_p);
          clamped[0] = plotz(source_data_p);
          new_plotdata[image_p] = clamped[0];
        }
      }
    }

    return new_plotdata;
  };
  
  function do_autoscale() {
    var min = +Infinity;
    var max = -Infinity;

    source_data.forEach(function (sd) {
      var new_min_max = get_min_max(sd.data, z);
      min = Math.min(min, new_min_max.min);
      max = Math.max(max, new_min_max.max);
    })

    if (!isFinite(min) || !isFinite(max)) {
        min = 1;
        max = 2; // need to put something for invalid input scales.
    }

    zdims.zmin = min;
    zdims.zmax = max;
    z.domain([min, max]);
    //cb_zoom.y(z);
    zAxis.scale(z);
    cb_zoomed.call(chart.colorbar.svg.node()); 
    chart.colorbar.svg.select(".z.axis").call(zAxis);
    _recalculate_main = true;    
  }
  chart.do_autoscale = do_autoscale;
  
  function get_min_max(array, transform) {
    var min = Infinity;
    var max = -Infinity;
    var len = array.length;
    while (len--) {
      let element = array[len];
      let t_el = transform(element);
      if (isFinite(t_el)) {
        if (element > max) {
          max = element;
        }
        if (element < min) {
          min = element;
        }
      } 
    }
    return {min: min, max: max}
  };
  
  function generate_cumsums() {
    //console.log('generating cumsum');
    var height = dims.ydim,
        width = dims.xdim,
        data = source_data;
    
    var cumsum_x = [], cumsum_x_col;
    var cumsum_y = [], cumsum_y_col;
    var ysum = [], xsum;
    // initialize the y-sum:
    for (var r = 0; r<height; r++) ysum[r] = 0;
    cumsum_y[0] = ysum.slice();
           
    for (var c = 0; c < width; c++) {
      cumsum_x_col = [0]; xsum = 0;
      cumsum_y_col = [];
      for (var r = 0; r < height; r++) {
        var z = data[r*width + c];
        if (isFinite(z)) {
          xsum += z;
          ysum[r] += z;
        }
        cumsum_x_col[r] = xsum;
        cumsum_y_col[r] = ysum[r];  
      }
      cumsum_x[c] = cumsum_x_col;
      cumsum_y[c] = cumsum_y_col;
    }
    return {x: cumsum_x, y: cumsum_y}
    //this.cumsum_x = cumsum_x;
    //this.cumsum_y = cumsum_y;
  };
  
  chart.generate_cumsums = generate_cumsums;
  
  chart.autofit = function() {
    var offset_right = (options.show_colorbar) ? options.colorbar_width + 5 : 0;
    var outercontainer = chart.outercontainer,
        innerwidth = outercontainer.node().clientWidth - offset_right,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - options.margin.right - options.margin.left,
        height = innerheight - options.margin.top - options.margin.bottom;
        
    var limits = fixAspect(width, height);
      // Update the x-scale.
      x
        .domain([limits.xmin, limits.xmax])
        .range([0, width]);
        
      // Update the y-scale.
      y
        .domain([limits.ymin, limits.ymax])
        .range([height, 0]);
    
    orig_x = x.copy();
    orig_y = y.copy();
    
    //zoom.x(x).y(y);
    outercontainer.select(".heatmap-container")
      .attr("width", innerwidth)
      .attr("height", innerheight)
      .style("width", innerwidth + "px")
      .style("height", innerheight + "px");
    
    outercontainer.select("canvas.mainplot")
          .attr("width", width)
          .attr("height", height)
          .style("width", width + "px")
          .style("height", height + "px")
      
    chart.svg.attr("width", width + options.margin.left + options.margin.right)
          .attr("height", height + options.margin.top + options.margin.bottom);
    
    chart.mainview
      .attr("width", width)
      .attr("height", height)
      .selectAll("g.x")
        .attr("transform", "translate(0, " + height + ")");
    
    chart.svg.selectAll(".x.axis-label").attr("x", width/2.0);
    chart.svg.selectAll(".y.axis-label").attr("x", -height/2.0);
          
    var innerwidth = options.colorbar_width,
        width = innerwidth - options.cb_margin.right,
        height = innerheight - options.cb_margin.top - options.cb_margin.bottom;
    
    z.range([height, 0]);
    
    outercontainer.select(".colorbar-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
    
    outercontainer.select("canvas.colorbar")
          .attr("width", width)
          .attr("height", height)
          .style("width", width + "px")
          .style("height", height + "px")
          .call(drawScale);
    
    chart.colorbar.svg.select(".z.axis").call(zAxis);
    chart.colorbar.svg.attr("width", width + options.cb_margin.left + options.cb_margin.right)
      .attr("height", height + options.cb_margin.top + options.cb_margin.bottom);
      
    chart.colorbar.svg.selectAll("g.z")
        .attr("transform", "translate(" + width + "," + options.cb_margin.top + ")");

    chart.position_cursor(options.position_cursor);
    _redraw_main = true;
  }
  
  chart.type = "heatmap_2d";
  
  return chart
  
}

function getScale(scalename) {
  return d3['scale' + scalename.slice(0,1).toUpperCase() + scalename.slice(1).toLowerCase()]();
}

var jet_colormap = d3.scaleLinear()
    .domain([0, 31, 63, 95, 127, 159, 191, 223, 255])
    /* Jet:
      #00007F: dark blue
      #0000FF: blue
      #007FFF: azure
      #00FFFF: cyan
      #7FFF7F: light green
      #FFFF00: yellow
      #FF7F00: orange
      #FF0000: red
      #7F0000: dark red
      #00000000: transparent for overflow
    */
    .range(["#00007F", "#0000FF","#007FFF", "#00FFFF","#7FFF7F","#FFFF00","#FF7F00","#FF0000","#7F0000"]);

