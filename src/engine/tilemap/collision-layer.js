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

function CollisionLayer(def) {
  this.tilesize = def.tilesize;
  this.width = def.width;
  this.height = def.height;
  this.data = utils.lift(def.data, this.width, this.height);

  this.generateShapes();
}
CollisionLayer.prototype.generateShapes = function generateShapes() {
  var i, j;

  // Create edges
  var edges = [];

  var mx = this.tilesize, my = this.tilesize;
  var x, y, v0, v1, v2, v3, grid = this.data;
  for (i = 0; i < this.height; i++) {
    for (j = 0; j < this.width; j++) {
      if (grid[i][j] !== 0) {
        x = mx * j; // left
        y = my * i; // top
        v0 = { x: x,      y: y + my }; // left-bottom
        v1 = { x: x,      y: y      }; // left-top
        v2 = { x: x + mx, y: y      }; // right-top
        v3 = { x: x + mx, y: y + my }; // right-bottom
        edges.push([v0, v1]);
        edges.push([v1, v2]);
        edges.push([v2, v3]);
        edges.push([v3, v0]);
      }
    }
  }
  console.log('[start]edges: ' + edges.length);

  function isEdgeEqual(e1, e2) {
    var d1 = (e1[0].x - e2[1].x)*(e1[0].x - e2[1].x) + (e1[0].y - e2[1].y)*(e1[0].y - e2[1].y);
    var d2 = (e2[0].x - e1[1].x)*(e2[0].x - e1[1].x) + (e2[0].y - e1[1].y)*(e2[0].y - e1[1].y);
    if (d1 < 0.25 && d2 < 0.25) return true;
  }

  // Go through all edges and delete all instances of the ones that appear more than once
  var e1, e2;
  for (i = edges.length - 1; i >= 0; i--) {
    e1 = edges[i];
    for (j = i - 1; j >= 0; j--) {
      e2 = edges[j];
      if (isEdgeEqual(e1, e2)) {
        utilsG.removeItems(edges, i, 1);
        utilsG.removeItems(edges, j, 1);
      }
    }
  }
  console.log('[remove duplicated edges]edges: ' + edges.length);

  function findEdge(edge_list, point) {
    for (var i = 0; i < edge_list.length; i++) {
      var edge = edge_list[i];
      var d = (edge[0].x - point.x)*(edge[0].x - point.x) + (edge[0].y - point.y)*(edge[0].y - point.y);
      if (d < 0.25) return i;
    }
    return -1;
  }

  // Remove extra edges
  var edge_list_size = edges.length, last_edge_list_size = 0;
  while (edge_list_size !== last_edge_list_size) {
    edge_list_size = edges.length;
    for (i = 0; i < edges.length; i++) {
      edge = edges[i];
      var p1 = edge[0];
      var p2 = edge[1];
      var p3Idx = findEdge(edges, p2);
      var p3 = null;
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
  console.log('[simplify vertices]edges: ' + edges.length);

  console.log(edges.slice());

  // Tag groups
  function edgeTag(tag, edge) {
    edge.tag = tag;
    var next_edge = findEdge(edges, edge[1]);
    while ((next_edge >= 0) && (edges[next_edge].tag == undefined)) {
      edges[next_edge].tag = tag;
      next_edge = findEdge(edges, edges[next_edge][1]);
    }
  }

  var current_tag = 0;
  for (i = 0; i < edges.length; i++) {
    edge = edges[i];
    if (edge.tag == undefined) {
      edgeTag(current_tag, edge);
      current_tag += 1;
    }
  }
  console.log('tags: %d', current_tag);

  function getTagShape(edges, tag) {
    var temp_edges = edges.filter(function(value) { return value.tag === tag });
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

  var shapes = [];
  for (i = 0; i < current_tag; i++) {
    shapes.push(getTagShape(edges, i));
  }

  // Recreate edges from shapes(edges are now sorted)
  edges.length = 0;
  var shape, p1, p2;
  for (i = 0; i < shapes.length; i++) {
    shape = shapes[i];
    console.log(shape);
    for (j = 0; j < shape.length - 1; j++) {
      p1 = shape[j];
      p2 = shape[j + 1];
      edges.push([
        { x: p1[0], y: p1[1] },
        { x: p2[0], y: p2[1] },
      ]);
      console.log('edge[%d][%d]', j, j+1);
    }
    edges.push([
      { x: p2[0], y: p2[1] },
      { x: shape[0][0], y: shape[0][1] },
    ]);
    console.log('edge[%d][%d]', j, 0);
  }
  console.log(edges.slice());

  // Figure out which tags are holes
  var hole_tags = [];
  for (i = 0; i < shapes.length; i++) {
    var s1 = shapes[i];
    for (j = 0; j < shapes.length; j++) {
      var s2 = shapes[j];
      if (i !== j) {
        if (polygonInPolygon(s2, s1)) {
          hole_tags.push(j);
        }
      }
    }
  }
  hole_tags = unique(hole_tags);

  // Find zero width points
  var holes = [];
  for (i = 0; i < shapes.length; i++) {
    shape = shapes[i];
    if (hole_tags.indexOf(i) > -1) {
      holes.push({ shape: shape.slice(), tag: i });
    }
  }
  console.log(holes.length + ' holes');

  var all_points = [], shape;
  for (i = 0; i < shapes.length; i++) {
    shape = shapes[i];
    var points = shape.slice();
    for (j = 0; j < points.length; j++) {
      all_points.push({ point: points[j][0], tag: i });
      all_points.push({ point: points[j][1], tag: i });
    }
  }
  console.log(all_points.length + ' points');

  var zero_width_points = [];
  for (i = 0; i < holes.length; i++) {
    shape = holes[i];
    var min_d = 10000, min_i = 0, min_j = 0;
    for (i = 0; i < shape.shape.length; i++) {
      for (j = 0; j < all_points.length; j += 2) {
        if (all_points[j].tag !== shape.tag) {
          var d = distance(shape.shape[i][0], shape.shape[i][1], all_points[j].point, all_points[j+1].point);
          if (d < min_d) {
            min_d = d;
            min_i = i;
            min_j = j;
          }
        }
      }
    }
    zero_width_points.push({ x: shape.shape[min_i][0], y: shape.shape[min_i][1] });
    zero_width_points.push({ x: all_points[min_j].point, y: all_points[min_j+1].point });
  }
  console.log(zero_width_points.length + ' zero_width_points');

  function getTileValue(x, y) {
    var i = Math.floor(y/my)+1, j = Math.floor(x/mx)+1;
    return grid[i][j];
  }

  // Make zero width channels
  var additional_edges = [];
  for (i = 0; i < zero_width_points.length; i += 2) {
    var hole_point = zero_width_points[i];
    var out_point = zero_width_points[i+1];
    var mid_point = { x: (hole_point.x + out_point.x)/2, y: (hole_point.y + out_point.y)/2 };
    if (getTileValue(mid_point.x, mid_point.y) !== 0) {
      var out_edge = [Object.assign({}, hole_point), Object.assign({}, out_point)];
      var in_edge = [Object.assign({}, out_point), Object.assign({}, hole_point)];
      additional_edges.push(out_edge);
      additional_edges.push(in_edge);
    }
  }
  for (i = 0; i < additional_edges.length; i++) {
    edges.push(additional_edges[i]);
  }
  console.log(additional_edges.length + ' zero width edges');

  function findEdges(edge_list, point) {
    var edges = [];
    for (var i = 0; i < edge_list.length; i++) {
      edge = edge_list[i];
      var d = (edge[0].x - point.x)*(edge[0].x - point.x) + (edge[0].y - point.y)*(edge[0].y - point.y);
      if (d < 0.25) edges.push(i);
    }
    return edges;
  }

  function isPointEqual(p1, p2) {
    var d = (p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y);
    return (d < 0.25);
  }

  // Define shape's vertices from edges
  var vertices = [];
  var edge = edges[0];
  var shape_n = 0;
  var idx = 0;
  while (edges.length > 0) {
    vertices[shape_n] = [];
    idx = 0;
    var edge = null, next_edge = null, ne_ids = null;
    for (var k = 0; k < edges.length; k++) {
      console.log('e: (%d, %d)-(%d, %d)', edges[k][0].x, edges[k][0].y, edges[k][1].x, edges[k][1].y);
    }
    do {
      edge = edges[idx];
      // console.log(edge);
      var x = edge[0].x, y = edge[0].y;
      vertices[shape_n].push(edge[0].x);
      vertices[shape_n].push(edge[0].y);
      utilsG.removeItems(edges, idx, 1);
      ne_ids = findEdges(edges, edge[1]);
      console.log('p(%d, %d)', x, y);
      if (ne_ids.length > 0) {
        console.log('ne: (%d, %d)-(%d, %d)', edges[ne_ids[0]][0].x, edges[ne_ids[0]][0].y, edges[ne_ids[0]][1].x, edges[ne_ids[0]][1].y);
      }
      else {
        console.log('ne: .............');
      }
      var found = false;
      for (i = 0; i < ne_ids.length; i++) {
        var id = ne_ids[i];
        if (!isPointEqual(edges[id][1], edge[0]) && (edges[id].tag == undefined)) {
          idx = id;
          found = true;
          break;
        }
      }
      if (!found) {
        for (i = 0; i < ne_ids.length; i++) {
          var id = ne_ids[i];
          if (!isPointEqual(edges[id][1], edge[0]) && (edges[id].tag != undefined)) {
            idx = id;
            break;
          }
        }
      }
    }
    while (ne_ids.length > 0);
    shape_n += 1;
  }
  console.log(shape_n + ' shapes are constructed');
  console.log(vertices);

  // Create solids
};

module.exports = exports = CollisionLayer;
