/*
    var drag = d3.behavior.drag();
    svg.call(drag);
      

      drag
        .on("dragstart.select", function() {
          if (!selectRect) return;
          var e = this,
            origin = d3.mouse(e),
            rect = d3.select(this).append("rect").attr("class", "zoom");
          d3.select("body").classed("noselect", true);
          origin[0] = Math.max(0, Math.min(width, origin[0]));
          origin[1] = Math.max(0, Math.min(height, origin[1]));
          //d3.select(window)
          drag
            .on("drag.zoomRect", function() {
              var m = d3.mouse(e);
              m[0] = Math.max(0, Math.min(width, m[0]));
              m[1] = Math.max(0, Math.min(height, m[1]));
              rect.attr("x", Math.min(origin[0], m[0]))
                .attr("y", Math.min(origin[1], m[1]))
                .attr("width", Math.abs(m[0] - origin[0]))
                .attr("height", Math.abs(m[1] - origin[1]));
            })
            .on("dragend.zoomRect", function() {
              //d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
              drag.on("drag.zoomRect", null).on("drag.zoomRect", null);
              d3.select("body").classed("noselect", false);
              var m = d3.mouse(e);
              m[0] = Math.max(0, Math.min(width, m[0]));
              m[1] = Math.max(0, Math.min(height, m[1]));
              if (m[0] !== origin[0] && m[1] !== origin[1]) {
                zoom.x(x.domain([origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b})))
                    .y(y.domain([origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b})));
              } 
              else {
                // reset zoom on single click? No!

                //zoom.scale(1);
                //zoom.translate([0,0]);
                //zoom.x(x.domain([min_x, max_x]))
                //    .y(y.domain([min_y, max_y]));

              }
              rect.remove();
              zoomed();
            }, true);
          d3.event.sourceEvent.stopPropagation();
        });
*/

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

  var line = d3.svg.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });
         
  var state_to_pairs = function(state) {
    // convert from xmin, xmax... to pairs of points for rectangle
    if (show_lines) {
      return [
        [[state.xmin, state.ymin], [state.xmax, state.ymin]],
        [[state.xmax, state.ymin], [state.xmax, state.ymax]],
        [[state.xmax, state.ymax], [state.xmin, state.ymax]],
        [[state.xmin, state.ymax], [state.xmin, state.ymin]]
      ]
    }
    else {
      return [];
    }
  }
  
  var state_to_points = function(state) {
    if (show_points) {
      return [
        [state.xmin, state.ymin],
        [state.xmax, state.ymin],
        [state.xmax, state.ymax],
        [state.xmin, state.ymax],
      ]
    }
    else { 
      return [];
    }
  }
  
  var state_to_center = function(state) {
    if (show_center) {
      return [
        [x.invert((x(state.xmax) + x(state.xmin)) / 2.0),
         y.invert((y(state.ymax) + y(state.ymin)) / 2.0)]
      ]
    }
    else {
      return [];
    }
  }
    
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
        //d3.select(window)
        console.log("dragstart:", origin);
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
            //d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
            drag.on("drag.select", null).on("dragend.select", null);
            d3.select("body").classed("noselect", false);
            var m = d3.mouse(e);
            m[0] = Math.max(0, Math.min(width, m[0]));
            m[1] = Math.max(0, Math.min(height, m[1]));
            if (m[0] !== origin[0] && m[1] !== origin[1]) {
              //zoom.x(x.domain([origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b})))
              //    .y(y.domain([origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b})));
              console.log(([origin[0], m[0]].map(x.invert).sort(function(a,b) {return a-b})));
              console.log(([origin[1], m[1]].map(y.invert).sort(function(a,b) {return a-b})));
            } 
            else {
              // reset zoom on single click? No!
              /*
              zoom.scale(1);
              zoom.translate([0,0]);
              zoom.x(x.domain([min_x, max_x]))
                  .y(y.domain([min_y, max_y]));
              */
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
  
  interactor.update = function() {};
  
  interactor.dispatch = dispatch;
  
  return interactor
}
