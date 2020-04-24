(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', './heat-chart.js', './xy-chart.js', './jquery-extend.js', './rectangle-select.js', './colormap.js', './dataflow-editor.js', './x-slice-interactor.js', './rectangle-interactor.js', './monotonic-function-interactor.js', './y-slice-interactor.js', './ellipse-interactor.js', './heat-chart-multi.js', './heat-chart-multi-masked.js', './linePolygonIntersect.js', './polygon-interactor.js', './profile-interactor.js', './angle-slice-interactor.js', './crosshair-interactor.js', './generate-id.js'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('./heat-chart.js'), require('./xy-chart.js'), require('./jquery-extend.js'), require('./rectangle-select.js'), require('./colormap.js'), require('./dataflow-editor.js'), require('./x-slice-interactor.js'), require('./rectangle-interactor.js'), require('./monotonic-function-interactor.js'), require('./y-slice-interactor.js'), require('./ellipse-interactor.js'), require('./heat-chart-multi.js'), require('./heat-chart-multi-masked.js'), require('./linePolygonIntersect.js'), require('./polygon-interactor.js'), require('./profile-interactor.js'), require('./angle-slice-interactor.js'), require('./crosshair-interactor.js'), require('./generate-id.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.heatChart, global.xyChart, global.jqueryExtend, global.rectangleSelect, global.colormap, global.dataflowEditor, global.xSliceInteractor, global.rectangleInteractor, global.monotonicFunctionInteractor, global.ySliceInteractor, global.ellipseInteractor, global.heatChartMulti, global.heatChartMultiMasked, global.linePolygonIntersect, global.polygonInteractor, global.profileInteractor, global.angleSliceInteractor, global.crosshairInteractor, global.generateId);
    global.index = mod.exports;
  }
})(this, function (exports, _heatChart, _xyChart, _jqueryExtend, _rectangleSelect, _colormap, _dataflowEditor, _xSliceInteractor, _rectangleInteractor, _monotonicFunctionInteractor, _ySliceInteractor, _ellipseInteractor, _heatChartMulti, _heatChartMultiMasked, _linePolygonIntersect, _polygonInteractor, _profileInteractor, _angleSliceInteractor, _crosshairInteractor, _generateId) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, 'heatChart', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_heatChart).default;
    }
  });
  Object.defineProperty(exports, 'xyChart', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_xyChart).default;
    }
  });
  Object.defineProperty(exports, 'extend', {
    enumerable: true,
    get: function () {
      return _jqueryExtend.extend;
    }
  });
  Object.defineProperty(exports, 'type', {
    enumerable: true,
    get: function () {
      return _jqueryExtend.type;
    }
  });
  Object.defineProperty(exports, 'rectangleSelect', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_rectangleSelect).default;
    }
  });
  Object.defineProperty(exports, 'colormap_names', {
    enumerable: true,
    get: function () {
      return _colormap.colormap_names;
    }
  });
  Object.defineProperty(exports, 'get_colormap', {
    enumerable: true,
    get: function () {
      return _colormap.get_colormap;
    }
  });
  Object.defineProperty(exports, 'colormap_data', {
    enumerable: true,
    get: function () {
      return _colormap.colormap_data;
    }
  });
  Object.defineProperty(exports, 'dataflowEditor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_dataflowEditor).default;
    }
  });
  Object.defineProperty(exports, 'xSliceInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_xSliceInteractor).default;
    }
  });
  Object.defineProperty(exports, 'rectangleInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_rectangleInteractor).default;
    }
  });
  Object.defineProperty(exports, 'monotonicFunctionInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_monotonicFunctionInteractor).default;
    }
  });
  Object.defineProperty(exports, 'ySliceInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_ySliceInteractor).default;
    }
  });
  Object.defineProperty(exports, 'ellipseInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_ellipseInteractor).default;
    }
  });
  Object.defineProperty(exports, 'heatChartMulti', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_heatChartMulti).default;
    }
  });
  Object.defineProperty(exports, 'heatChartMultiMasked', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_heatChartMultiMasked).default;
    }
  });
  Object.defineProperty(exports, 'linePolygonIntersects', {
    enumerable: true,
    get: function () {
      return _linePolygonIntersect.linePolygonIntersects;
    }
  });
  Object.defineProperty(exports, 'lineLineIntersect', {
    enumerable: true,
    get: function () {
      return _linePolygonIntersect.lineLineIntersect;
    }
  });
  Object.defineProperty(exports, 'reflect', {
    enumerable: true,
    get: function () {
      return _linePolygonIntersect.reflect;
    }
  });
  Object.defineProperty(exports, 'polygonInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_polygonInteractor).default;
    }
  });
  Object.defineProperty(exports, 'profileInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_profileInteractor).default;
    }
  });
  Object.defineProperty(exports, 'angleSliceInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_angleSliceInteractor).default;
    }
  });
  Object.defineProperty(exports, 'crosshairInteractor', {
    enumerable: true,
    get: function () {
      return _interopRequireDefault(_crosshairInteractor).default;
    }
  });
  Object.defineProperty(exports, 'generateID', {
    enumerable: true,
    get: function () {
      return _generateId.generateID;
    }
  });

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }
});
