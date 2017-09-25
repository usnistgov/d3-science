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
//   wires: [{source: [0, "out_b"], target: [1, "in_0"]}],
// }];
// 

/* requires('d3.js'); */
'use strict';

import * as d3 from 'd3';
import {event as currentEvent} from 'd3';
import {extend} from './jquery-extend';

export {editor};
export default editor;

if (!d3.hasOwnProperty("id")) {
  d3.id = (function(){var a = 0; return function(){return a++}})();
}

function editor(options) {
  var module_defs = {};
  var default_options = {
    padding: 5,
    grid_spacing: 5,
    // wirecurve is usually between 0 and 1
    // if 0, gives a straight-line wire connector
    // if 1, a cubic curve vertical in the middle
    wirecurve: 0.67,
    min_width: 75,
    min_height: 20,
    autosize_modules: true
  }
  var options = extend(true, default_options, options);
  var svg, container;
  var wiredrag_cancelled = false;
  var exposed_wires = [];
  var dispatch = d3.dispatch("update", "drag_module", "draw_wires");
  
  var wire_keyfn = function(d) {return "{source: " + d.source + "," + "target: " + d.target + "}"};
  var check_end = function(e) {
    if (e == 'cursor') { return true }
    else {
        //var es = e.split(":"); // not making string pair around : anymore.
        if (e == null || e.length != 2) { return false }
        var module_index = e[0],
            terminal_id = e[1];
        if (module_index > -1) {
          return !(svg.select('.module[index="' + module_index + '"] .terminal[terminal_id="' + terminal_id + '"]').empty());
        }
        else {
          return !(svg.select('.exposed-terminals .terminal[terminal_id="' + terminal_id + '"]').empty());
        }
    }
  }
  
  var wire_checkends = function(w) {
    return (check_end(w.source) && check_end(w.target))
  }
  
  function rewire(index_updates, wires) {
    var end_names = ['source', 'target'];
    wires.forEach(function(w) {
      end_names.forEach(function(e) {
        var end = w[e];
        if (end != 'cursor' && end.length == 2) {
          var index_in = end[0];
          var terminal_id = end[1];
          if (index_in in index_updates) {
            //console.log('rewiring ' + end + ' ' + index_in + ' to ' + index_updates[index_in]);
            w[e] = [index_updates[index_in], terminal_id];
          }
        }
      });
    });
  }
  
  function reindex_exposed(index_updates) {
    var datum = svg.datum();
    var inputs = datum.inputs || [];
    var outputs = datum.outputs || [];
    var fields = datum.fields || [];
    function reindex(t) {
      var target = t.target;
      if (target && target != 'cursor' && target.length == 2) {
        var index_in = target[0];
        var terminal_id = target[1];
        if (index_in in index_updates) {
          var new_target = (index_updates[index_in] == undefined) ? null : [index_updates[index_in], terminal_id];
          t.target = new_target;
        }
      }
    }
    inputs.forEach(reindex);
    outputs.forEach(reindex);
    fields.forEach(reindex);
    // remove exposed fields when the target module goes away...
    for (var i = fields.length - 1; i >= 0; i--){
      // go through the array backwards to avoid renumbering problems
      if (fields[i].target == null) { fields.splice(i, 1); }
    }
  }
  
  function generate_exposed_wires() {
    // from list of exposed inputs and outputs, make list of wires.
    var ew = [];
    var inputs = svg.datum().inputs || [];
    var outputs = svg.datum().outputs || [];
    ew = ew.concat((inputs || []).map(function(t) {
      return { "source": [-1, t.id], "target": t.target }
    }));
    ew = ew.concat((outputs || []).map(function(t) {
      return { "source": t.target, "target": [-1, t.id] }
    }));
    return ew;
  }

  function update() {
    var id_to_index = {},
        old_ids = {},
        new_ids = {},
        index_to_id = {},
        index_updates = {},
        additions = [],
        removals = [];
        
    // need to add module_ids to any modules that are missing them.
    var key_fn = function(d) {
      if (d.module_id == undefined) {
        var id = d3.id();
        Object.defineProperty(d, "module_id", {enumerable: false, get: function() {return id}});
      }
      return d.module_id; 
    }
    // make a map of id -> module index (in data) before doing update
    svg.selectAll(".module").each(function(d,i) { old_ids[d.module_id] = i });
    var module_update = svg.selectAll(".module").data(function(d) {return d.modules}, key_fn);
    var en = module_update.enter();
    en.append(module); // .each(function(d) {additions.push(d.module_id)});
    module_update.exit()/*.each(function(d) {removals.push(d.module_id)})*/.remove();
    module_update.attr("index", function(d,i) {return i});
    svg.selectAll(".module").each(function(d,i) { new_ids[d.module_id] = i });
    for (var ii in old_ids) {
      var old_index = old_ids[ii],
          new_index = new_ids[ii];
      if (old_index != new_index) {
        index_updates[old_index] = new_index;
      }
    }
    
    // moves endpoints when index shifts because of deletions below in the list of modules
    var datum = svg.datum();
    var wires = datum.wires || [];
    rewire(index_updates, wires);
    reindex_exposed(index_updates, true);
    
    var exposed_inputs_update = svg.selectAll("g.exposed-terminals.inputs").data(function(d) { return d.inputs || [] });
    exposed_inputs_update.enter().append(exposed_input);
    exposed_inputs_update.exit().remove();
    
    var exposed_outputs_update = svg.selectAll("g.exposed-terminals.outputs").data(function(d) { return d.outputs || [] });
    exposed_outputs_update.enter().append(exposed_output);
    exposed_outputs_update.exit().remove();
    
    // remove wires without existing endpoints;
    exposed_wires = generate_exposed_wires();
    exposed_wires = exposed_wires.filter(wire_checkends);
    svg.datum().wires = svg.datum().wires.filter(wire_checkends);
    
    var exposed_wire_update = svg.selectAll(".exposed-wire").data(exposed_wires, wire_keyfn);
    exposed_wire_update.enter().append(exposed_wire);
    exposed_wire_update.exit().remove();

    var wire_update = svg.selectAll(".wire").data(function(d) {return d.wires}, wire_keyfn);
    wire_update.enter().append(wire);
    wire_update.exit().remove();
    
    draw_wires();
    dispatch.call("update");
  }
  
  function draw_wires() {
    svg.selectAll(".wire").each(draw_wire)
    svg.selectAll(".exposed-wire").each(draw_wire)
    dispatch.call("draw_wires");
  }
  
  function get_terminal_pos(term_id) {
    var parent = (term_id[0] == "-1") ? svg.selectAll('.exposed-terminals') : 
      svg.selectAll('g.module[index="' + term_id[0] + '"]');
    var terminal = parent.select('.terminal[terminal_id="' + term_id[1] + '"]');
    if (terminal.empty()) { return null }
    var reference_point = svg.node().createSVGPoint();
    var terminal_origin = reference_point.matrixTransform(terminal.node().getCTM());
    var terminal_pos = {
      x: terminal_origin.x + (+terminal.attr("wireoffset_x")),
      y: terminal_origin.y + (+terminal.attr("wireoffset_y"))
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
      var wires = svg.datum().wires.concat(exposed_wires);
        for (var i=0; i<wires.length; i++) {
          var w = wires[i]; 
          if (w.source == src && w.target == tgt) {
            wires.pop(i);
            break;
          }
        };
        update();
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
    d += "C" + (+(pt1.x) + options.wirecurve*dx).toFixed() + "," + pt1.y + " ";
    d +=       (+(pt2.x) - options.wirecurve*dx).toFixed() + "," + pt2.y + " ";
    d +=       pt2.x + "," + pt2.y;
    return d;
  }
  
  function Editor(selection, datum) {
    container = selection; // store for later use
    Editor.container = container;
    
    var datum = datum || {modules: [], wires: []};
    svg = selection.append("svg").datum(datum)
      .classed("editor", true)
    
    update();
  }
  
  Editor.dispatch = dispatch;
  
  Editor.export = function() {
    return extend(true, {}, svg.datum());
  }
  
  Editor.import = function(datum, copyfirst) {
    // first the modules...
    if (copyfirst) {
      var datum = extend(true, {}, datum);
    }
    svg.datum({modules: datum.modules, wires: []});
    // then renumber them...
    Editor.update();
    // then import everything else...
    svg.datum(datum);
    Editor.update();
  }
  
  Editor.svg = function(_) {
    if (!arguments.length) { return svg }
    svg = _;
    return Editor;
  }
  
  Editor.module_defs = function(_) {
    if (!arguments.length) {return module_defs}
    module_defs = _;
    return Editor;
  }
  
  Editor.update = update;
  Editor.draw_wires = draw_wires;
  
  var wireaction = d3.drag()
      .on("start.wire", wirestart)
      .on("drag.wire", wirepull)
      .on("end.wire", wirestop);
  
  var active_wire = false,
      new_wiredata = null;
      
  function wirestart() {
    currentEvent.sourceEvent.stopPropagation();
    var parent_el = this.parentNode.parentNode;
    if (currentEvent.sourceEvent.button > 0 || !d3.select(parent_el).classed("wireable")) {
      wiredrag_cancelled = true;
      return
    }
    wiredrag_cancelled = false;
    var parent_el = this.parentNode.parentNode;
    d3.select(this).classed("active-wiring", true);
    var terminal_id = d3.select(this).attr("terminal_id");
    var module_index = d3.select(parent_el).attr("index");
    var address = [parseInt(module_index),  terminal_id];
    new_wiredata = {source: null, target: null}
    var dest_selector = (this.classList.contains("input")) ? ".wireable .output" : ".wireable .input";
    svg.selectAll(dest_selector)
      .on("mouseenter", function() {d3.select(this).classed("active-wiring", true)})
      .on("mouseleave", function() {d3.select(this).classed("active-wiring", false)})
    if (this.classList.contains("input")) {
      new_wiredata.target = address;
      new_wiredata.source = "cursor";        
    } else {
      new_wiredata.source = address;
      new_wiredata.target = "cursor";
    }
    active_wire = true;
    // add new wire to list of wires in data... but move to "exposed_wires" on stop if needed
    svg.datum().wires.push(new_wiredata);
    update();
  }
    
    function wirestop() {
      currentEvent.sourceEvent.stopPropagation();
      if (wiredrag_cancelled) { return }
      d3.select(this).classed("active-wiring", false);
      var active_data = new_wiredata; // d3.select(active_wire).datum();
      var is_exposed = false;
      if (this.classList.contains("input")) {
        var new_src = d3.select(".output.active-wiring");
        if (!new_src.empty()) {
          var module_index = d3.select(new_src.node().parentNode.parentNode).attr("index");
          active_data.source = [parseInt(module_index), new_src.attr("terminal_id")];
        }
      } 
      else if (this.classList.contains("output")) {
        var new_tgt = d3.select(".input.active-wiring");
        if (!new_tgt.empty()) {
          var module_index = d3.select(new_tgt.node().parentNode.parentNode).attr("index");
          active_data.target = [parseInt(module_index), new_tgt.attr("terminal_id")];
        }
      }
      if (!active_data || active_data.target == 'cursor' || active_data.source == 'cursor') {
          active_wire = false;
      }
      else {
        if (active_data.target[0] < 0) { 
          // -1 index means exposed wire: transfer to exposed_wires:
          var to_change = svg.datum().outputs.filter(function(f) { return f.id == active_data.target[1] })[0];
          to_change.target = active_data.source;
          active_wire = false;
        }
        if (active_data.source[0] < 0) {
          var to_change = svg.datum().inputs.filter(function(f) { return f.id == active_data.source[1] })[0];
          to_change.target = active_data.target;
          active_wire = false;
        }
      }
      
      if (active_wire) {
        var matches = svg.datum().wires.filter(function(d) {
          return (d.target == active_data.target && d.source == active_data.source)
        });
        if (matches.length > 1) { active_wire = false }
      }
      
      // active wire should be the last added: check for existing
      // if not successful target or source match, or if duplicate: pop
      if (!active_wire) { svg.datum().wires.pop() }
      update();
      svg.selectAll(".terminal")
        .classed("active-wiring", false)
        .on("mouseenter", null)
        .on("mouseleave", null)
      active_wire = false;
    }
    
    function wirepull() {
      currentEvent.sourceEvent.stopPropagation();
      draw_wires();
    }
  
  function module(module_data) {
    var group; // this will be the module group.
    if (!('x' in module_data)) module_data.x = 100;
    if (!('y' in module_data)) module_data.y = 100;  
    
    // look up terminals from module definition if not in module_data:
    // lookup first from module_data, then editor instance.
    var is_embedded_module = ('module_def' in module_data);
    var module_def = module_data.module_def || module_defs[module_data.module] || {};
    var input_terminals = extend(true, [], (module_def.inputs || []));
    var output_terminals = extend(true, [], (module_def.outputs || []));
    if (is_embedded_module) {
      input_terminals = input_terminals.map(function(t) { return resolve_terminal(module_def, 'inputs', t) });
      output_terminals = output_terminals.map(function(t) { return resolve_terminal(module_def, 'outputs', t) });
    }

    var padding = options.padding;
    var grid_spacing = options.grid_spacing;
    var active_wire, new_wiredata;
    
    var drag = d3.drag()
      //.on("start", function() { orig_x = module_data.x; orig_y = module_data.y })
      .clickDistance(grid_spacing)
      .on("drag", dragmove)
      
    function dragmove() {
      if (!d3.select(this).classed("draggable")) {return}
      var dx = Math.round(currentEvent.x/grid_spacing) * grid_spacing - module_data.x;
      var dy = Math.round(currentEvent.y/grid_spacing) * grid_spacing - module_data.y;
      module_data.x += dx;
      module_data.y += dy;
      group.attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")");
      dispatch.call("drag_module", this, module_data, dx, dy);
      draw_wires();
    }
    
    // create and append module HTML element:
    group = d3.select(this).append("g")
      .datum(module_data)
      .classed("module draggable wireable", true)
      .style("cursor", "move")
      .attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")")
      .attr("x-origin", module_data.x.toFixed())
      .attr("y-origin", module_data.y.toFixed())
      
      var width = options.min_width + (padding * 2);
      var height = options.min_height + (padding * 2);
      
      var title = group.append("g")
        .classed("title", true)
      
      // add title text first so other elements are drawn over it
      var titletext = title.append("text")
        .classed("title text", true)
        .text(function(d) {return d.title || d.module})
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", "1em")
      
      if (options.autosize_modules) {
        var text_width = titletext.node().getComputedTextLength() + (padding * 2);
        width = Math.max(text_width, width);
      }
        
      var inputs = group.selectAll(".inputs")
        .data(input_terminals)
        .enter().append("g")
          .classed("terminals", true)
          .classed("inputs", true)
          .attr("transform", function(d,i) { return "translate(-20," + (height * i).toFixed() + ")"})
      
      var outputs = group.selectAll(".outputs")
        .data(output_terminals)
        .enter().append("g")
          .classed("terminals", true)
          .classed("outputs", true)
          .attr("transform", function(d,i) { return "translate(" + width.toFixed() + "," + (height * i).toFixed() + ")"})
        
      
      
      // add input elements to group:
      inputs
          .append("text")
            .classed("input label", true)
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", "1em")
            .style("padding", padding)
            .text(function(d) { return d.label; });
      
      inputs.append("rect")
          .classed("terminal input", true)
          .attr("width", 20)
          .attr("height", height)
          .attr("wireoffset_x", 0)
          .attr("wireoffset_y", height/2)
          .attr("terminal_id", function(d) {return d.id})
          .call(wireaction)
          .append("svg:title")
            .text(function(d) { return d.id; });
            
      inputs.append("polygon")
          .classed("terminal input state", true)
          .attr("points", "0,0 20," + (height/2).toFixed() + " 0," + height.toFixed())    
      
      // add output elements to group:        
      outputs
          .append("text")
            .classed("output label", true)
            .attr("x", padding)
            .attr("y", padding)
            .style("dy", "1em")
            .style("padding", padding)
            .text(function(d) { return d.label; });
            
      outputs.append("rect")
          .classed("terminal output", true)
          .attr("width", 20)
          .attr("height", height)
          .attr("wireoffset_x", 20)
          .attr("wireoffset_y", height/2)        
          .attr("terminal_id", function(d) {return d.id})
          .call(wireaction)
          .append("svg:title")
            .text(function(d) { return d.id; });
      
      outputs.append("polygon")
          .classed("terminal input state", true)
          .attr("points", "0,0 20," + (height/2).toFixed() + " 0," + height.toFixed())    
      
      //add title border last to make sure it's on top
      title.append("rect")
        .classed("title border", true)
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0)

      group.call(drag);
      return group.node();  
  }
  
  function wire(wire_data) {
    var connector = d3.select(this).append("path")
      .classed("wire", true);
    return connector.node();
  }
  
  function exposed_wire(wire_data) {
    var connector = d3.select(this).append("path")
      .classed("exposed-wire", true);
    return connector.node();
  }
  
  function exposed_input(input_data, i) {
    var width = 20;
    var height = 20 + (options.padding * 2);
    
    //var exposed_group = document.createElementNS("http://www.w3.org/2000/svg","g");
    
    var exposed_group = svg.append("g")
      .classed("exposed-terminals wireable inputs", true)
      .datum(input_data)
      .attr("index", "-1")
      .attr("transform", "translate(0, " + (height * i).toFixed() + ")")
      
    exposed_group.append('g')
      .append('rect')
        .classed("terminal", true)
        .classed("output", true)
        .classed("exposed", true)
        .attr("width", width)
        .attr("height", height)
        .attr("wireoffset_x", width)
        .attr("wireoffset_y", height/2)
        .attr("terminal_id", function(d,i) { return d.id })
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d.id; });
          
    return exposed_group.node();
  }
  
  function exposed_output(output_data, i) {
    var width = 20;
    var height = 20 + (options.padding * 2);
    
    var svg_width = svg.node().width.baseVal.value;
    var exposed_group = svg.append("g")
      .classed("exposed-terminals wireable outputs", true)
      .datum(output_data)
      .attr("index", "-1")
      .attr("transform", "translate(" + (svg_width - width).toFixed() + "," + (height * i).toFixed() + ")")
      
    exposed_group.append('g')
      .append('rect')
        .classed("terminal", true)
        .classed("input", true)
        .classed("exposed", true)
        .attr("width", width)
        .attr("height", height)
        .attr("wireoffset_x", 0)
        .attr("wireoffset_y", height/2)
        .attr("terminal_id", function(d,i) { return d.id })
        .call(wireaction)
        .append("svg:title")
          .text(function(d) { return d.id; });
          
    return exposed_group.node();
  }
    
  function resolve_terminal(module_def, side, terminal) {
    // side is 'inputs' or 'outputs'
    var target_module_index = terminal.target[0];
    var target_terminal_id = terminal.target[1];
    var target_module = module_def.modules[target_module_index];
    var target_module_def = target_module.module_def || module_defs[target_module.module];
    var is_target_embedded = ('module_def' in target_module);
    var target_terminal = target_module_def[side].filter(function(f) { return f.id == target_terminal_id })[0];
    var resolved_terminal = (is_target_embedded) ? resolve_terminal(target_module_def, side, target_terminal) : target_terminal;
    // make a copy...
    resolved_terminal = extend(true, {}, resolved_terminal);
    resolved_terminal.id = terminal.id;
    if (terminal.label) {
      resolved_terminal.label = terminal.label;
    }
    return resolved_terminal
  }
      
    
  
  return Editor;
}
