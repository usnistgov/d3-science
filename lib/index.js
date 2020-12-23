(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./heat-chart.js", "./xy-chart.js", "./xy-chart-canvas.js", "./jquery-extend.js", "./rectangle-select.js", "./colormap.js", "./dataflow-editor.js", "./x-slice-interactor.js", "./rectangle-interactor.js", "./monotonic-function-interactor.js", "./y-slice-interactor.js", "./ellipse-interactor.js", "./heat-chart-multi.js", "./heat-chart-multi-masked.js", "./linePolygonIntersect.js", "./polygon-interactor.js", "./profile-interactor.js", "./angle-slice-interactor.js", "./crosshair-interactor.js", "./rectangle-select-points.js", "./scale-interactor.js", "./generate-id.js"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./heat-chart.js"), require("./xy-chart.js"), require("./xy-chart-canvas.js"), require("./jquery-extend.js"), require("./rectangle-select.js"), require("./colormap.js"), require("./dataflow-editor.js"), require("./x-slice-interactor.js"), require("./rectangle-interactor.js"), require("./monotonic-function-interactor.js"), require("./y-slice-interactor.js"), require("./ellipse-interactor.js"), require("./heat-chart-multi.js"), require("./heat-chart-multi-masked.js"), require("./linePolygonIntersect.js"), require("./polygon-interactor.js"), require("./profile-interactor.js"), require("./angle-slice-interactor.js"), require("./crosshair-interactor.js"), require("./rectangle-select-points.js"), require("./scale-interactor.js"), require("./generate-id.js"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.heatChart, global.xyChart, global.xyChartCanvas, global.jqueryExtend, global.rectangleSelect, global.colormap, global.dataflowEditor, global.xSliceInteractor, global.rectangleInteractor, global.monotonicFunctionInteractor, global.ySliceInteractor, global.ellipseInteractor, global.heatChartMulti, global.heatChartMultiMasked, global.linePolygonIntersect, global.polygonInteractor, global.profileInteractor, global.angleSliceInteractor, global.crosshairInteractor, global.rectangleSelectPoints, global.scaleInteractor, global.generateId);
    global.index = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _heatChart, _xyChart, _xyChartCanvas, _jqueryExtend, _rectangleSelect, _colormap, _dataflowEditor, _xSliceInteractor, _rectangleInteractor, _monotonicFunctionInteractor, _ySliceInteractor, _ellipseInteractor, _heatChartMulti, _heatChartMultiMasked, _linePolygonIntersect, _polygonInteractor, _profileInteractor, _angleSliceInteractor, _crosshairInteractor, _rectangleSelectPoints, _scaleInteractor, _generateId) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "heatChart", {
    enumerable: true,
    get: function get() {
      return _heatChart.default;
    }
  });
  Object.defineProperty(_exports, "xyChart", {
    enumerable: true,
    get: function get() {
      return _xyChart.default;
    }
  });
  Object.defineProperty(_exports, "xyChartCanvas", {
    enumerable: true,
    get: function get() {
      return _xyChartCanvas.default;
    }
  });
  Object.defineProperty(_exports, "extend", {
    enumerable: true,
    get: function get() {
      return _jqueryExtend.extend;
    }
  });
  Object.defineProperty(_exports, "type", {
    enumerable: true,
    get: function get() {
      return _jqueryExtend.type;
    }
  });
  Object.defineProperty(_exports, "rectangleSelect", {
    enumerable: true,
    get: function get() {
      return _rectangleSelect.default;
    }
  });
  Object.defineProperty(_exports, "colormap_names", {
    enumerable: true,
    get: function get() {
      return _colormap.colormap_names;
    }
  });
  Object.defineProperty(_exports, "get_colormap", {
    enumerable: true,
    get: function get() {
      return _colormap.get_colormap;
    }
  });
  Object.defineProperty(_exports, "colormap_data", {
    enumerable: true,
    get: function get() {
      return _colormap.colormap_data;
    }
  });
  Object.defineProperty(_exports, "dataflowEditor", {
    enumerable: true,
    get: function get() {
      return _dataflowEditor.default;
    }
  });
  Object.defineProperty(_exports, "xSliceInteractor", {
    enumerable: true,
    get: function get() {
      return _xSliceInteractor.default;
    }
  });
  Object.defineProperty(_exports, "rectangleInteractor", {
    enumerable: true,
    get: function get() {
      return _rectangleInteractor.default;
    }
  });
  Object.defineProperty(_exports, "monotonicFunctionInteractor", {
    enumerable: true,
    get: function get() {
      return _monotonicFunctionInteractor.default;
    }
  });
  Object.defineProperty(_exports, "ySliceInteractor", {
    enumerable: true,
    get: function get() {
      return _ySliceInteractor.default;
    }
  });
  Object.defineProperty(_exports, "ellipseInteractor", {
    enumerable: true,
    get: function get() {
      return _ellipseInteractor.default;
    }
  });
  Object.defineProperty(_exports, "heatChartMulti", {
    enumerable: true,
    get: function get() {
      return _heatChartMulti.default;
    }
  });
  Object.defineProperty(_exports, "heatChartMultiMasked", {
    enumerable: true,
    get: function get() {
      return _heatChartMultiMasked.default;
    }
  });
  Object.defineProperty(_exports, "linePolygonIntersects", {
    enumerable: true,
    get: function get() {
      return _linePolygonIntersect.linePolygonIntersects;
    }
  });
  Object.defineProperty(_exports, "lineLineIntersect", {
    enumerable: true,
    get: function get() {
      return _linePolygonIntersect.lineLineIntersect;
    }
  });
  Object.defineProperty(_exports, "reflect", {
    enumerable: true,
    get: function get() {
      return _linePolygonIntersect.reflect;
    }
  });
  Object.defineProperty(_exports, "polygonInteractor", {
    enumerable: true,
    get: function get() {
      return _polygonInteractor.default;
    }
  });
  Object.defineProperty(_exports, "profileInteractor", {
    enumerable: true,
    get: function get() {
      return _profileInteractor.default;
    }
  });
  Object.defineProperty(_exports, "angleSliceInteractor", {
    enumerable: true,
    get: function get() {
      return _angleSliceInteractor.default;
    }
  });
  Object.defineProperty(_exports, "crosshairInteractor", {
    enumerable: true,
    get: function get() {
      return _crosshairInteractor.default;
    }
  });
  Object.defineProperty(_exports, "rectangleSelectPoints", {
    enumerable: true,
    get: function get() {
      return _rectangleSelectPoints.default;
    }
  });
  Object.defineProperty(_exports, "scaleInteractor", {
    enumerable: true,
    get: function get() {
      return _scaleInteractor.default;
    }
  });
  Object.defineProperty(_exports, "generateID", {
    enumerable: true,
    get: function get() {
      return _generateId.generateID;
    }
  });
  _heatChart = _interopRequireDefault(_heatChart);
  _xyChart = _interopRequireDefault(_xyChart);
  _xyChartCanvas = _interopRequireDefault(_xyChartCanvas);
  _rectangleSelect = _interopRequireDefault(_rectangleSelect);
  _dataflowEditor = _interopRequireDefault(_dataflowEditor);
  _xSliceInteractor = _interopRequireDefault(_xSliceInteractor);
  _rectangleInteractor = _interopRequireDefault(_rectangleInteractor);
  _monotonicFunctionInteractor = _interopRequireDefault(_monotonicFunctionInteractor);
  _ySliceInteractor = _interopRequireDefault(_ySliceInteractor);
  _ellipseInteractor = _interopRequireDefault(_ellipseInteractor);
  _heatChartMulti = _interopRequireDefault(_heatChartMulti);
  _heatChartMultiMasked = _interopRequireDefault(_heatChartMultiMasked);
  _polygonInteractor = _interopRequireDefault(_polygonInteractor);
  _profileInteractor = _interopRequireDefault(_profileInteractor);
  _angleSliceInteractor = _interopRequireDefault(_angleSliceInteractor);
  _crosshairInteractor = _interopRequireDefault(_crosshairInteractor);
  _rectangleSelectPoints = _interopRequireDefault(_rectangleSelectPoints);
  _scaleInteractor = _interopRequireDefault(_scaleInteractor);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
});
