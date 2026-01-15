import { pointer, scaleLinear, select, dispatch as d3Dispatch } from "d3";
export {rectangleSelect, rectangleSelect as default};

function rectangleSelect(drag, x, y) {
  // x, y are d3.scale objects (linear, log, etc) from parent
  // dispatch is the d3 event dispatcher: should have event "update" register
  // 
  // drag is the drag behavior attached to the chart (initialize with this);
  var event_name = "rectangle_select";
  var dispatch = d3Dispatch("update");
  var x = x || scaleLinear();
  var y = y || scaleLinear();
  var selectRect = true;
  var callbacks = [];
    
  function interactor(selection) {
    // selection is chart mainview, need parent svg:
    //var svg = d3.select(selection.node().parentNode);
    //svg.call(drag);
      
    drag.on("start.select", drag_started);
    function drag_started(event) {
      if (!selectRect) return;
      var e = selection.node(),
          origin = pointer(event, e),
          rect = selection.append("rect").attr("class", "zoom");
      select("body").classed("noselect", true);
      var width = Math.max.apply(Math, x.range()),
          height = Math.max.apply(Math, y.range());
      origin[0] = Math.max(0, Math.min(width, origin[0]));
      origin[1] = Math.max(0, Math.min(height, origin[1]));
            
      event.on("drag", dragged).on("end", ended);

      function dragged(dragEvent) {
        var m = pointer(dragEvent, e);
        m[0] = Math.max(0, Math.min(width, m[0]));
        m[1] = Math.max(0, Math.min(height, m[1]));
        rect.attr("x", Math.min(origin[0], m[0]))
          .attr("y", Math.min(origin[1], m[1]))
          .attr("width", Math.abs(m[0] - origin[0]))
          .attr("height", Math.abs(m[1] - origin[1]));
      }

      function ended(endEvent) {
        select("body").classed("noselect", false);
        var m = pointer(endEvent, e);
        m[0] = Math.max(0, Math.min(width, m[0]));
        m[1] = Math.max(0, Math.min(height, m[1]));
        if (m[0] !== origin[0] && m[1] !== origin[1]) {
          var x_domain = [origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b}),
              y_domain = [origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b}),
              new_xmin = x_domain[0],
              new_xmax = x_domain[1],
              new_ymin = y_domain[0],
              new_ymax = y_domain[1];
          callbacks.forEach(function(c) {
            c(new_xmin, new_xmax, new_ymin, new_ymax);
          });
        }
        rect.remove();
        dispatch.call("update");
      }
      event.sourceEvent.stopPropagation();
    }
  }
  
  interactor.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    return interactor;
  };

  interactor.y = function(_) {
    if (!arguments.length) return y;
    y = _;
    return interactor;
  };
  
  interactor.selectRect = function(_) {
    if (!arguments.length) return selectRect;
    selectRect = _;
    return interactor;
  }
  
  interactor.callbacks = function(_) {
    if (!arguments.length) return callbacks;
    callbacks.push(_);
    return interactor;
  }
  
  interactor.update = function() {};
  
  interactor.dispatch = dispatch;
  
  return interactor
}
