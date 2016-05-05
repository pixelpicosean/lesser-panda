var utils = require('./utils');
var utilsG = require('engine/utils');
var physics = require('engine/physics');
var Vector = require('engine/vector');
var decomp = require('./decomp');

var core = require('engine/core');
var PIXI = require('engine/pixi');

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

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
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

/**
 * CollisionLayer is a specific tile layer, which is used to support
 * collision of a tilemap.
 *
 * @class CollisionLayer
 * @constructor
 *
 * @param {object} def   Map data.
 * @param {number} group Collision group for this layer.
 */
function CollisionLayer(def, group) {
  this.tilesize = def.tilesize;
  this.width = def.width;
  this.height = def.height;
  if (typeof(def.data[0]) === 'number') {
    this.data = utils.lift(def.data, this.width, this.height);
  }
  else {
    this.data = def.data;
  }

  this.group = group;
  this.bodies = [];

  this.generateShapes();
}
/**
 * Generate bodies.
 * @memberof CollisionLayer#
 * @method generateShapes
 */
CollisionLayer.prototype.generateShapes = function generateShapes() {
  var i, j;

  // Create edges
  var edges = [];
  var taggedGroups = {};

  var mx = this.tilesize, my = this.tilesize;
  var tag, x, y, v0, v1, v2, v3, e0, e1, e2, e3, grid = this.data, count = 0;
  for (i = 0; i < this.height; i++) {
    for (j = 0; j < this.width; j++) {
      if (grid[i][j] !== 0) {
        tag = count++;

        x = mx * j; // left
        y = my * i; // top

        v0 = { x: x,      y: y + my }; // left-bottom
        v1 = { x: x,      y: y      }; // left-top
        v2 = { x: x + mx, y: y      }; // right-top
        v3 = { x: x + mx, y: y + my }; // right-bottom

        e0 = [v0, v1, tag, false];
        e1 = [v1, v2, tag, false];
        e2 = [v2, v3, tag, false];
        e3 = [v3, v0, tag, false];

        edges.push(e0, e1, e2, e3);

        taggedGroups[tag] = [e0, e1, e2, e3];
      }
    }
  }

  function isEdgeEqual(e1, e2) {
    var d1 = (e1[0].x - e2[1].x)*(e1[0].x - e2[1].x) + (e1[0].y - e2[1].y)*(e1[0].y - e2[1].y);
    var d2 = (e2[0].x - e1[1].x)*(e2[0].x - e1[1].x) + (e2[0].y - e1[1].y)*(e2[0].y - e1[1].y);
    if (d1 < 0.25 && d2 < 0.25) return true;
  }

  // Go through all edges and delete all instances of the ones that appear more than once
  var e1, e2, t1, t2, g1, g2, k;
  for (i = edges.length - 1; i >= 0; i--) {
    e1 = edges[i];
    for (j = i - 1; j >= 0; j--) {
      e2 = edges[j];
      if (isEdgeEqual(e1, e2)) {
        // Remove edges
        utilsG.removeItems(edges, i, 1);
        utilsG.removeItems(edges, j, 1);

        // Merge tags
        t1 = e1[2];
        t2 = e2[2];

        g1 = taggedGroups[t1];
        g2 = taggedGroups[t2];

        // The edges share the same tag
        if (t1 === t2) continue;

        // e2 is not checked yet
        if (!e2[3]) {
          // Make sure g1 is also checked, at least from now
          for (k = 0; k < g1.length; k++) {
            g1[k][3] = true;
          }
          // Tag all edges of g2 as t1, and mark as checked
          for (k = 0; k < g2.length; k++) {
            g2[k][2] = t1;
            g2[k][3] = true;

            g1.push(g2[k]);
          }
          delete taggedGroups[t2];
        }
        else {
          // Make sure g2 is also checked, at least from now
          for (k = 0; k < g2.length; k++) {
            g2[k][3] = true;
          }
          // Tag all edges of g1 as t2, and mark as checked
          for (k = 0; k < g1.length; k++) {
            g1[k][2] = t2;
            g1[k][3] = true;

            g2.push(g1[k]);
          }
          delete taggedGroups[t1];
        }
      }
    }
  }

  function findEdge(edge_list, point) {
    for (var i = 0; i < edge_list.length; i++) {
      var edge = edge_list[i];
      var d = (edge[0].x - point.x)*(edge[0].x - point.x) + (edge[0].y - point.y)*(edge[0].y - point.y);
      if (d < 0.25) return i;
    }
    return -1;
  }

  // Remove extra edges
  var edge_list_size = edges.length, last_edge_list_size = 0, edge;
  var p1, p2, p3, p3Idx;
  while (edge_list_size !== last_edge_list_size) {
    edge_list_size = edges.length;
    for (i = 0; i < edges.length; i++) {
      edge = edges[i];
      p1 = edge[0];
      p2 = edge[1];
      p3Idx = findEdge(edges, p2);
      p3 = null;
      if (p3Idx >= 0) {
        p3 = edges[p3Idx][1];
        if (Math.abs((p1.y - p2.y)*(p1.x - p3.x) - (p1.y - p3.y)*(p1.x - p2.x)) < 0.025) {
          edge[1].x = p3.x;
          edge[1].y = p3.y;
          utilsG.removeItems(edges, p3Idx, 1);
          i -= 1;
          break;
        }
      }
    }
    last_edge_list_size = edges.length;
  }

  var shapes = {};
  for (i = 0; i < edges.length; i++) {
    if (!shapes[edges[i]]) {
      shapes[edges[i]] = [edges[i]];
    }
    else {
      shapes[edges[i]].push(edges[i]);
    }
  }

  function getShapeVertices(shape) {
    var temp_edges = shape.slice();
    var vertices = [];
    var edge = temp_edges[0];
    utilsG.removeItems(temp_edges, 0, 1);
    vertices.push([edge[0].x, edge[0].y]);
    var next_edge = findEdge(temp_edges, edge[1]);
    while (next_edge >= 0) {
      edge = temp_edges[next_edge];
      utilsG.removeItems(temp_edges, next_edge, 1);
      vertices.push([edge[0].x, edge[0].y]);
      next_edge = findEdge(temp_edges, edge[1]);
    }
    if (temp_edges.length === 0) return vertices;
  }

  // Decomp polygons
  var polygons = [], polys;
  for (k in shapes) {
    var decompPoly = new decomp.Polygon();
    decompPoly.vertices = getShapeVertices(shapes[k]);
    polys = decompPoly.quickDecomp();
    for (i = 0; i < polys.length; i++) {
      polygons.push(polys[i].vertices);
    }
  }
  // Convert to vector lists
  var polygonPoints = [], polygon, points;
  for (i = 0; i < polygons.length; i++) {
    polygon = polygons[i];
    points = [];
    for (j = 0; j < polygon.length; j++) {
      points.push(new Vector(polygon[j][0], polygon[j][1]));
    }
    polygonPoints.push(points);
  }
  // console.log(polygonPoints);

  // Create bodies for each convex polygon
  var body
  for (i = 0; i < polygonPoints.length; i++) {
    body = new physics.Body({
      shape: new physics.Polygon(polygonPoints[i]),
    });
    body.collisionGroup = this.group;
    this.bodies.push(body);
  }
};

/**
 * Destroy this layer.
 * @memberof CollisionLayer#
 * @method destroy
 */
CollisionLayer.prototype.destroy = function() {
  for (var i = 0; i < this.bodies.length; i++) {
    this.bodies[i].remove();
  }
  this.bodies.length = 0;
};

/**
 * Add this layer to a scene.
 * @memberof CollisionLayer#
 * @method addTo
 */
CollisionLayer.prototype.addTo = function(scene) {
  this.scene = scene;

  for (var i = 0; i < this.bodies.length; i++) {
    scene.world.addBody(this.bodies[i]);
  }
};

/**
 * @requires engine/core
 * @requires engine/vector
 * @requires engine/physics
 * @requires engine/pixi
 * @requires engine/utils
 * @requires engine/tilemap/utils
 * @requires engine/tilemap/decomp
 *
 * @see CollisionLayer
 */
module.exports = CollisionLayer;
