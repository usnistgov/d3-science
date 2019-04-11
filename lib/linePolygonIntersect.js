(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.linePolygonIntersect = mod.exports;
  }
})(this, function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.linePolygonIntersects = linePolygonIntersects;
  exports.lineLineIntersect = lineLineIntersect;
  exports.reflect = reflect;


  function linePolygonIntersects(line, polygonPoints, closePath, calculate_reflection, ordered) {
    // line is coordinate list of length 2 e.g. [(x1,y1), (x2,y2)]
    // polygonPoints is coordinate list of length N
    // closePath is boolean (defaults to true): 
    //    loop around and make a segment from point N-1 to point 0
    //    to close the polygon.
    // ordered is boolean (defaults to true): 
    //    if true, return list in order of intersection along line.
    var intersects = [];
    for (var i = 0; i < polygonPoints.numberOfItems - 1; i++) {
      var line2 = [polygonPoints.getItem(i), polygonPoints.getItem(i + 1)],
          intersect = lineLineIntersect(line2, line, calculate_reflection);
      if (intersect) {
        intersects.push(intersect);
      }
    }
    if (closePath && polygonPoints.numberOfItems > 1) {
      var line2 = [polygonPoints.getItem(polygonPoints.length - 1), polygonPoints.getItem(0)],
          intersect = lineLineIntersect(line2, line, calculate_reflection);
      if (intersect) {
        intersects.push(intersect);
      }
    }

    if (ordered) {
      intersects.sort(function (a, b) {
        return +(a.v > b.v) || +(a.v === b.v) - 1;
      });
    }

    return intersects;
  }

  function lineLineIntersect(line1, line2, calculate_reflection) {
    // line1 and line2 are SVGPointList e.g. [(x1,y1), (x2,y2)]
    // returns an object with the intersection coordinates
    // (if there is an intersection)
    // as well as the fractional position along line2 of the intersection (v)
    // as well as the sign of the cross-product of the line vector and the
    // segment vector (outer)
    var ret = null;
    // dx1, dy1, etc. are start-end for that line
    // dx1x2 and dy1y2 are difference of start values between lines.
    var dx1 = line1[1].x - line1[0].x,
        dy1 = line1[1].y - line1[0].y,
        dx2 = line2[1].x - line2[0].x,
        dy2 = line2[1].y - line2[0].y,
        dx1x2 = line2[0].x - line1[0].x,
        dy1y2 = line2[0].y - line1[0].y,
        denom = dx1 * dy2 - dx2 * dy1;
    if (denom != 0) {
      // slopes match when denom is zero; return value should remain null. 
      var u = (dx1x2 * dy2 - dy1y2 * dx2) / denom;
      var v = (dx1x2 * dy1 - dy1y2 * dx1) / denom;

      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        ret = { x: v * dx2 + line2[0].x, y: v * dy2 + line2[0].y, u: u, v: v, outer: Math.sign(denom) };
        if (calculate_reflection) {
          ret.rel_angle = Math.acos((dx1 * dx2 + dy1 * dy2) / Math.sqrt((dx1 * dx1 + dy1 * dy1) * (dx2 * dx2 + dy2 * dy2)));
          ret.reflection = reflect(dx1, dy1, dx2, dy2);
        }
      }
    }
    return ret;
  }

  function reflect(dx1, dy1, dx2, dy2) {
    // from 2 vectors (dx1, dy1), (dx2, dy2) get the reflection of vector 2
    // from vector 1 line
    var denom1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
        denom2 = Math.sqrt(dx2 * dx2 + dy2 * dy2),
        parallel = (dx1 * dx2 + dy1 * dy2) / denom1;

    var parallel_x = parallel * dx1 / denom1,
        parallel_y = parallel * dy1 / denom1,
        perp_x = dx2 - parallel_x,
        perp_y = dy2 - parallel_y;

    var reflected = { x: (parallel_x - perp_x) / denom2, y: (parallel_y - perp_y) / denom2 };
    return reflected;
  }
});
