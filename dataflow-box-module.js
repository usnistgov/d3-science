if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

var dispatch = d3.dispatch("update");

var wires = [];

dispatch.on("update", function() { d3.selectAll(".wire").each(draw_wire) })

function draw_wire(connector) {
  // pass x and y to this - relative to the start point.
  var connector = d3.select(this);
  var src_pos, tgt_pos;
  var src = connector.attr("src"),
      tgt = connector.attr("tgt")
  if (src == "cursor") {
    src_pos = event;
  } else {
    src_pos = get_terminal_pos(src);
  }
  
  if (tgt == "cursor") {
    tgt_pos = event;
  } else {
    tgt_pos = get_terminal_pos(tgt);
  }
  if (tgt_pos == null || src_pos == null) { connector.remove() }
  else {
    connector.attr("d", makeConnector(src_pos, tgt_pos));
  }
}

function makeConnector(pt1, pt2) {
  var d = "M";
  var dx = Math.abs(+(pt1.x) - +(pt2.x)),
      dy = Math.abs(+(pt1.y) - +(pt2.y));
  d  = "M" + pt1.x + "," + pt1.y + " ";
  d += "C" + (+(pt1.x) + dx).toFixed() + "," + pt1.y + " ";
  d +=       (+(pt2.x) - dx).toFixed() + "," + pt2.y + " ";
  d +=       pt2.x + "," + pt2.y;
  return d;
}

function module(argopts) {
  var options = {
    title: "module",
    inputs: ["in_1"],
    outputs: ["out_1"],
    x: 100,
    y: 100,
    width: 'auto',
    height: 'auto',
  }
  jQuery.extend(true, options, argopts);
  
  drag = d3.behavior.drag()
    .on("drag", dragmove)
    .origin(function() { return options });
  
  wireaction = d3.behavior.drag()
    .on("dragstart.wire", wirestart)
    .on("drag.wire", wirepull)
    .on("dragend.wire", wirestop)
        
  var group, parent;
  var padding = 5;
  var min_width = 75;
  var id = d3.id();
  
  function box(selection) {
    parent = selection;
    group = selection.append("g")
      .classed("module base", true)
      .style("cursor", "move")
      .attr("transform", "translate(" + options.x.toFixed() + "," + options.y.toFixed() + ")")
      .attr("x-origin", options.x.toFixed())
      .attr("y-origin", options.y.toFixed())
      .attr("module_id", id)
    
    var title = group.append("g")
      .classed("module title", true)
      
    var titleborder = title.append("rect")
      .classed("module title border", true)
      .style("fill", "#ffffff")
      .style("stroke-width", "2px")
      .style("stroke", "#0000ff")
      
    var titlebox = title.append("text")
      .classed("module title textbox", true)
      //.attr("text-anchor", "middle")
    titlebox.selectAll(".sublines")
      .data(options.title.split("\n"))
      .enter().append("tspan")
        .classed("module title sublines", true)
        .attr("x", padding)
        .attr("dy", 20)
        .text(function(d) {return d});

    var bbox = titlebox.node().getBBox();
    var width = Math.max(min_width, bbox.width) + (padding * 2);
    var height = bbox.height + padding * 2;
    titleborder
      .attr("width", width)
      .attr("height", height)
      .attr("x", 0)
      .attr("y", 0)
      
    var inputs = group.selectAll(".input")
      .data(options.inputs)
      .enter().append("rect")
        .classed("terminal input", true)
        .style("cursor", "crosshair")
        .style("fill", "#00FF00")
        .style("fill-opacity", 0.25)
        .style("stroke-width", "2px")
        .style("stroke", "#0000ff")
        .attr("width", width/2)
        .attr("height", 20)
        //.attr("x", 0)
        //.attr("y", function(d,i) { return parseFloat(titleborder.attr("height")) + i*20 })
        .attr("transform", function(d,i) { return "translate(0," + (height + i*20).toFixed() + ")"})
        .attr("id", function(d) { return id.toFixed() + ":" + d; })
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d; });
  
    var outputs = group.selectAll(".output")
      .data(options.outputs)
      .enter().append("rect")
        .classed("terminal output", true)
        .style("cursor", "crosshair")
        .style("fill", "#00FFFF")
        .style("fill-opacity", 0.25)
        .style("stroke-width", "2px")
        .style("stroke", "#0000ff")
        .attr("width", width/2)
        .attr("height", 20)
        //.attr("x", width/2)
        //.attr("y", function(d,i) { return parseFloat(titleborder.attr("height")) + i*20 })
        .attr("transform", function(d,i) { return "translate(" + (width/2).toFixed() + "," + (height + i*20).toFixed() + ")"})
        .attr("id", function(d) { return id.toFixed() + ":" + d; })
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d; });
      
    group.call(drag);
  }
  
  box.id = function() { return id };
  
  function dragmove() {
    options.x = d3.event.x;
    options.y = d3.event.y;
    group.attr("transform", "translate(" + options.x + "," + options.y.toFixed() + ")");
    dispatch.update();
  }
  
  var active_wire;
  
  function wirestart() {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("highlight", true);
    var terminal_id = d3.select(this).attr("id");
    active_wire = new dataflow.wire();
    parent.call(active_wire);
    if (this.classList.contains("input")) {
      active_wire.tgt(terminal_id);
      active_wire.src("cursor");
      
      parent.selectAll(".output")
        .on("mouseenter", function() {d3.select(this).classed("highlight", true)})
        .on("mouseleave", function(e) {d3.select(this).classed("highlight", false)})
    } else {
      active_wire.src(terminal_id);
      active_wire.tgt("cursor");
      parent.selectAll(".input")
        .on("mouseenter", function() {d3.select(this).classed("highlight", true)})
        .on("mouseleave", function(e) {d3.select(this).classed("highlight", false)})
    }
    
  }
  
  function wirestop() {
    d3.select(this).classed("highlight", false);
    if (this.classList.contains("input")) {
      var new_src = d3.select(".output.highlight");
      if (new_src.empty()) {
        active_wire.remove();
      } else {
        active_wire.src(new_src.attr("id"))
      }
    } 
    else if (this.classList.contains("output")) {
      var new_tgt = d3.select(".input.highlight");
      if (new_tgt.empty()) {
        active_wire.remove();
      } else {
        active_wire.tgt(new_tgt.attr("id"));
      }
    }
    dispatch.update();
    parent.selectAll(".terminal")
      .classed("highlight", false)
      .on("mouseenter", null)
      .on("mouseleave", null)
    active_wire = null;
  }
  
  function wirepull() {
    d3.event.sourceEvent.stopPropagation();
    if (active_wire) {
      var ttranslate = d3.transform(d3.select(this).attr("transform")).translate,
          mtranslate = d3.transform(group.attr("transform")).translate;
      var cursor = {
        x: d3.event.x + mtranslate[0],
        y: d3.event.y + mtranslate[1] 
      }
      active_wire.draw();
    }
    wire_end = d3.event;
  }
  
  return box;
}

