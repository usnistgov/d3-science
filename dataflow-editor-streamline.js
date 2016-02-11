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
//   wires: [{source: "0:out_b", target: "1:in_0"}],
// }];
// 

/* requires('d3.js'); */

if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

dataflow = (typeof dataflow == 'undefined') ? {} : dataflow;
dataflow.editor = function(data) {
  var data = data || [];
  var svg, container;
  var dispatch = d3.dispatch("update", "draw_wires");
  dispatch.on("update", update);
  dispatch.on("draw_wires", draw_wires);
  
  var wire_keyfn = function(d) {return "{source: " + d.source + "," + "target: " + d.target + "}"};
  var check_end = function(e) {
    if (e == 'cursor') { return true }
    else {
        var es = e.split(":");
        if (es.length != 2) { return false }
        var module_index = es[0],
            terminal_id = es[1];
        return (container.select('.module[index="' + module_index + '"] .terminal[terminal_id="' + terminal_id + '"]').empty() == false)
    }
  }
  /*
  var wire_checkends = function(w) {
    var src_exists, tgt_exists;
    src_exists = (w.source == 'cursor' || !(svg.select('[id=\"' + w.source + '\"]').empty()) );
    tgt_exists = (w.target == 'cursor' || !(svg.select('[id=\"' + w.target + '\"]').empty()) );
    return (src_exists && tgt_exists)
  }
  */
  
  var wire_checkends = function(w) {
    return (check_end(w.source) && check_end(w.target))
  }
  
  function rewire(index_updates) {
    var wires = svg.datum().wires;
    var end_names = ['source', 'target'];
    wires.forEach(function(w) {
      end_names.forEach(function(e) {
        var end = w[e];
        if (end != 'cursor' && end.split(":").length == 2) {
          var index_in = end.split(":")[0];
          var terminal_id = end.split(":")[1];
          if (index_in in index_updates) {
            //console.log('rewiring ' + end + ' ' + index_in + ' to ' + index_updates[index_in]);
            w[e] = index_updates[index_in] + ":" + terminal_id;
          }
        }
      });
    });
  }

  function update() {
    var id_to_index = {},
        index_to_id = {},
        index_updates = {},
        additions = [],
        removals = [];
    svg.selectAll(".module").each(function(d,i) { index_to_id[d3.select(this).attr("index")] = d.module_id});
    var module_update = svg.selectAll(".module").data(function(d) {return d.modules}, function(d) { return d.module_id; })
    module_update.enter().append(dataflow.module).each(function(d) {additions.push(d.module_id)});
    module_update.exit().each(function(d) {removals.push(d.module_id)}).remove();
    module_update.attr("index", function(d,i) {return i});
    svg.selectAll(".module").each(function(d,i) { id_to_index[d.module_id] = d3.select(this).attr("index")});
    for (var index in index_to_id) {
      var outdex = id_to_index[index_to_id[index]];
      if (outdex != index) { 
        index_updates[index] = outdex;
      }
    }
    // for the moment, will only deal with deletions... in principle any just-added
    // modules won't have any wires pointing to them yet.  
    rewire(index_updates);
    
    // remove wires without existing endpoints;
    svg.datum().wires = svg.datum().wires.filter(wire_checkends);

    var wire_update = svg.selectAll(".wire").data(function(d) {return d.wires}, wire_keyfn);
    wire_update.enter().append(dataflow.wire);
    wire_update.exit().remove();
    
    draw_wires();
  }
  
  function draw_wires() {
    svg.selectAll(".wire").each(draw_wire) 
  }
  
  function get_terminal_pos(term_id) {
    var module = container.select('.module[index="' + term_id.split(":")[0] + '"]');
    var terminal = container.select('.module[index="' + term_id.split(":")[0] + '"]')
        .select('.terminal[terminal_id="' + term_id.split(":")[1] + '"]');
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
    var src = connector.datum().source,
        tgt = connector.datum().target;
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
          if (w.source == src && w.target == tgt) {
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
    container = selection; // store for later use
    svg = selection.selectAll("svg.editor").data(data)
      .enter().append("svg")
      .classed("editor", true)
      
    svg.selectAll(".module")
      .data(function(d) { return d.modules }) 
      .enter().append(dataflow.module)
      .attr("index", function(d,i) {return i});
      
    svg.selectAll(".wire")
      .data(function(d) {return d.wires})
      .enter().append(dataflow.wire)
    
    // bind the update function directly to the svg so children can use.
    // running these through the dispatcher, not sure if that is needed...
    Object.defineProperty(svg.node(), 'update', {value: dispatch.update});
    Object.defineProperty(svg.node(), 'draw_wires', {value: dispatch.draw_wires});
      
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
  editor.draw_wires = draw_wires;
  
  return editor;
}

dataflow.module = function(module_data) {
  var parentNode = this; // calling context
  var group; // this will be the module group.
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
    .origin(function(a) { return {x: module_data.x, y: module_data.y} });
    
  function dragmove() {
    if (!d3.select(this).classed("draggable")) {return}
    module_data.x = d3.event.x;
    module_data.y = d3.event.y;
    group.attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")");
    parentNode.draw_wires();
  }
  
  var wireaction = d3.behavior.drag()
    .on("dragstart.wire", wirestart)
    .on("drag.wire", wirepull)
    .on("dragend.wire", wirestop)
  
  function wirestart() {
    if (!d3.select(this.parentNode.parentNode).classed("wireable")) {return}
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("highlight", true);
    var terminal_id = d3.select(this).attr("terminal_id");
    var module_index = group.attr("index");
    var address = module_index + ":" + terminal_id;
    new_wiredata = {source: null, target: null}
    var dest_selector = (this.classList.contains("input")) ? ".wireable .output" : ".wireable .input";
    d3.select(parentNode).selectAll(dest_selector)
      .on("mouseenter", function() {d3.select(this).classed("highlight", true)})
      .on("mouseleave", function() {d3.select(this).classed("highlight", false)})
    if (this.classList.contains("input")) {
      new_wiredata.target = address;
      new_wiredata.source = "cursor";        
    } else {
      new_wiredata.source = address;
      new_wiredata.target = "cursor";
    }
    active_wire = true;
    d3.select(parentNode).datum().wires.push(new_wiredata);
    parentNode.update();
  }
  
  function wirestop() {
    d3.select(this).classed("highlight", false);
    var active_data = new_wiredata; // d3.select(active_wire).datum();
    if (this.classList.contains("input")) {
      var new_src = d3.select(".output.highlight");
      if (!new_src.empty()) {
        var module_index = d3.select(new_src.node().parentNode.parentNode).attr("index");
        active_data.source = module_index + ":" + new_src.attr("terminal_id");
      }
    } 
    else if (this.classList.contains("output")) {
      var new_tgt = d3.select(".input.highlight");
      if (!new_tgt.empty()) {
        var module_index = d3.select(new_tgt.node().parentNode.parentNode).attr("index");
        active_data.target = module_index + ":" + new_tgt.attr("terminal_id");
      }
    }
    if (active_data.target == 'cursor' || active_data.source == 'cursor') {
        active_wire = false;
    }
    var matches = d3.select(parentNode).datum().wires.filter(function(d) {
        return (d.target == active_data.target && d.source == active_data.source)
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
    parentNode.draw_wires();
  }
  
  // create and append module HTML element:
  group = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"))
    .datum(module_data)
    .classed("module draggable wireable", true)
    .style("cursor", "move")
    .attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")")
    .attr("x-origin", module_data.x.toFixed())
    .attr("y-origin", module_data.y.toFixed())
    .attr("module_id", id)
    
    // this is a bit of a hack: creating a not-so-visible read-only property of 
    // the data object referring to the unique module_id, so that d3 data join will be 
    // able to relink data and selections;
    Object.defineProperty(module_data, "module_id", {get: function() {return id;}});
    
    /*
    // breaking the rules: putting information into the data.
    // once we can in a stable way use list index of modules for addressing we 
    // can stop doing this...
    module_data.module_id = id;
    */
    
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
      .enter().append("g")
        .attr("transform", function(d,i) { return "translate(-20," + (height * i).toFixed() + ")"})
    
    inputs
        .append("text")
          .classed("input label", true)
          .style("dominant-baseline", "text-before-edge")
          .attr("x", padding)
          .attr("y", padding)
          .style("padding", padding)
          .text(function(d) { return d; });
    
    inputs.append("rect")
        .classed("terminal input", true)
        .style("cursor", "crosshair")
        .style("fill", "#00FF00")
        .style("fill-opacity", 0.25)
        .style("stroke-width", "2px")
        .style("stroke", "#0000ff")
        .attr("width", 20)
        .attr("height", height)
        .attr("wireoffset_x", 0)
        .attr("wireoffset_y", height/2)
        .attr("terminal_id", function(d) {return d})
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d; });
          
    inputs.append("polygon")
        .classed("terminal input state", true)
        .style("fill", "#444444")
        .style("fill-opacity", 0.5)
        .style("display", "none")
        .attr("points", "0,0 20," + (height/2).toFixed() + " 0," + height.toFixed())    
    
  
    var outputs = group.selectAll(".output")
      .data(function(d) { return d.outputs })
      .enter().append("g")
        .attr("transform", function(d,i) { return "translate(" + width.toFixed() + "," + (height * i).toFixed() + ")"})
      
    outputs
        .append("text")
          .classed("output label", true)
          .style("dominant-baseline", "text-before-edge")
          .attr("x", padding)
          .attr("y", padding)
          .style("padding", padding)
          .text(function(d) { return d; });
          
    outputs.append("rect")
        .classed("terminal output", true)
        .style("cursor", "crosshair")
        .style("fill", "#00FFFF")
        .style("fill-opacity", 0.25)
        .style("stroke-width", "2px")
        .style("stroke", "#0000ff")
        .attr("width", 20)
        .attr("height", height)
        .attr("wireoffset_x", 20)
        .attr("wireoffset_y", height/2)        
        .attr("terminal_id", function(d) {return d})
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d; });
    
    outputs.append("polygon")
        .classed("terminal input state", true)
        .style("fill", "#444444")
        .style("fill-opacity", 0.5)
        .style("display", "none")
        .attr("points", "0,0 20," + (height/2).toFixed() + " 0," + height.toFixed())    
    
    group.call(drag);
    return group.node();  
}

dataflow.wire = function(wire_data) {
  var parent = this; // calling context;
  var connector = document.createElementNS("http://www.w3.org/2000/svg", "path");
  d3.select(connector)
    .classed("wire", true)
    .style("cursor", "crosshair")
    .style("fill", "none")
    .style("stroke-width", "2.5px")
    .style("stroke", "red")
  return connector;
}
