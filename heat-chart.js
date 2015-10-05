function heatChart() {
  var debug=false;
  var margin = {top: 10, right: 10, bottom: 50, left: 50};
  var show_grid = true;
  var show_colorbar = true;
  var numberOfTicks = 4;
  var aspect_ratio = null;
  var autoscale = false;
  var interactors = [];
  var transforms = {
    "lin": function(x) {return x},
    "log": function(x) {
        if (x > 0) { return Math.log(x)/Math.LN10 }
        else { return NaN }
    }
  }
  var inverse_transforms = {
    "lin": function(x) {return x},
    "log": function(x) {return Math.pow(10, x)}
  }
  
  var transform = 'lin',
    t = transforms[transform],
    tinv = inverse_transforms[transform];
    
  var dims = {
    xmin: 0,
    xmax: 1,
    ymin: 0, 
    ymax: 1,
    xdim: 512,
    ydim: 512,
    zmin: 1.0,
    zmax: 100.0
  }
  // create working copy of zmax and zmin, for zooming colorbar
  var zdims = {}
  
  var x = d3.scale.linear();
  var y = d3.scale.linear();
  var xAxis = d3.svg.axis();
  var yAxis = d3.svg.axis();
  var xAxisGrid = d3.svg.axis();
  var yAxisGrid = d3.svg.axis();
  var colormap = d3.scale.linear()
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
  
  var zoomed = function() {
    var svg = d3.select(this);
    var container = d3.select(svg.node().parentNode);
    var data = container.data();
    //console.log(container);
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    svg.select(".grid.x").call(xAxisGrid);
    svg.select(".grid.y").call(yAxisGrid);
    container.select('canvas.mainplot').call(drawImage, data);
    
    chart.interactors().forEach(function(d,i) { if (d.update) {d.update();}});
  }
  var zoom = d3.behavior.zoom().on("zoom.main", zoomed);
  var resetzoom = function() {
    zoom.translate([0,0]).scale(1);
    zoomed.call(this);
  }
  
  // some private working variables
  var backing_canvas = document.createElement('canvas');
  var _redraw_backing = true;
  var _colormap_array = [];
  
  

  function chart(selection) {
    selection.each(function(data) {
      var offset_right = (show_colorbar) ? 120 : 0;
      var outercontainer = d3.select(this),
        innerwidth = outercontainer.node().clientWidth - offset_right,
        innerheight = outercontainer.node().clientHeight,
        width = innerwidth - margin.right - margin.left,
        height = innerheight - margin.top - margin.bottom;
      chart.outercontainer = outercontainer;
      chart.update = function() { outercontainer.transition().call(chart); };    
      
      if (autoscale) {
        var new_min_max = get_min_max(data, t);
        zdims.zmin = new_min_max.min;
        zdims.zmax = new_min_max.max;
      } else {
        zdims.zmin = dims.zmin;
        zdims.zmax = dims.zmax;
      }
      var plotdata = make_plotdata(data, dims, zdims, t, tinv);

      var limits = fixAspect(aspect_ratio, dims.xmin, dims.xmax, dims.ymin, dims.ymax, width, height);
      // Update the x-scale.
      x
        .domain([limits.xmin, limits.xmax])
        .range([0, width]);
        
      // Update the y-scale.
      y
        .domain([limits.ymin, limits.ymax])
        .range([height, 0]);
      
      xAxisGrid
        .scale(x)
        .orient("bottom")
        .ticks(numberOfTicks)
        .tickPadding(10)
        .tickSize(-height, 0, 0)
        .tickFormat("");
        
      yAxisGrid
        .scale(y)
        .ticks(numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("left")
        .tickSize(-width, 0, 0)
        .tickFormat("")
      
      xAxis
        .scale(x)
        .ticks(numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("bottom");
      
      yAxis
        .scale(y)
        .ticks(numberOfTicks)
        .tickPadding(10)	
        .tickSubdivide(true)	
        .orient("left");
        
        
      // we will bind data to the container div, a slightly non-standard
      // arrangement.
      var container = d3.select(this).selectAll("div.heatmap-container").data([plotdata]);
      
      zoom.x(x).y(y);
      chart.resetzoom = resetzoom;
      chart.zoom = zoom;
      
      // if inner container doesn't exist, build it.
      container.enter().append("div")
        .attr("class", "heatmap-container")
        .attr("width", innerwidth)
        .attr("height", innerheight)
        .style("display", "inline-block")
        .style("width", innerwidth + "px")
        .style("height", innerheight + "px");
        
      var mainCanvas = container.selectAll("canvas.mainplot").data([plotdata]);
      mainCanvas.enter().append("canvas");
      mainCanvas
          .attr("width", width)
          .attr("height", height)
          .attr("class", "mainplot")
          .style("width", width + "px")
          .style("height", height + "px")
          .style("padding-left", margin.left + "px")
          .style("padding-right", margin.right + "px")
          .call(drawImage, plotdata);      
      
      var svg = container.selectAll("svg.mainplot").data([plotdata]);
      var esvg = svg.enter()
        .append("svg")
          .attr("class", "mainplot");
      esvg.append("g")
          .attr("class", "x axis");
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
      svg.call(zoom)
        .on("dblclick.zoom", null)
        .on("dblclick.resetzoom", resetzoom);
      
      svg.attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);
                
      svg.selectAll("g.x")
        .attr("transform", "translate(" + margin.left + "," + height + ")");
      svg.selectAll("g.y")
        .attr("transform", "translate(" + margin.left + ",0)");
    });
  }

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
    return chart;
  };
  
  // cache the colormap:
  chart.colormap(colormap);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.show_grid = function(_) {
    if (!arguments.length) return show_grid;
    show_grid = _;
    chart.outercontainer.selectAll(".grid").style(
      "display", (show_grid == true || show_grid == "true") ? "inline" : "none"
    );
    return chart;
  };
  
  chart.transform = function(_) {
    if (!arguments.length) return transform;
    transform = _;
    t = transforms[transform];
    tinv = inverse_transforms[transform];
    _redraw_backing = true;
    return chart;
  };
  
  chart.aspect_ratio = function(_) {
    if (!arguments.length) return aspect_ratio;
    aspect_ratio = _;
    return chart;
  };
  
  chart.dims = function(_) {
    if (!arguments.length) return dims;
    dims = _;
    return chart;
  };
  
  chart.autoscale = function(_) {
    if (!arguments.length) return autoscale;
    autoscale = _;
    return chart;
  };
  
  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
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
  
  chart.interactors = function(_) {
    if (!arguments.length) return interactors;
    chart.svg.select("g.mainview").call(_);
    _.x(x).y(y).update();
    interactors.push(_);
  };

  var get_sxdx = function(){
    var delta_x = (dims.xmax - dims.xmin)/(dims.xdim),
        delta_y = (dims.ymax - dims.ymin)/(dims.ydim);
    
    graph_xmax = Math.max.apply(Math, x.domain());
    graph_xmin = Math.min.apply(Math, x.domain());
    graph_ymax = Math.max.apply(Math, y.domain());
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
  
  var fixAspect = function(aspect_ratio, xmin, xmax, ymin, ymax, width, height) {
    if (aspect_ratio == null) {
      return {'xmin': xmin, 'xmax': xmax, 'ymin': ymin, 'ymax': ymax}
    }
    var yrange = (ymax - ymin);
    var ycenter = (ymax + ymin) / 2.0;
    var xrange = (xmax - xmin);
    var xcenter = (xmax + xmin) / 2.0;
    var graph_ratio = width / height;
    var ratio = yrange/xrange * graph_ratio;
    //console.log('ratios:', ratio, aspect_ratio);
    if (isNaN(ratio) || ratio == aspect_ratio) { return };
    if (ratio < aspect_ratio) { // y-range is too small
        yrange = aspect_ratio * xrange / graph_ratio;
    }
    if (ratio > aspect_ratio) {
        xrange = yrange / aspect_ratio * graph_ratio;
    }
            
    //console.log('ranges:', yrange, xrange);
    output = {
        'xmin': xcenter - xrange/2.0, 
        'xmax': xcenter + xrange/2.0,
        'ymin': ycenter - yrange/2.0, 
        'ymax': ycenter + yrange/2.0
    }
    return output;
  };
  
  // Compute the pixel colors; scaled by CSS.
  function drawImage(canvas, plotdata) {
    var maxColorIndex = 255,
      overflowIndex = 256,
      context = canvas.node().getContext("2d"),
      ctx = backing_canvas.getContext("2d");
        
    if (_redraw_backing) {
      _redraw_backing = false;        
      backing_canvas.width = dims.xdim;
      backing_canvas.height = dims.ydim;
      var image = ctx.createImageData(dims.xdim, dims.ydim);
      var data = image.data;
      var yp;
      for (var yt = 0, p = -1; yt < dims.ydim; ++yt) {
        yp = dims.ydim - 1 - yt; // y-axis starts at the top!
        for (var xp = 0; xp < dims.xdim; ++xp) {
          var c = _colormap_array[plotdata[yp][xp]];
          /*
          data[++p] = c[0];
          data[++p] = c[1];
          data[++p] = c[2];
          data[++p] = c[3];
          */
          data[++p] = c.r;
          data[++p] = c.g;
          data[++p] = c.b;
          data[++p] = c.a;
        }
      }
      ctx.putImageData(image, 0, 0);
    }
    
	//context.mozImageSmoothingEnabled = false;
	//context.webkitImageSmoothingEnabled = false;
	//context.msImageSmoothingEnabled = false;
	//context.imageSmoothingEnabled = false;
	var x0=x(dims.xmin),
	    y0=y(dims.ymin),
	    x1=x(dims.xmax),
	    y1=y(dims.ymax);
	   
    context.clearRect(0,0, context.canvas.width, context.canvas.height);
    if (context.mozImageSmoothingEnabled) context.mozImageSmoothingEnabled = false;
    if (context.imageSmoothingEnabled) context.imageSmoothingEnabled = false;
    var sxdx = get_sxdx();
    context.drawImage(ctx.canvas, sxdx.sx, sxdx.sy, sxdx.sw, sxdx.sh, sxdx.dx, sxdx.dy, sxdx.dw, sxdx.dh);
  }
  
  // call after setting transform
  var make_plotdata = function(source_data, dims, clim, t, tinv) {
    // source_data is 2d array
    // dims is object with dim, max and min for x,y,z
    // t is transform (is function(x) {return x} for linear)
    // tinv is inverse transform (is function(x) {return x} for linear)
    var maxColorIndex = 255;
    var overflowIndex = 256;
    var width = dims.xdim;
    var height = dims.ydim;
    var tzmax = t(clim.zmax);
    var tzmin = t(clim.zmin);
    //var tzmax = get_maximum(this.source_data, this.t);
    //var tzmin = get_minimum(this.source_data, this.t);
    //if (isNaN(tzmin)) tzmin = 0;
    
    //if (!(isFinite(tzmin))) {
    //  tzmin = get_minimum(source_data, t);
    //  clim.zmin = tinv(tzmin);
    //}
    var data = source_data; 
    var plotdata = [], rowdata;
    
    // plotdata is stored in row-major order ("C"), where row is "y"
    var z, r, c, plotz;
    for (r = 0; r < height; r++) {
      plotdata[r] = [];
      for (c = 0; c < width; c++) {
        z = data[r][c];
        plotz = Math.floor(((t(z) - tzmin) / (tzmax - tzmin)) * maxColorIndex);
        
        if (isNaN(plotz) || (z == null)) { plotz = overflowIndex }
        else if (plotz > maxColorIndex) { plotz = maxColorIndex }
        else if (plotz < 0) { plotz = 0 }
        plotdata[r][c]=plotz;
      }
      //plotdata[r] = rowdata.slice();
    }
    _redraw_backing = true;
    return plotdata
  };
  
  
  function get_min_max(array, transform, existing_min, existing_max) {
    var new_min_max = {min: existing_min, max: existing_max};
    for (var i=0; i<array.length; i++) {
      var subarr = array[i];
      if (subarr == null) { return {min: existing_min, max: existing_max} }
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
      //console.log(i, existing_min);
    }
    return {min: existing_min, max: existing_max}
  };
  
  function get_minimum(array, transform, existing_min) {
        var new_min;
        for (var i in array) {
            var subarr = array[i];
            if (subarr == null) { return existing_min }
            if (subarr.length == undefined) {
                var t_el = transform(subarr);
                if (isFinite(t_el)) new_min = t_el;
            } else {
                new_min = get_minimum(subarr, transform, existing_min);
            }
            if (existing_min == undefined || new_min < existing_min) {
                var existing_min = new_min;
            }
        }
        return existing_min
    };
    
  var jet_array = [
    [0, 0, 127, 255], [0, 0, 132, 255], [0, 0, 136, 255], [0, 0, 141, 255], 
    [0, 0, 145, 255], [0, 0, 150, 255], [0, 0, 154, 255], [0, 0, 159, 255], 
    [0, 0, 163, 255], [0, 0, 168, 255], [0, 0, 172, 255], [0, 0, 177, 255], 
    [0, 0, 181, 255], [0, 0, 186, 255], [0, 0, 190, 255], [0, 0, 195, 255], 
    [0, 0, 199, 255], [0, 0, 204, 255], [0, 0, 208, 255], [0, 0, 213, 255], 
    [0, 0, 218, 255], [0, 0, 222, 255], [0, 0, 227, 255], [0, 0, 231, 255], 
    [0, 0, 236, 255], [0, 0, 240, 255], [0, 0, 245, 255], [0, 0, 249, 255], 
    [0, 0, 254, 255], [0, 0, 255, 255], [0, 0, 255, 255], [0, 0, 255, 255], 
    [0, 0, 255, 255], [0, 3, 255, 255], [0, 7, 255, 255], [0, 11, 255, 255], 
    [0, 15, 255, 255], [0, 19, 255, 255], [0, 23, 255, 255], [0, 27, 255, 255], 
    [0, 31, 255, 255], [0, 35, 255, 255], [0, 39, 255, 255], [0, 43, 255, 255], 
    [0, 47, 255, 255], [0, 51, 255, 255], [0, 55, 255, 255], [0, 59, 255, 255],
    [0, 63, 255, 255], [0, 67, 255, 255], [0, 71, 255, 255], [0, 75, 255, 255], 
    [0, 79, 255, 255], [0, 83, 255, 255], [0, 87, 255, 255], [0, 91, 255, 255], 
    [0, 95, 255, 255], [0, 99, 255, 255], [0, 103, 255, 255], [0, 107, 255, 255], 
    [0, 111, 255, 255], [0, 115, 255, 255], [0, 119, 255, 255], [0, 123, 255, 255], 
    [0, 127, 255, 255], [0, 131, 255, 255], [0, 135, 255, 255], [0, 139, 255, 255], 
    [0, 143, 255, 255], [0, 147, 255, 255], [0, 151, 255, 255], [0, 155, 255, 255], 
    [0, 159, 255, 255], [0, 163, 255, 255], [0, 167, 255, 255], [0, 171, 255, 255], 
    [0, 175, 255, 255], [0, 179, 255, 255], [0, 183, 255, 255], [0, 187, 255, 255], 
    [0, 191, 255, 255], [0, 195, 255, 255], [0, 199, 255, 255], [0, 203, 255, 255], 
    [0, 207, 255, 255], [0, 211, 255, 255], [0, 215, 255, 255], [0, 219, 255, 255], 
    [0, 223, 251, 255], [0, 227, 248, 255], [1, 231, 245, 255], [4, 235, 242, 255], 
    [7, 239, 239, 255], [10, 243, 235, 255], [14, 247, 232, 255], [17, 251, 229, 255], 
    [20, 255, 226, 255], [23, 255, 222, 255], [26, 255, 219, 255], [30, 255, 216, 255], 
    [33, 255, 213, 255], [36, 255, 210, 255], [39, 255, 206, 255], [43, 255, 203, 255], 
    [46, 255, 200, 255], [49, 255, 197, 255], [52, 255, 194, 255], [55, 255, 190, 255], 
    [59, 255, 187, 255], [62, 255, 184, 255], [65, 255, 181, 255], [68, 255, 178, 255], 
    [71, 255, 174, 255], [75, 255, 171, 255], [78, 255, 168, 255], [81, 255, 165, 255], 
    [84, 255, 161, 255], [88, 255, 158, 255], [91, 255, 155, 255], [94, 255, 152, 255], 
    [97, 255, 149, 255], [100, 255, 145, 255], [104, 255, 142, 255], [107, 255, 139, 255], 
    [110, 255, 136, 255], [113, 255, 133, 255], [116, 255, 129, 255], [120, 255, 126, 255], 
    [123, 255, 123, 255], [126, 255, 120, 255], [129, 255, 116, 255], [133, 255, 113, 255], 
    [136, 255, 110, 255], [139, 255, 107, 255], [142, 255, 104, 255], [145, 255, 100, 255], 
    [149, 255, 97, 255], [152, 255, 94, 255], [155, 255, 91, 255], [158, 255, 88, 255], 
    [161, 255, 84, 255], [165, 255, 81, 255], [168, 255, 78, 255], [171, 255, 75, 255], 
    [174, 255, 71, 255], [178, 255, 68, 255], [181, 255, 65, 255], [184, 255, 62, 255], 
    [187, 255, 59, 255], [190, 255, 55, 255], [194, 255, 52, 255], [197, 255, 49, 255], 
    [200, 255, 46, 255], [203, 255, 43, 255], [206, 255, 39, 255], [210, 255, 36, 255], 
    [213, 255, 33, 255], [216, 255, 30, 255], [219, 255, 26, 255], [222, 255, 23, 255], 
    [226, 255, 20, 255], [229, 255, 17, 255], [232, 255, 14, 255], [235, 255, 10, 255], 
    [239, 254, 7, 255], [242, 250, 4, 255], [245, 247, 1, 255], [248, 243, 0, 255], 
    [251, 239, 0, 255], [255, 235, 0, 255], [255, 232, 0, 255], [255, 228, 0, 255], 
    [255, 224, 0, 255], [255, 221, 0, 255], [255, 217, 0, 255], [255, 213, 0, 255], 
    [255, 210, 0, 255], [255, 206, 0, 255], [255, 202, 0, 255], [255, 199, 0, 255], 
    [255, 195, 0, 255], [255, 191, 0, 255], [255, 188, 0, 255], [255, 184, 0, 255], 
    [255, 180, 0, 255], [255, 176, 0, 255], [255, 173, 0, 255], [255, 169, 0, 255], 
    [255, 165, 0, 255], [255, 162, 0, 255], [255, 158, 0, 255], [255, 154, 0, 255], 
    [255, 151, 0, 255], [255, 147, 0, 255], [255, 143, 0, 255], [255, 140, 0, 255], 
    [255, 136, 0, 255], [255, 132, 0, 255], [255, 128, 0, 255], [255, 125, 0, 255], 
    [255, 121, 0, 255], [255, 117, 0, 255], [255, 114, 0, 255], [255, 110, 0, 255], 
    [255, 106, 0, 255], [255, 103, 0, 255], [255, 99, 0, 255], [255, 95, 0, 255], 
    [255, 92, 0, 255], [255, 88, 0, 255], [255, 84, 0, 255], [255, 81, 0, 255], 
    [255, 77, 0, 255], [255, 73, 0, 255], [255, 69, 0, 255], [255, 66, 0, 255], 
    [255, 62, 0, 255], [255, 58, 0, 255], [255, 55, 0, 255], [255, 51, 0, 255], 
    [255, 47, 0, 255], [255, 44, 0, 255], [255, 40, 0, 255], [255, 36, 0, 255], 
    [255, 33, 0, 255], [255, 29, 0, 255], [255, 25, 0, 255], [255, 21, 0, 255], 
    [254, 18, 0, 255], [249, 14, 0, 255], [245, 10, 0, 255], [240, 7, 0, 255], 
    [236, 3, 0, 255], [231, 0, 0, 255], [227, 0, 0, 255], [222, 0, 0, 255], 
    [218, 0, 0, 255], [213, 0, 0, 255], [208, 0, 0, 255], [204, 0, 0, 255], 
    [199, 0, 0, 255], [195, 0, 0, 255], [190, 0, 0, 255], [186, 0, 0, 255], 
    [181, 0, 0, 255], [177, 0, 0, 255], [172, 0, 0, 255], [168, 0, 0, 255], 
    [163, 0, 0, 255], [159, 0, 0, 255], [154, 0, 0, 255], [150, 0, 0, 255], 
    [145, 0, 0, 255], [141, 0, 0, 255], [136, 0, 0, 255], [132, 0, 0, 255]
  ];
  
  return chart
  
}
