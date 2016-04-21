//"use strict";

if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

function heatChart(options_override) {
  var debug=false;
  var options_defaults = {
    margin: {top: 10, right: 10, bottom: 50, left: 50},
    cb_margin: {top: 10, right: 50, bottom: 50, left: 10},
    show_grid: true,
    show_colorbar: true,
    colorbar_width: 120,
    numberOfTicks: 4,
    aspect_ratio: null,
    autoscale: false,
    xlabel: "x-axis",
    ylabel: "y-axis",
    zlabel: "z-axis",
    ztransform: "linear", 
    dims: {
      xmin: 0,
      xmax: 1,
      ymin: 0, 
      ymax: 1,
      zmin: 1.0,
      zmax: 100.0
    }
  }
  var options = jQuery.extend(true, {}, options_defaults); // copy
  jQuery.extend(true, options, options_override); // process any overrides from creation;
  
  //var zoomRect = false;
  var zoomScroll = false;
  var interactors = [];
  var plotdata, source_data;
  var z = d3.scale[options.ztransform]();
    
  var dims = options.dims;
  // create working copy of zmax and zmin, for zooming colorbar
  var zdims = {}
  var id = d3.id();
  
  var x = d3.scale.linear();
  var y = d3.scale.linear();
  var xAxis = d3.svg.axis();
  var yAxis = d3.svg.axis();
  var zAxis = d3.svg.axis();
  var xAxisGrid = d3.svg.axis();
  var yAxisGrid = d3.svg.axis();
  var colormap = jet_colormap;  
  
  var zoomed = function() {
    _redraw_main = true;
  }
  var zoom = d3.behavior.zoom().on("zoom.heatmap", zoomed);
  var resetzoom = function() {
    zoom.translate([0,0]).scale(1);
    zoomed.call(this);
  }
  
  var cb_zoomed = function() {
    var svg = d3.select(this);
    svg.select(".z.axis").call(zAxis);
	  zdims.zmax = Math.max.apply(Math, z.domain());
	  zdims.zmin = Math.min.apply(Math, z.domain());
	  _recalculate_main = true;
	  //chart.redrawImage();
  }
  var cb_zoom = d3.behavior.zoom()
    .on("zoom.colorbar", null)
    .on("zoom.colorbar", cb_zoomed);
    
  var cb_resetzoom = function() {
    cb_zoom.translate([0,0]).scale(1);
    cb_zoomed.call(this);
  }
  
  //var dispatch = d3.dispatch("update", "redrawImage");
  //dispatch.on("redrawImage", function() {
  //      _redraw_backing = true;
  //      chart.redrawImage();
  //});
  
  // some private working variables
  var backing_canvas = document.createElement('canvas');
  var backing_image;
  var colorbar_backing_canvas = document.createElement('canvas');
  var _recalculate_main = false;
  var _redraw_main = false;
  var _redraw_backing = true;
  var _redraw_colorbar = true;
  var _colormap_array = [];

  function chart(selection) {
    selection.each(function(data) {
      var offset_right = (options.show_colorbar) ? options.colorbar_width + 5 : 0;
      var outercontainer = d3.select(this),
        innerwidth = outercontainer.node().clientWidth - offset_right,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - options.margin.right - options.margin.left,
        height = innerheight - options.margin.top - options.margin.bottom;
      chart.outercontainer = outercontainer;
      source_data = data;
      //chart.update = function() { outercontainer.transition().call(chart); chart.colorbar.update(); };   
      if (options.autoscale) {
        var new_min_max = get_min_max(data, z);
        zdims.zmin = new_min_max.min;
        zdims.zmax = new_min_max.max;
      } else {
        zdims.zmin = dims.zmin;
        zdims.zmax = dims.zmax;
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
          
      make_plotdata();
      
      xAxisGrid
        .scale(x)
        .orient("bottom")
        .ticks(options.numberOfTicks)
        .tickPadding(10)
        .tickSize(-height, 0, 0)
        .tickFormat("");
        
      yAxisGrid
        .scale(y)
        .ticks(options.numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("left")
        .tickSize(-width, 0, 0)
        .tickFormat("")
      
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
        
        
      // we will bind data to the container div, a slightly non-standard
      // arrangement.
      var container = d3.select(this).selectAll("div.heatmap-container").data([0]);
      
      zoom.x(x).y(y);
      
      // if inner container doesn't exist, build it.
      container.enter().append("div")
        .attr("class", "heatmap-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("display", "inline-block")
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
        
      var mainCanvas = container.selectAll("canvas.mainplot").data([0]);
      mainCanvas.enter().append("canvas");
      mainCanvas
          .attr("width", width)
          .attr("height", height)
          .attr("class", "mainplot")
          .style("width", width + "px")
          .style("height", height + "px")
          .style("padding-left", options.margin.left + "px")
          .style("padding-right", options.margin.right + "px")
          .call(drawImage);
                
      chart.mainCanvas = mainCanvas;
      
      var svg = container.selectAll("svg.mainplot").data([0]);
      var esvg = svg.enter()
        .append("svg")
          .attr("class", "mainplot")
          .on("dblclick.resetzoom", resetzoom);
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
	    
      esvg.append("g")
        .attr("class", "y axis");
      esvg.append("g")
        .attr("class", "x grid");           
      esvg.append("g")
        .attr("class", "y grid");
      esvg.append("g")
        .attr("class", "y interactors")
      
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis);
      svg.select(".x.grid").call(xAxisGrid);
      svg.select(".y.grid").call(yAxisGrid);
      svg.select(".x.axis-label").text(options.xlabel);
      svg.select(".y.axis-label").text(options.ylabel);
      
      svg.attr("width", width + options.margin.left + options.margin.right)
          .attr("height", height + options.margin.top + options.margin.bottom);
                
      svg.selectAll("g.x")
        .attr("transform", "translate(" + options.margin.left + "," + height + ")");
      svg.selectAll("g.y")
        .attr("transform", "translate(" + options.margin.left + ",0)"); 
        
      chart.svg = svg;
      //svg.call(zoom); // moved to zoomScroll function
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
        
      zAxis
        .scale(z)
        .ticks(options.numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("right");
        
      // we will bind data to the container div, a slightly non-standard
      // arrangement.
      var container = d3.select(this).selectAll("div.colorbar-container").data([0]);
     
      cb_zoom.y(z);
      chart.colorbar.resetzoom = cb_resetzoom;
      chart.colorbar.zoom = cb_zoom;
      
      // if inner container doesn't exist, build it.
      container.enter().append("div")
        .attr("class", "colorbar-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("display", "inline-block")
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
        
      var colorbarCanvas = container.selectAll("canvas.colorbar").data([0]);
      colorbarCanvas.enter().append("canvas");
      colorbarCanvas
          .attr("width", width)
          .attr("height", height)
          .attr("class", "colorbar")
          .style("width", width + "px")
          .style("height", height + "px")
          .style("padding-left", offset_left + "px")
          .style("padding-right", options.cb_margin.right + "px")
          .call(drawScale);
                
      chart.colorbar.colorbarCanvas = colorbarCanvas;
      
      var svg = container.selectAll("svg.colorbar").data([0]);
      var esvg = svg.enter()
        .append("svg")
          .attr("class", "colorbar")
          .call(cb_zoom)
          .on("dblclick.zoom", null)
          .on("dblclick.resetzoom", null)
          .on("dblclick.resetzoom", cb_resetzoom);
      esvg.append("g")
          .attr("class", "z axis");
    
      svg.select(".z.axis").call(zAxis);
      
      svg.attr("width", width + options.cb_margin.left + options.cb_margin.right)
          .attr("height", height + options.cb_margin.top + options.cb_margin.bottom);
      
      svg.selectAll("g.z")
        .attr("transform", "translate(" + width + ",0)");
        
      chart.colorbar.svg = svg;
    });
  }
  chart.colorbar.update = function() { this.outercontainer.call(chart.colorbar); };   
  
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
    make_plotdata(this.source_data, dims, zdims, z);
    drawImage(this.mainCanvas);
    return chart;
  };
  
  chart.redrawLoop = function() {
    if (_recalculate_main == true) {
      _recalculate_main = false;
      make_plotdata();
      _redraw_backing = true;
      _redraw_main = true;
      //drawImage(chart.mainCanvas) //, plotdata);
    }
    if (_redraw_main == true) {
      _redraw_main = false;
      var svg = chart.svg;
      var canvas = chart.mainCanvas;
      var container = chart.outercontainer;
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis);
      svg.select(".grid.x").call(xAxisGrid);
      svg.select(".grid.y").call(yAxisGrid);

      chart.mainCanvas.call(drawImage);
      
      chart.interactors().forEach(function(d,i) { if (d.update) {d.update();}});
    }
    window.requestAnimationFrame(chart.redrawLoop);
  };
  
  window.requestAnimationFrame(chart.redrawLoop);
  
  chart.margin = function(_) {
    if (!arguments.length) return options.margin;
    options.margin = _;
    return chart;
  };

  chart.show_grid = function(_) {
    if (!arguments.length) return options.show_grid;
    options.show_grid = _;
    chart.outercontainer.selectAll(".grid").style(
      "display", (options.show_grid == true || options.show_grid == "true") ? "inline" : "none"
    );
    return chart;
  };
  
  chart.ztransform = function(_) {
    if (!arguments.length) return options.ztransform;
    options.ztransform = _;
    var old_range = z.range(),
        old_domain = z.domain();
    z = d3.scale[options.ztransform]();
    do_autoscale();
    z.domain([zdims.zmin, zdims.zmax]).range(old_range);
    zAxis.scale(z);
    cb_zoom.y(z);
    cb_resetzoom.call(chart.colorbar.svg.node());
    return chart;
  };
  
  // drop all the other options into the chart namespace,
  // making objects update rather than overwrite
  for (var attr in options) {
    // ignore the ones we've already defined accessors for.
    if (!(attr in chart)) {
      chart[attr] = (function(attr) {     
        var accessor = function(_) {
          if (!arguments.length) return options[attr];
          if (jQuery.type(options[attr]) == "object") {
            jQuery.extend(options[attr], _); 
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
    if (zoomScroll == true) {
      chart.svg.call(zoom).on("dblclick.zoom", null);
    }
    else if (zoomScroll == false) {
      chart.svg.on(".zoom", null);
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
    if (options.autoscale) {
      do_autoscale();
    }
    _recalculate_main = true;
  };
  
  chart.interactors = function(_) {
    if (!arguments.length) return interactors;
    chart.svg.select("g.interactors").call(_);
    _.x(x).y(y).update();
    interactors.push(_);
    return chart;
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

  var get_sxdx = function(){
    var xdim = source_data[0].length,
        ydim = source_data.length;
    var delta_x = (dims.xmax - dims.xmin)/(xdim),
        delta_y = (dims.ymax - dims.ymin)/(ydim);
    
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
    var aspect_ratio = options.aspect_ratio,
        xmin = dims.xmin,
        xmax = dims.xmax,
        ymin = dims.ymin, 
        ymax = dims.ymax;
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
  function drawImage(canvas) {
    // canvas is a d3 selection.
    //var plotdata = canvas.data()[0];
    var maxColorIndex = 255,
      overflowIndex = 256,
      context = canvas.node().getContext("2d"),
      ctx = backing_canvas.getContext("2d");
        
    if (_redraw_backing) {
      _redraw_backing = false;
      var height = source_data.length,
          width = source_data[0].length;
      if (backing_image == null || backing_canvas.width != width || backing_canvas.height != height) {
        backing_canvas.width = width;
        backing_canvas.height = height;
        backing_image = ctx.createImageData(width, height);
      }
      var data = backing_image.data;
      var yp, pp=0;
      for (var yt = 0, p = -1; yt < height; ++yt) {
        yp = dims.ydim - 1 - yt; // y-axis starts at the top!
        for (var xp = 0; xp < width; ++xp, pp++) {
          var c = _colormap_array[plotdata[pp]];
          data[++p] = c.r;
          data[++p] = c.g;
          data[++p] = c.b;
          data[++p] = c.a;
        }
      }
      ctx.putImageData(backing_image, 0, 0);
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
    var sxdx = get_sxdx();
    context.drawImage(ctx.canvas, sxdx.sx, sxdx.sy, sxdx.sw, sxdx.sh, sxdx.dx, sxdx.dy, sxdx.dw, sxdx.dh);
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
  
  // call after setting transform
  var make_plotdata = function() {
    // source_data is 2d array
    var plotz = z.copy().range([0,255]);
    //var crange = d3.range(256);
    //var lookups = crange.slice(0,255).map(plotz.invert);
    //var threshold = d3.scale.quantile().domain(lookups).range(crange);
    var height = source_data.length,
        width = source_data[0].length;
    // set the local plotdata:
    if (plotdata == null || plotdata.length != (width * height)) {
      plotdata = new Uint8ClampedArray(width*height);
    }
    // plotdata is stored in row-major order ("C"), where row is "y"
    var zz, r, c, dr, plotz, pp=0;
    for (r = height - 1; r >=0; r--) {
      dr = source_data[r];
      for (c = 0; c < width; c++) {
        zz = dr[c];        
        plotdata[pp++] = plotz(zz);
        //plotdata[pp++] = threshold(zz);
      }
    }
    _redraw_backing = true;
    return
  };
  
  function do_autoscale() {
    var new_min_max = get_min_max(source_data, z, Infinity, -Infinity);
    if (!isFinite(new_min_max.min) || !isFinite(new_min_max.max)) {
        new_min_max = {min: 1, max: 2}; // need to put something for invalid input scales.
    } 
        zdims.zmin = new_min_max.min;
        zdims.zmax = new_min_max.max;
    z.domain([zdims.zmin, zdims.zmax]);
    cb_zoom.y(z);
    zAxis.scale(z);
    cb_zoomed.call(chart.colorbar.svg.node()); 
    chart.colorbar.svg.select(".z.axis").call(zAxis);
    _recalculate_main = true;    
  }
  chart.do_autoscale = do_autoscale;
  
  function get_min_max(array, transform, existing_min, existing_max) {
    var new_min_max = {min: existing_min, max: existing_max};
    for (var i=0; i<array.length; i++) {
      var subarr = array[i];
      if (subarr == null) { continue }
      if (!subarr.hasOwnProperty('length')) {
        var t_el = transform(subarr);
        if (isFinite(t_el)) {
          new_min_max = {min: subarr, max: subarr};
        }
      } else {
        new_min_max = get_min_max(subarr, transform, existing_min, existing_max);
      }
      if (existing_min == undefined || new_min_max.min < existing_min) {
        var existing_min = new_min_max.min;
      }
      if (existing_max == undefined || new_min_max.max > existing_max) {
        var existing_max = new_min_max.max;
      }

    }
    return {min: existing_min, max: existing_max}
  };
  
  function generate_cumsums() {
    //console.log('generating cumsum');
    var height = source_data.length,
        width = source_data[0].length,
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
        var z = data[r][c];
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
    var outercontainer = this.outercontainer,
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
    
    zoom.x(x).y(y);
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
    
    chart.svg.selectAll("g.x")
        .attr("transform", "translate(" + options.margin.left + "," + height + ")");
    chart.svg.selectAll("g.y")
        .attr("transform", "translate(" + options.margin.left + ",0)");
    
    chart.svg.selectAll("g.x.axis text").attr("x", width/2.0);
    chart.svg.selectAll("g.y.axis text").attr("x", -height/2.0);
          
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
        .attr("transform", "translate(" + width + ",0)");
        
    _redraw_main = true;
  }
  
  return chart
  
}

var jet_colormap = d3.scale.linear()
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
