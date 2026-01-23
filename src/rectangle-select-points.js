import { drag, dispatch as d3Dispatch, scaleLinear, select } from 'd3';
import { rectangleSelect } from './rectangle-select.js';

export { rectangleSelectPoints, rectangleSelectPoints as default };

function rectangleSelectPoints(state, x, y) {
  var x = x || scaleLinear();
  var y = y || scaleLinear();
  var drag_instance = drag();
  var dispatch = d3Dispatch("selection");

  function interactor(selection) {
    selection.call(drag_instance);
    var selector = new rectangleSelect(drag_instance, null, null);
    interactor.selector = selector;
    selection.call(selector);

    var onselect = function (xmin, xmax, ymin, ymax) {
      let indices = [];
      let elements = [];
      if (!state.skip_points) {
        selection.selectAll("g.series").each(function (d, i) {
          // i is index of 
          let index_list = [];
          indices.push(index_list);
          var series_select = select(this);
          if (!(series_select.classed("hidden"))) {
            // don't interact with hidden series.
            series_select.selectAll(".dot").each(function (dd, ii) {
              // ii is the index of the point in that dataset.
              var [x, y] = dd;
              if (x >= xmin && x <= xmax && y >= ymin && y <= ymax) {
                index_list.push(ii);
                elements.push(this);
              }
            });
          }
        });
      }
      dispatch.call("selection", { indices, elements, limits: {xmin, xmax, ymin, ymax} });
    }
    selector.callbacks(onselect);
  }

  interactor.update = function () {
    interactor.selector.update();
  }

  interactor.x = function (_) {
    if (!arguments.length) return x;
    x = _;
    interactor.selector.x(_);
    return interactor;
  };

  interactor.y = function (_) {
    if (!arguments.length) return y;
    y = _;
    interactor.selector.y(_);
    return interactor;
  };

  interactor.state = state;
  interactor.dispatch = dispatch;

  return interactor
}
