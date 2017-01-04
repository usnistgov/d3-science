function rectangleSelect(drag, x, y) {
  // x, y are d3.scale objects (linear, log, etc) from parent
  // dispatch is the d3 event dispatcher: should have event "update" register
  // 
  // drag is the drag behavior attached to the chart (initialize with this);
  var event_name = "rectangle_select";
  var dispatch = d3.dispatch("update");
  var x = x || d3.scale.linear();
  var y = y || d3.scale.linear();
  var selectRect = true;
  var callbacks = [];
    
  function interactor(selection) {
    // selection is chart mainview, need parent svg:
    //var svg = d3.select(selection.node().parentNode);
    //svg.call(drag);
    
    drag
      .on("dragstart.select", function() {
        if (!selectRect) return;
        var e = selection.node(),
          origin = d3.mouse(e),
          rect = selection.append("rect").attr("class", "zoom");
        d3.select("body").classed("noselect", true);
        var width = Math.max.apply(Math, x.range()),
            height = Math.max.apply(Math, y.range());
        origin[0] = Math.max(0, Math.min(width, origin[0]));
        origin[1] = Math.max(0, Math.min(height, origin[1]));
        drag
          .on("drag.select", function() {
            var m = d3.mouse(e);
            m[0] = Math.max(0, Math.min(width, m[0]));
            m[1] = Math.max(0, Math.min(height, m[1]));
            rect.attr("x", Math.min(origin[0], m[0]))
              .attr("y", Math.min(origin[1], m[1]))
              .attr("width", Math.abs(m[0] - origin[0]))
              .attr("height", Math.abs(m[1] - origin[1]));
          })
          .on("dragend.select", function() {
            drag.on("drag.select", null).on("dragend.select", null);
            d3.select("body").classed("noselect", false);
            var m = d3.mouse(e);
            m[0] = Math.max(0, Math.min(width, m[0]));
            m[1] = Math.max(0, Math.min(height, m[1]));
            if (m[0] !== origin[0] && m[1] !== origin[1]) {
              var xdomain = ([origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b})),
                  ydomain = ([origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b})),
                  new_xmin = xdomain[0],
                  new_xmax = xdomain[1],
                  new_ymin = ydomain[0],
                  new_ymax = ydomain[1];
              callbacks.forEach(function(c) {
                c(new_xmin, new_xmax, new_ymin, new_ymax);
              });
            } 
            else {
              // do something with single click
            }
            rect.remove();
          }, true);
        d3.event.sourceEvent.stopPropagation();
      });
        
    // fire!
    dispatch.update();
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
