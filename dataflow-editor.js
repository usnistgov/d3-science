// Editor for graph structures (based on d3)
//
// Developed by Brian Ben Maranville 
// at the National Institute of Standards and Technology,
// Gaithersburg, Maryland, USA
// This software is in the public domain and is not copyrighted
//
// can be initialized with data such as:
//
// data = [{
//   modules: [
//     {
//       title: "Load\ndata",
//       inputs: ["in_a"],
//       outputs: ["out_0", "out_b"],
//       x: 200
//     },
//     { 
//       title: "background",
//       x: 300
//     }
//   ],
//   wires: [{src: "0:out_b", tgt: "1:in_0"}],
// }];
// 

/* requires('d3.js'); */

if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

dataflow = (typeof dataflow == 'undefined') ? {} : dataflow;
dataflow.editor = function(data) {
  var data = data || [];
  var svg;
  var dispatch = d3.dispatch("update");
  dispatch.on("update", update);
  
  var wire_keyfn = function(d) {return "{src: " + d.src + "," + "tgt: " + d.tgt + "}"};
  var wire_checkends = function(w) {
    var src_exists = (w.src == 'cursor' || !(svg.select('[id=\"' + w.src + '\"]').empty()) );
    var tgt_exists = (w.tgt == 'cursor' || !(svg.select('[id=\"' + w.tgt + '\"]').empty()) );
    return (src_exists && tgt_exists)
  }
  
  function update() {
    var module_update = svg.selectAll(".module").data(function(d) {return d.modules}, function(d) { return d.module_id; })
    module_update.enter().append(dataflow.module);
    module_update.exit().remove()
    
    var module_ids = [];
    module_update.each(function(d,i) {module_ids[i] = d.module_id});
    
    // remove wires without existing endpoints;
    svg.datum().wires = svg.datum().wires.filter(wire_checkends);
    
    
    var wire_update = svg.selectAll(".wire").data(function(d) {return d.wires}, wire_keyfn);
    wire_update.enter().append(dataflow.wire);
    wire_update.exit().remove();
    
    d3.selectAll(".wire").each(draw_wire) 
  }
  
  function get_terminal_pos(term_id) {
    var module = d3.select('[module_id="' + term_id.split(":")[0] + '"]');
    var terminal = d3.select('[id=\"' + term_id + '\"]');
    if (module.empty() || terminal.empty()) { return null }
    var reference_point = svg.node().createSVGPoint();
    var terminal_origin = reference_point.matrixTransform(terminal.node().getCTM());
    var terminal_pos = {
      x: terminal_origin.x + +terminal.attr("wireoffset_x"),
      y: terminal_origin.y + +terminal.attr("wireoffset_y")
    }
    return terminal_pos;
  }
  
  function draw_wire() {
    var connector = d3.select(this);
    var src_pos, tgt_pos, cursor_pos;
    var src = connector.datum().src,
        tgt = connector.datum().tgt;
    if (src == "cursor" || tgt == "cursor") {
      var mouse = d3.mouse(svg.node());
      cursor_pos = {x: mouse[0] - 3, y: mouse[1] - 3}
      src_pos = tgt_pos = cursor_pos;
    }
    if (src != "cursor") {
      src_pos = get_terminal_pos(src);
    }    
    if (tgt != "cursor") {
      tgt_pos = get_terminal_pos(tgt);
    }
    if (tgt_pos == null || src_pos == null) {
      // remove wires pointing to missing terminals
      var wires = svg.datum().wires;
        for (var i=0; i<wires.length; i++) {
          var w = wires[i]; 
          if (w.src == src && w.tgt == tgt) {
            wires.pop(i);
            break;
          }
        };
        dispatch.update();
    }
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
  
  function editor(selection) {
    svg = selection.selectAll("svg.editor").data(data)
      .enter().append("svg")
      .classed("editor", true)
      
    svg.selectAll(".module")
      .data(function(d) { return d.modules }) 
      .enter().append(dataflow.module)
      
    svg.selectAll(".wire")
      .data(function(d) {return d.wires})
      .enter().append(dataflow.wire)
    
    console.log(JSON.stringify(data[0].wires));
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
  
  editor.update = update;
  
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
  var active_wire, new_wiredata;
  var drag = d3.behavior.drag()
    .on("drag", dragmove)
    .origin(function() { return module_data });
    
  var wireaction = d3.behavior.drag()
    .on("dragstart.wire", wirestart)
    .on("drag.wire", wirepull)
    .on("dragend.wire", wirestop)
    
  function dragmove() {
    module_data.x = d3.event.x;
    module_data.y = d3.event.y;
    group.attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")");
    parentNode.update();
  }
  
  
  function wirestart() {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("highlight", true);
    var terminal_id = d3.select(this).attr("id");
    new_wiredata = {}
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
    active_wire = true;
    d3.select(parentNode).datum().wires.push(new_wiredata);
  }
  
  function wirestop() {
    d3.select(this).classed("highlight", false);
    var active_data = new_wiredata; // d3.select(active_wire).datum();
    if (this.classList.contains("input")) {
      var new_src = d3.select(".output.highlight");
      if (!new_src.empty()) {
        active_data.src = new_src.attr("id");
      }
    } 
    else if (this.classList.contains("output")) {
      var new_tgt = d3.select(".input.highlight");
      if (!new_tgt.empty()) {
        active_data.tgt = new_tgt.attr("id");
      }
    }
    if (active_data.tgt == 'cursor' || active_data.src == 'cursor') {
        active_wire = false;
    }
    var matches = d3.select(parentNode).datum().wires.filter(function(d) {
        return (d.tgt == active_data.tgt && d.src == active_data.src)
    });
    // active wire should be the last added: check for existing
    // if not successful target or source match, or if duplicate: pop
    if (!active_wire || matches.length > 1) { d3.select(parentNode).datum().wires.pop() }
    parentNode.update();
    d3.select(parentNode).selectAll(".terminal")
      .classed("highlight", false)
      .on("mouseenter", null)
      .on("mouseleave", null)
    active_wire = false;
  }
  
  function wirepull() {
    d3.event.sourceEvent.stopPropagation();
    parentNode.update();
  }
  
  // create and append module HTML element:
  console.log('creating: ', id);
  var group = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"))
    .datum(module_data)
    .classed("module", true)
    .style("cursor", "move")
    .attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")")
    .attr("x-origin", module_data.x.toFixed())
    .attr("y-origin", module_data.y.toFixed())
    .attr("module_id", id)
    
    // this is a bit of a hack: creating a not-so-visible read-only property of 
    // the data object referring to the module_id, so that d3 data join will be 
    // able to relink data and selections;
    Object.defineProperty(module_data, "module_id", {get: function() {return id;}});
    
    var title = group.append("g")
      .classed("title", true)
    
    var width = 75 + (padding * 2);
    var height = 20 + padding * 2;
      
    var titleborder = title.append("rect")
      .classed("title border", true)
      .style("fill", "#ffffff")
      .style("stroke-width", "2px")
      .style("stroke", "#0000ff")
      .attr("width", width)
      .attr("height", height)
      .attr("x", 0)
      .attr("y", 0)
      
    var titlebox = title.append("text")
      .classed("title text", true)
      .text(function(d) {return d.title})
      .attr("x", padding)
      .attr("y", padding)
      .style("dominant-baseline", "text-before-edge")
      .style("height", height)
      .style("padding", padding)
      .style("width", width)
      
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
        .attr("wireoffset_x", 0)
        .attr("wireoffset_y", height/2)
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
        .attr("wireoffset_x", width/2)
        .attr("wireoffset_y", height/2)
        .attr("transform", function(d,i) { return "translate(" + (width/2).toFixed() + "," + (height + i*20).toFixed() + ")"})
        .attr("id", function(d) { return id.toFixed() + ":" + d; })
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d; });
    
    group.call(drag);
    return group.node();  
}

dataflow.wire = function(wire_data) {
  var parent = this; // calling context;
  var id = d3.id();
  var connector = document.createElementNS("http://www.w3.org/2000/svg", "path");
  d3.select(connector)
    .classed("wire", true)
    .style("cursor", "crosshair")
    .attr("wire_id", id)
    .style("fill", "none")
    .style("stroke-width", "2.5px")
    .style("stroke", "red")
  return connector;
}