function get_terminal_pos(term_id) {
  var module = d3.select('[module_id="' + term_id.split(":")[0] + '"]');
  var terminal = d3.select('[id=\"' + term_id + '\"]');
  if (module.empty() || terminal.empty()) { return null }
  
  var terminal_tf = d3.transform(terminal.attr("transform")),
    module_tf = d3.transform(module.attr("transform")),
    terminal_pos = {x: terminal_tf.translate[0],
                    y: terminal_tf.translate[1]}
  terminal_pos.x += module_tf.translate[0];
  terminal_pos.y += module_tf.translate[1];
  //console.log(terminal_pos, terminal.node().getBBox());
  terminal_pos.y += +terminal.attr("height")/2.0;
  if (terminal.classed("output")) {
    terminal_pos.x += +terminal.attr("width");
  }
  return terminal_pos;
}

function wire(argopts) {
  var src = "";
  var tgt = "";
  var connector, parent;
  function path(selection) {
    parent = selection;
    connector = selection.append("path")
      .classed("wire", true)
      .style("cursor", "crosshair")
      .attr("src", src)
      .attr("tgt", tgt)
      .style("fill", "none")
      .style("stroke-width", "2.5px")
      .style("stroke", "red")
      //.attr("d", makeBezier(src_terminal_pos, {x: 200, y: 200}))
    connector.data([{src: src, tgt: tgt}])
    
  }
  
  path.draw = function() {
    var src_pos, tgt_pos;
    var mouse = d3.mouse(parent.node());
    // add tiny offset to x position of mouse, so that mouseover 
    // does not get confused by being over the wire (sometimes)
    var mouse_pos = {x: mouse[0] - 3, y: mouse[1]};
    if (src == "cursor") {
      src_pos = mouse_pos;
    } else {
      src_pos = get_terminal_pos(src);
      var src_terminal = d3.select('[id=\"' + src + '\"]');
      src_pos.x += +src_terminal.attr("width");
    }
    
    if (tgt == "cursor") {
      tgt_pos = mouse_pos;
    } else {
      tgt_pos = get_terminal_pos(tgt);
    }
    connector.attr("d", makeBezier(src_pos, tgt_pos));  
  }
  
  function get_src_xy() {
    var src_module = d3.select('[module_id="' + src.split(":")[0] + '"]');
    var src_terminal = d3.select('[id=\"' + src + '\"]');
    var src_terminal_tf = d3.transform(src_terminal.attr("transform")),
      src_module_tf = d3.transform(src_module.attr("transform")),
      src_terminal_pos = {x: src_terminal_tf.translate[0],
                      y: src_terminal_tf.translate[1]}
    src_terminal_pos.x += src_module_tf.translate[0];
    src_terminal_pos.y += src_module_tf.translate[1];
    src_terminal_pos.x += +src_terminal.attr("width");
    src_terminal_pos.y += +src_terminal.attr("height") / 2.0;
  }
  
  function get_terminal_pos(term_id) {
    var module = d3.select('[module_id="' + term_id.split(":")[0] + '"]');
    var terminal = d3.select('[id=\"' + term_id + '\"]');
    var terminal_tf = d3.transform(terminal.attr("transform")),
      module_tf = d3.transform(module.attr("transform")),
      terminal_pos = {x: terminal_tf.translate[0],
                      y: terminal_tf.translate[1]}
    terminal_pos.x += module_tf.translate[0];
    terminal_pos.y += module_tf.translate[1];
    terminal_pos.y += +terminal.attr("height")/2.0;
    return terminal_pos;
  }
  
  function makeBezier(pt1, pt2) {
    var d = "M";
    d  = "M" + pt1.x + "," + pt1.y + " ";
    d += "C" + pt2.x + "," + pt1.y + " ";
    d +=       pt1.x + "," + pt2.y + " ";
    d +=       pt2.x + "," + pt2.y;
    return d;
  }
  
  path.src = function(_) {
    if (!arguments.length) return src;
    src = _;
    if (connector && connector.attr) connector.attr("src", _);
    return path;
  }
  
  path.tgt = function(_) {
    if (!arguments.length) return tgt;
    tgt = _;
    if (connector && connector.attr) connector.attr("tgt", _);
    return path;
  }
  
  //dispatch.on("update", path.newdraw)
  
  path.remove = function() {
    connector.remove();
  }
  
  
  return path;
}

