import { extend } from './jquery-extend.js';

export {scaleInteractor, scaleInteractor as default};

function scaleInteractor(state, x, y, d3_import = null) {
  var d3 = (d3_import != null) ? d3_import : window.d3;
  var x = x || d3.scaleLinear();
  var y = y || d3.scaleLinear();
  var dispatch = d3.dispatch("updated", "end");

  function interactor(selection) {
    let unscaled_data = [];
    selection.selectAll(".dot").on("click", null); // clear previous handlers
    selection.selectAll("g.series").each(function (d, i) {
      // i is index of dataset
      // make a copy of the data:
      unscaled_data[i] = extend(true, [], d);
      var new_scale = state.scales[i] || 1;
      d.forEach(function (ddd, iii) {
        var old_point = unscaled_data[i][iii];
        ddd[1] = new_scale * old_point[1];
        if (ddd[2] && ddd[2].yupper != null) {
          ddd[2].yupper = new_scale * old_point[2].yupper;
        }
        if (ddd[2] && ddd[2].ylower != null) {
          ddd[2].ylower = new_scale * old_point[2].ylower;
        }
      });
      var dragmove_point = function (dd, ii) {
        var new_x = x.invert(d3.event.x),
          new_y = y.invert(d3.event.y),
          old_point = unscaled_data[i][ii],
          old_x = old_point[0],
          old_y = old_point[1];
        new_scale = new_y / old_y;
        d.forEach(function (ddd, iii) {
          var old_point = unscaled_data[i][iii];
          ddd[1] = new_scale * old_point[1];
          if (ddd[2] && ddd[2].yupper != null) {
            ddd[2].yupper = new_scale * old_point[2].yupper;
          }
          if (ddd[2] && ddd[2].ylower != null) {
            ddd[2].ylower = new_scale * old_point[2].ylower;
          }
        })
        state.scales[i] = new_scale; // * original_datum[i];
        dispatch.call("updated");
      }
      var drag_point = d3.drag()
        .on("drag", dragmove_point)
        .on("start", function () { d3.event.sourceEvent.stopPropagation(); })
        .on("end", function() { dispatch.call("end") });

      var series_select = d3.select(this);
      series_select.selectAll(".dot")
        .attr("r", (state.point_size || 7)) // bigger for easier drag...
        .call(drag_point);
    });
  }

  interactor.update = function() {
    //dispatch.call("update");
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

  interactor.state = state;
  interactor.dispatch = dispatch;

  return interactor
}
