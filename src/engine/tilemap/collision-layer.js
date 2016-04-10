var utils = require('./utils');
var utilsG = require('engine/utils');

function unique(arr) {
  var seen = {};
  var out = [];
  var len = arr.length;
  var j = 0;
  for (var i = 0; i < len; i++) {
    var item = arr[i];
    if (seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
}

function pointInPolygon(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point[0], y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0], yi = vs[i][1];
    var xj = vs[j][0], yj = vs[j][1];

    var intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

/* p1 in p2 */
function polygonInPolygon(p1, p2) {
  var inside = true;
  var point = [0, 0];
  for (var i = 0; i < p1.length - 1; i += 2) {
    point[0] = p1[i];
    point[1] = p1[i + 1];
    if (!pointInPolygon(point, p2)) {
      inside = false;
      break;
    }
  }
  return inside;
}

function CollisionLayer(def) {
}

module.exports = exports = CollisionLayer;
