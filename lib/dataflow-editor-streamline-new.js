(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'd3', './jquery-extend'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('d3'), require('./jquery-extend'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.d3, global.jqueryExtend);
    global.dataflowEditorStreamlineNew = mod.exports;
  }
})(this, function (exports, _d, _jqueryExtend) {
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

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.editor = undefined;

  var d3 = _interopRequireWildcard(_d);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  exports.editor = editor;
  exports.default = editor;


  if (!d3.hasOwnProperty("id")) {
    d3.id = function () {
      var a = 0;return function () {
        return a++;
      };
    }();
  }

  function editor(data) {
    var data = data || [];
    var module_defs = module_defs || {};
    var grid_spacing = 5;
    var wirecurve = 0.67;
    var svg, container;
    var dispatch = d3.dispatch("update", "draw_wires");
    dispatch.on("update", update);
    dispatch.on("draw_wires", draw_wires);

    var wire_keyfn = function wire_keyfn(d) {
      return "{source: " + d.source + "," + "target: " + d.target + "}";
    };
    var check_end = function check_end(e) {
      if (e == 'cursor') {
        return true;
      } else {
        //var es = e.split(":"); // not making string pair around : anymore.
        if (e.length != 2) {
          return false;
        }
        var module_index = e[0],
            terminal_id = e[1];
        return container.select('.module[index="' + module_index + '"] .terminal[terminal_id="' + terminal_id + '"]').empty() == false;
      }
    };
    /*
    var wire_checkends = function(w) {
      var src_exists, tgt_exists;
      src_exists = (w.source == 'cursor' || !(svg.select('[id=\"' + w.source + '\"]').empty()) );
      tgt_exists = (w.target == 'cursor' || !(svg.select('[id=\"' + w.target + '\"]').empty()) );
      return (src_exists && tgt_exists)
    }
    */

    var wire_checkends = function wire_checkends(w) {
      return check_end(w.source) && check_end(w.target);
    };

    function rewire(index_updates) {
      var wires = svg.datum().wires;
      var end_names = ['source', 'target'];
      wires.forEach(function (w) {
        end_names.forEach(function (e) {
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

    function update() {
      var id_to_index = {},
          old_ids = {},
          new_ids = {},
          index_to_id = {},
          index_updates = {},
          additions = [],
          removals = [];

      // need to add module_ids to any modules that are missing them.
      var key_fn = function key_fn(d) {
        if (d.module_id == undefined) {
          var id = d3.id();
          Object.defineProperty(d, "module_id", { get: function get() {
              return id;
            } });
        }
        return d.module_id;
      };
      // make a map of id -> module index (in data) before doing update
      svg.selectAll(".module").each(function (d, i) {
        old_ids[d.module_id] = i;
      });
      var module_update = svg.selectAll(".module").data(function (d) {
        return d.modules;
      }, key_fn);
      var en = module_update.enter();
      en.append(module); // .each(function(d) {additions.push(d.module_id)});
      module_update.exit() /*.each(function(d) {removals.push(d.module_id)})*/.remove();
      module_update.attr("index", function (d, i) {
        return i;
      });
      svg.selectAll(".module").each(function (d, i) {
        new_ids[d.module_id] = i;
      });
      for (var ii in old_ids) {
        var old_index = old_ids[ii],
            new_index = new_ids[ii];
        if (old_index != new_index) {
          index_updates[old_index] = new_index;
        }
      }

      // moves endpoints when index shifts because of deletions below in the list of modules
      rewire(index_updates);

      // remove wires without existing endpoints;
      svg.datum().wires = svg.datum().wires.filter(wire_checkends);

      var wire_update = svg.selectAll(".wire").data(function (d) {
        return d.wires;
      }, wire_keyfn);
      wire_update.enter().append(wire);
      wire_update.exit().remove();

      draw_wires();
    }

    function draw_wires() {
      svg.selectAll(".wire").each(draw_wire);
    }

    function get_terminal_pos(term_id) {
      var module = container.select('.module[index="' + term_id[0] + '"]');
      var terminal = module.select('.terminal[terminal_id="' + term_id[1] + '"]');
      if (terminal.empty()) {
        return null;
      }
      var reference_point = svg.node().createSVGPoint();
      var terminal_origin = reference_point.matrixTransform(terminal.node().getCTM());
      var terminal_pos = {
        x: terminal_origin.x + +terminal.attr("wireoffset_x"),
        y: terminal_origin.y + +terminal.attr("wireoffset_y")
      };
      return terminal_pos;
    }

    function draw_wire() {
      var connector = d3.select(this);
      var src_pos, tgt_pos, cursor_pos;
      var src = connector.datum().source,
          tgt = connector.datum().target;
      if (src == "cursor" || tgt == "cursor") {
        var mouse = d3.mouse(svg.node());
        cursor_pos = { x: mouse[0] - 3, y: mouse[1] - 3 };
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
        for (var i = 0; i < wires.length; i++) {
          var w = wires[i];
          if (w.source == src && w.target == tgt) {
            wires.pop(i);
            break;
          }
        };
        dispatch.update();
      } else {
        connector.attr("d", makeConnector(src_pos, tgt_pos));
      }
    }

    function makeConnector(pt1, pt2) {
      var d = "M";
      var dx = Math.abs(+pt1.x - +pt2.x),
          dy = Math.abs(+pt1.y - +pt2.y);
      d = "M" + pt1.x + "," + pt1.y + " ";
      d += "C" + (+pt1.x + wirecurve * dx).toFixed() + "," + pt1.y + " ";
      d += (+pt2.x - wirecurve * dx).toFixed() + "," + pt2.y + " ";
      d += pt2.x + "," + pt2.y;
      return d;
    }

    function editor(selection) {
      container = selection; // store for later use
      svg = selection.selectAll("svg.editor").data(data).enter().append("svg").classed("editor", true);

      // unique id will be assigned to module when created...
      svg.selectAll(".module").data(function (d) {
        return d.modules;
      }).enter().append(module).attr("index", function (d, i) {
        return i;
      });

      svg.selectAll(".wire").data(function (d) {
        return d.wires;
      }).enter().append(wire);

      dispatch.update();
    }

    // wirecurve is usually between 0 and 1
    // if 0, gives a straight-line wire connector
    // if 1, a cubic curve vertical in the middle
    editor.wirecurve = function (_) {
      if (!arguments.length) {
        return wirecurve;
      }
      wirecurve = _;
      return editor;
    };

    editor.data = function (_) {
      if (!arguments.length) {
        return svg.data();
      }
      data = _;
      return editor;
    };

    editor.export = function () {
      // strip the internally-used module_id on the way out
      var export_data = (0, _jqueryExtend.extend)(true, {}, svg.datum());
      if (export_data.modules) {
        export_data.modules.forEach(function (m) {
          delete m.module_id;
        });
      }
      return export_data;
    };

    editor.import = function (datum) {
      // strip module_id on the way in - needed internally
      var import_data = (0, _jqueryExtend.extend)(true, {}, datum);
      if (import_data.modules) {
        import_data.modules.forEach(function (m) {
          delete m.module_id;
        });
      }
      // first the modules...
      svg.datum({ modules: [], wires: [] });
      svg.datum().modules = import_data.modules;
      editor.update();
      // then the wires...
      svg.datum().wires = import_data.wires;
      editor.update();
    };

    editor.svg = function () {
      return svg;
    };

    editor.module_defs = function (_) {
      if (!arguments.length) {
        return module_defs;
      }
      module_defs = _;
      return editor;
    };

    editor.update = update;
    editor.draw_wires = draw_wires;

    var wireaction = d3.behavior.drag().on("dragstart.wire", wirestart).on("drag.wire", wirepull).on("dragend.wire", wirestop);

    var active_wire = false,
        new_wiredata = null;

    function wirestart() {
      var module_el = this.parentNode.parentNode;
      if (!d3.select(module_el).classed("wireable")) {
        return;
      }
      _d.event.sourceEvent.stopPropagation();
      d3.select(this).classed("highlight", true);
      var terminal_id = d3.select(this).attr("terminal_id");
      var module_index = d3.select(module_el).attr("index");
      var address = [parseInt(module_index), terminal_id];
      new_wiredata = { source: null, target: null };
      var dest_selector = this.classList.contains("input") ? ".wireable .output" : ".wireable .input";
      svg.selectAll(dest_selector).on("mouseenter", function () {
        d3.select(this).classed("highlight", true);
      }).on("mouseleave", function () {
        d3.select(this).classed("highlight", false);
      });
      if (this.classList.contains("input")) {
        new_wiredata.target = address;
        new_wiredata.source = "cursor";
      } else {
        new_wiredata.source = address;
        new_wiredata.target = "cursor";
      }
      active_wire = true;
      svg.datum().wires.push(new_wiredata);
      update();
    }

    function wirestop() {
      d3.select(this).classed("highlight", false);
      var active_data = new_wiredata; // d3.select(active_wire).datum();
      if (this.classList.contains("input")) {
        var new_src = d3.select(".output.highlight");
        if (!new_src.empty()) {
          var module_index = d3.select(new_src.node().parentNode.parentNode).attr("index");
          active_data.source = [parseInt(module_index), new_src.attr("terminal_id")];
        }
      } else if (this.classList.contains("output")) {
        var new_tgt = d3.select(".input.highlight");
        if (!new_tgt.empty()) {
          var module_index = d3.select(new_tgt.node().parentNode.parentNode).attr("index");
          active_data.target = [parseInt(module_index), new_tgt.attr("terminal_id")];
        }
      }
      if (active_data.target == 'cursor' || active_data.source == 'cursor') {
        active_wire = false;
      }
      var matches = svg.datum().wires.filter(function (d) {
        return d.target == active_data.target && d.source == active_data.source;
      });
      // active wire should be the last added: check for existing
      // if not successful target or source match, or if duplicate: pop
      if (!active_wire || matches.length > 1) {
        svg.datum().wires.pop();
      }
      update();
      svg.selectAll(".terminal").classed("highlight", false).on("mouseenter", null).on("mouseleave", null);
      active_wire = false;
    }

    function wirepull() {
      _d.event.sourceEvent.stopPropagation();
      draw_wires();
    }

    function module(module_data) {
      var group; // this will be the module group.
      if (!('x' in module_data)) module_data.x = 100;
      if (!('y' in module_data)) module_data.y = 100;

      // look up terminals from module definition if not in module_data:
      //var terminals = module_data.terminals || dataflow.module_defs[module_data.module].terminals;
      var module_name = module_data.module;
      // lookup first from module_data, then editor instance.
      var module_def = module_data.module_def || module_defs[module_name] || {};
      var input_terminals = module_data.inputs || module_def.inputs || [],
          output_terminals = module_data.outputs || module_def.outputs || [];

      var padding = 5;
      var min_width = 75;
      var active_wire, new_wiredata;

      var drag = d3.behavior.drag().on("drag", dragmove).origin(function (a) {
        return { x: module_data.x, y: module_data.y };
      });

      function dragmove() {
        if (!d3.select(this).classed("draggable")) {
          return;
        }
        module_data.x = Math.round(_d.event.x / grid_spacing) * grid_spacing;
        module_data.y = Math.round(_d.event.y / grid_spacing) * grid_spacing;
        group.attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")");
        draw_wires();
      }

      // create and append module HTML element:
      group = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g")).datum(module_data).classed("module draggable wireable", true).style("cursor", "move").attr("transform", "translate(" + module_data.x.toFixed() + "," + module_data.y.toFixed() + ")").attr("x-origin", module_data.x.toFixed()).attr("y-origin", module_data.y.toFixed());

      var title = group.append("g").classed("title", true);

      var width = 75 + padding * 2;
      var height = 20 + padding * 2;

      var titleborder = title.append("rect").classed("title border", true).style("fill", "#ffffff").style("stroke-width", "2px").style("stroke", "#0000ff").attr("width", width).attr("height", height).attr("x", 0).attr("y", 0);

      var titlebox = title.append("text").classed("title text", true).text(function (d) {
        return d.title || d.module;
      }).attr("x", padding).attr("y", padding).attr("dy", "1em").style("height", height).style("padding", padding).style("width", width);

      var inputs = group.selectAll(".input").data(input_terminals).enter().append("g").attr("transform", function (d, i) {
        return "translate(-20," + (height * i).toFixed() + ")";
      });

      inputs.append("text").classed("input label", true).attr("x", padding).attr("y", padding).attr("dy", "1em").style("padding", padding).text(function (d) {
        return d.label;
      });

      inputs.append("rect").classed("terminal input", true).style("cursor", "crosshair").style("fill", "#00FF00").style("fill-opacity", 0.25).style("stroke-width", "2px").style("stroke", "#0000ff").attr("width", 20).attr("height", height).attr("wireoffset_x", 0).attr("wireoffset_y", height / 2).attr("terminal_id", function (d) {
        return d.id;
      }).call(wireaction).append("svg:title").text(function (d) {
        return d.id;
      });

      inputs.append("polygon").classed("terminal input state", true).style("fill", "#444444").style("fill-opacity", 0.5).style("display", "none").attr("points", "0,0 20," + (height / 2).toFixed() + " 0," + height.toFixed());

      var outputs = group.selectAll(".output").data(output_terminals).enter().append("g").attr("transform", function (d, i) {
        return "translate(" + width.toFixed() + "," + (height * i).toFixed() + ")";
      });

      outputs.append("text").classed("output label", true).attr("x", padding).attr("y", padding).style("dy", "1em").style("padding", padding).text(function (d) {
        return d.label;
      });

      outputs.append("rect").classed("terminal output", true).style("cursor", "crosshair").style("fill", "#00FFFF").style("fill-opacity", 0.25).style("stroke-width", "2px").style("stroke", "#0000ff").attr("width", 20).attr("height", height).attr("wireoffset_x", 20).attr("wireoffset_y", height / 2).attr("terminal_id", function (d) {
        return d.id;
      }).call(wireaction).append("svg:title").text(function (d) {
        return d.id;
      });

      outputs.append("polygon").classed("terminal input state", true).style("fill", "#444444").style("fill-opacity", 0.5).style("display", "none").attr("points", "0,0 20," + (height / 2).toFixed() + " 0," + height.toFixed());

      group.call(drag);
      return group.node();
    }

    function wire(wire_data) {
      var connector = document.createElementNS("http://www.w3.org/2000/svg", "path");
      d3.select(connector).classed("wire", true).style("cursor", "crosshair").style("fill", "none").style("stroke-width", "2.5px").style("stroke", "red");
      return connector;
    }
    return editor;
  }
});
