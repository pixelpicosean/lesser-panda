'use strict';

var utils = require('engine/utils');
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
  var point;
  for (var i = 0; i < p1.length; i++) {
    point = p1[i];
    if (!pointInPolygon(point, p2)) {
      inside = false;
      break;
    }
  }
  return inside;
}

function isEdgeEqual(e1, e2) {
  var d1 = (e1[0].x - e2[1].x)*(e1[0].x - e2[1].x) + (e1[0].y - e2[1].y)*(e1[0].y - e2[1].y);
  var d2 = (e2[0].x - e1[1].x)*(e2[0].x - e1[1].x) + (e2[0].y - e1[1].y)*(e2[0].y - e1[1].y);
  if (d1 < 0.25 && d2 < 0.25) return true;
}

function findEdge(edge_list, point) {
  for (var i = 0; i < edge_list.length; i++) {
    var edge = edge_list[i];
    var d = (edge[0].x - point.x)*(edge[0].x - point.x) + (edge[0].y - point.y)*(edge[0].y - point.y);
    if (d < 0.25) return i;
  }
  return -1;
}

function getNearestPoints(outside, inside) {
  // FIXME: should the max value be the size of a tile?
  var distSqr = Number.MAX_VALUE, calcDistSqr;
  var x1, y1, x2, y2;
  var pair = [0, 0];
  for (var i = 0; i < outside.length; i++) {
    for (var j = 0; j < inside.length; j++) {
      x1 = outside[i][0];
      y1 = outside[i][1];
      x2 = inside[j][0];
      y2 = inside[j][1];

      calcDistSqr = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
      if (calcDistSqr < distSqr) {
        distSqr = calcDistSqr;
        pair[0] = i; pair[1] = j;
      }
    }
  }

  return pair;
}

function arrStartFromIdx(arr, idx) {
  var result = arr.slice(idx);
  return result.concat(arr.slice(0, idx));
}

function createZeroWidthPoints(outside, inside) {
  var pair = getNearestPoints(outside, inside);

  outside = arrStartFromIdx(outside, pair[0]);
  inside = arrStartFromIdx(inside, pair[1]);

  outside.push(outside[0]);
  inside.push(inside[0]);

  return outside.concat(inside);
}

function getShapeVertices(shape) {
  var vertices = [];
  var temp_edges = shape.slice();

  var edge = temp_edges[0];
  utils.removeItems(temp_edges, 0, 1);
  vertices.push([edge[0].x, edge[0].y]);
  var next_edge = findEdge(temp_edges, edge[1]);
  while (next_edge >= 0) {
    edge = temp_edges[next_edge];
    utils.removeItems(temp_edges, next_edge, 1);
    vertices.push([edge[0].x, edge[0].y]);
    next_edge = findEdge(temp_edges, edge[1]);
  }

  // Without a hole
  if (temp_edges.length === 0) {
    return vertices;
  }
  // With holes inside
  else {
    // Calculate vertices of the hole inside
    var holeVertices = getShapeVertices(temp_edges);

    // Confirm vertices is outside and hole is inside
    var tempVertices;
    if (polygonInPolygon(vertices, holeVertices)) {
      tempVertices = holeVertices;
      holeVertices = vertices;
      vertices = tempVertices;
    }

    // Create zero width points
    return createZeroWidthPoints(vertices, holeVertices);
  }
}

function genDefaultTileShapes(tilesize) {
  return [
    // Rectangle
    [
      { x:        0, y: tilesize },
      { x:        0, y:        0 },
      { x: tilesize, y:        0 },
      { x: tilesize, y: tilesize },
    ],
    // Triangle
    [
      { x: tilesize, y: tilesize },
      { x:        0, y: tilesize },
      { x:        0, y:        0 },
    ],
    // Triangle
    [
      { x:        0, y: tilesize },
      { x: tilesize, y:        0 },
      { x: tilesize, y: tilesize },
    ],
    // Triangle
    [
      { x: tilesize, y:        0 },
      { x:        0, y: tilesize },
      { x:        0, y:        0 },
    ],
    // Triangle
    [
      { x:        0, y:        0 },
      { x: tilesize, y:        0 },
      { x: tilesize, y: tilesize },
    ],
  ];
}

/**
 * CollisionMap is a specific tile layer, which is used to support
 * collision of a tilemap.
 *
 * @class CollisionMap
 * @constructor
 *
 * @param {number} tilesize     Tile size.
 * @param {Array}  data         Map data as a 2D array.
 * @param {number} group        Collision group for this layer.
 * @param {Array}  [tileShapes] Tile shape list.
 */
function CollisionMap(tilesize, data, group, tileShapes) {
  this.tilesize = tilesize;

  this.width = data[0].length;
  this.height = data.length;

  this.data = data;

  this.group = group;
  this.tileShapes = tileShapes || genDefaultTileShapes(tilesize);

  this.bodies = [];

  this.generateShapes();
}

/**
 * Generate collision bodies.
 * @memberof CollisionMap#
 * @method generateShapes
 */
CollisionMap.prototype.generateShapes = function() {
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

        var polygon = this.tileShapes[grid[i][j] - 1];
        var vs = Array(polygon.length);
        var es = Array(polygon.length);
        for (var p = 0; p < polygon.length; p++) {
          vs[p] = { x: polygon[p].x + x, y: polygon[p].y + y };
        }

        for (var p = 0; p < polygon.length; p++) {
          if (p === polygon.length - 1) {
            es[p] = [vs[p], vs[0], tag, false];
          }
          else {
            es[p] = [vs[p], vs[p + 1], tag, false];
          }

          edges.push(es[p]);
        }
        taggedGroups[tag] = es;
      }
    }
  }

  // Go through all edges and delete all instances of the ones that appear more than once
  var e1, e2, t1, t2, g1, g2, k;
  for (i = edges.length - 1; i >= 0; i--) {
    e1 = edges[i];
    for (j = i - 1; j >= 0; j--) {
      e2 = edges[j];
      if (isEdgeEqual(e1, e2)) {
        // Remove edges
        utils.removeItems(edges, i, 1);
        utils.removeItems(edges, j, 1);

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
          utils.removeItems(edges, p3Idx, 1);
          i -= 1;
          break;
        }
      }
    }
    last_edge_list_size = edges.length;
  }

  var shapes = {};
  for (i = 0; i < edges.length; i++) {
    if (!shapes[edges[i][2]]) {
      shapes[edges[i][2]] = [edges[i]];
    }
    else {
      shapes[edges[i][2]].push(edges[i]);
    }
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
      isStatic: true,
      shape: new physics.Polygon(polygonPoints[i]),
      collisionGroup: this.group,
    });
    this.bodies.push(body);
  }
};

/**
 * Remove collisions.
 * @memberof CollisionMap#
 * @method remove
 */
CollisionMap.prototype.remove = function() {
  for (var i = 0; i < this.bodies.length; i++) {
    this.bodies[i].remove();
  }
  this.bodies.length = 0;
};

/**
 * Add this layer to a scene.
 * @memberof CollisionMap#
 * @method addTo
 */
CollisionMap.prototype.addTo = function(scene) {
  this.scene = scene;

  for (var i = 0; i < this.bodies.length; i++) {
    scene.world.addBody(this.bodies[i]);
  }

  return this;
};

/**
 * @requires engine/core
 * @requires engine/vector
 * @requires engine/physics
 * @requires engine/pixi
 * @requires engine/utils
 * @requires engine/tilemap/decomp
 *
 * @see CollisionMap
 */
module.exports = exports = CollisionMap;
