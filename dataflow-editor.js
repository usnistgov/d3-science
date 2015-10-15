if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

dataflow = (typeof dataflow == 'undefined') ? {} : dataflow;
dataflow.editor = function(data) {
  var data = data || [];
  var svg;
  var dispatch = d3.dispatch("update");
  dispatch.on("update", function() { d3.selectAll(".wire").each(draw_wire) })
  
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
    terminal_pos.y += +terminal.attr("height")/2.0;
    if (terminal.classed("output")) {
      terminal_pos.x += +terminal.attr("width");
    }
    return terminal_pos;
  }
  
  function draw_wire() {
    var connector = d3.select(this);
    var src_pos, tgt_pos;
    var src = connector.attr("src"),
        tgt = connector.attr("tgt")
    if (src == "cursor" || tgt == "cursor") {
      var mouse = d3.mouse(svg.node());
      cursor_pos = {x: mouse[0], y: mouse[1]}
    }
    if (src == "cursor") {
      src_pos = cursor_pos;
    } else {
      src_pos = get_terminal_pos(src);
    }
    
    if (tgt == "cursor") {
      tgt_pos = cursor_pos;
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
  
  function module_fit() {
    var m = d3.select(this);
    console.log(m);
    var titlebox = m.select(".titlebox");
    var bbox = titlebox.node().getBBox();
    var width = Math.max(min_width, bbox.width) + (padding * 2);
    var height = bbox.height + padding * 2;
    module.select(".title.border")
      .attr("width", width)
      .attr("height", height)
  } 
  
  
  function editor(selection) {
    svg = selection.selectAll("svg.editor").data(data)
      .enter().append("svg")
      .classed("editor", true)
      
    svg.selectAll(".module.base")
      .data(function(d) { return d.modules })
      .enter().append(dataflow.module)
      
    svg.selectAll(".module.base").each(module_fit);
      
    svg.selectAll(".wire")
      .data(function(d) {return d.wires})
      .enter().append(dataflow.wire)
    
    // bind the update function directly to the svg so children can use.
    Object.defineProperty(svg.node(), 'update', {value: dispatch.update});
      
    dispatch.update();
  }
  
  editor.data = function(_) {
    if (!arguments.length) { return data }
    data = _;
    return editor;
  }
  
  editor.svg = function() {
    return svg;
  }
  
  return editor;
}

dataflow.module = function(module_data) {
  var parentNode = this; // calling context
  if (!('x' in module_data)) module_data.x = 100;
  if (!('y' in module_data)) module_data.y = 100;
  if (!('inputs' in module_data)) module_data.inputs = ['in_0'];
  if (!('outputs' in module_data)) module_data.outputs = ['out_0'];
  
  var id = d3.id();
  var padding = 5;
  var min_width = 75;
  var active_wire;
  var drag = d3.behavior.drag()
    .on("drag", dragmove)
    .origin(function() { return options });
    
  var wireaction = d3.behavior.drag()
    .on("dragstart.wire", wirestart)
    .on("drag.wire", wirepull)
    .on("dragend.wire", wirestop)
    
  function dragmove() {
    module_data.x = d3.event.x;
    module_data.y = d3.event.y;
    group.attr("transform", "translate(" + module_data.x + "," + module_data.y.toFixed() + ")");
    parent.update();
  }
  
  
  function wirestart() {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("highlight", true);
    var terminal_id = d3.select(this).attr("id");
    var new_wiredata = {}
    var dest_selector = (this.classList.contains("input")) ? ".output" : ".input";
    d3.select(parentNode).selectAll(dest_selector)
      .on("mouseenter", function() {d3.select(this).classed("highlight", true)})
      .on("mouseleave", function(e) {d3.select(this).classed("highlight", false)})
    if (this.classList.contains("input")) {
      new_wiredata.tgt = terminal_id;
      new_wiredata.src = "cursor";        
    } else {
      new_wiredata.src = terminal_id;
      new_wiredata.tgt = "cursor";
    }
    active_wire = dataflow.wire(new_wiredata);
    // append does this automatically, so we can do it ourselves?
    d3.select(parentNode).datum().wires.push(active_wire);
    d3.select(parentNode).append(function() {return active_wire}).datum(new_wiredata);
  }
  
  function wirestop() {
    d3.select(this).classed("highlight", false);
    if (this.classList.contains("input")) {
      var new_src = d3.select(".output.highlight");
      if (new_src.empty()) {
        active_wire.remove();
      } else {
        d3.select(active_wire).datum().src = new_src.attr("id");
      }
    } 
    else if (this.classList.contains("output")) {
      var new_tgt = d3.select(".input.highlight");
      if (new_tgt.empty()) {
        active_wire.remove();
      } else {
        d3.select(active_wire).datum().tgt = new_tgt.attr("id");
      }
    }
    parentNode.update();
    d3.select(parentNode).selectAll(".terminal")
      .classed("highlight", false)
      .on("mouseenter", null)
      .on("mouseleave", null)
    console.log(active_wire);
    active_wire = null;
  }
  
  function wirepull() {
    d3.event.sourceEvent.stopPropagation();
    //if (active_wire) {
    //  active_wire.draw();
    //}
  }
  
  // create and append module HTML element:
  var group = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"))
    .datum(module_data)
    .classed("module base", true)
    .style("cursor", "move")
    .attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")")
    .attr("x-origin", module_data.x.toFixed())
    .attr("y-origin", module_data.y.toFixed())
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
      .data(function(d) { return d.title.split("\n") })
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
      .data(function(d) { return d.inputs })
      .enter().append("rect")
        .classed("terminal input", true)
        .style("cursor", "crosshair")
        .style("fill", "#00FF00")
        .style("fill-opacity", 0.25)
        .style("stroke-width", "2px")
        .style("stroke", "#0000ff")
        .attr("width", width/2)
        .attr("height", 20)
        .attr("transform", function(d,i) { return "translate(0," + (height + i*20).toFixed() + ")"})
        .attr("id", function(d) { return id.toFixed() + ":" + d; })
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d; });
  
    var outputs = group.selectAll(".output")
      .data(function(d) { return d.outputs })
      .enter().append("rect")
        .classed("terminal output", true)
        .style("cursor", "crosshair")
        .style("fill", "#00FFFF")
        .style("fill-opacity", 0.25)
        .style("stroke-width", "2px")
        .style("stroke", "#0000ff")
        .attr("width", width/2)
        .attr("height", 20)
        .attr("transform", function(d,i) { return "translate(" + (width/2).toFixed() + "," + (height + i*20).toFixed() + ")"})
        .attr("id", function(d) { return id.toFixed() + ":" + d; })
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d; });
    
    console.log(group, group.node(), parent);
    return group.node();  
}

dataflow.wire = function(wire_data) {
  var parent = this; // calling context;
  var connector = document.createElementNS("http://www.w3.org/2000/svg", "path");
  d3.select(connector)
    .classed("wire", true)
    .style("cursor", "crosshair")
    .attr("src", wire_data.src)
    .attr("tgt", wire_data.tgt)
    .style("fill", "none")
    .style("stroke-width", "2.5px")
    .style("stroke", "red")
    //.attr("d", makeBezier(src_terminal_pos, {x: 200, y: 200}))
  return connector;
}
