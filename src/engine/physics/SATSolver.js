import Vector from 'engine/Vector';
import { BOX, CIRC, POLY } from './const';

/**
 * Response of a collision.
 * An object representing the result of an intersection. Contains:
 * - The two objects participating in the intersection
 * - The vector representing the minimum change necessary to extract the first object
 *   from the second one (as well as a unit vector in that direction and the magnitude
 *   of the overlap)
 * - Whether the first object is entirely inside the second, and vice versa.
 */
class Response {
  constructor() {
    /**
     * The first object in the collision.
     * It will be **self body** when passed to `collide` method.
     * @type {Body}
     */
    this.a = null;
    /**
     * The second object in the collision.
     * @type {Body}
     */
    this.b = null;
    /**
     * Whether the first object is completely inside the second.
     * Self inside another one?
     * @type {boolean}
     */
    this.aInB = true;
    /**
     * Whether the second object is completely inside the first
     * @type {boolean}
     */
    this.bInA = true;
    /**
     * Magnitude of the overlap on the shortest colliding axis
     * @type {number}
     */
    this.overlap = Number.MAX_VALUE;
    /**
     * The shortest colliding axis (unit-vector).
     * This vector points from **self body** to the overlapped one.
     * @type {Vector}
     */
    this.overlapN = new Vector();
    /**
     *  The overlap vector (i.e. overlapN.multiply(overlap, overlap)).
     *  If this vector is subtracted from the position of a,
     *  a and b will no longer be colliding.
     * @type {Vector}
     */
    this.overlapV = new Vector();
  }
  /**
   * Set some values of the response back to their defaults.  Call this between tests if
   * you are going to reuse a single Response object for multiple intersection tests (recommented
   * as it will avoid allcating extra memory)
   * @memberof Response#
   * @return {Response} This for chaining
   */
  clear() {
    this.aInB = true;
    this.bInA = true;
    this.overlap = Number.MAX_VALUE;
    return this;
  }
}

/**
 * Advanced SAT based collision solver.
 *
 * This solver is the best choice when you want to rotate any body or
 * use {@link Tilemap} collision layer.
 *
 * Fore more realistic cases, you need a REAL rigid body physics engine
 * like [p2.js](https://github.com/schteppe/p2.js). Those will be supported in the future(maybe).
 *
 * Set `physics.solver` to `'SAT'` to enable.
 *
 * @class SATSolver
 * @constructor
 */
export default class SATSolver {
  constructor() {
    this.res = new Response();
  }
  /**
   * Hit test a versus b.
   * @memberof SATSolver#
   * @method hitTest
   * @param {Body} a
   * @param {Body} b
   * @return {Boolean} return true, if bodies hit.
   */
  hitTest(a, b) {
    // Clearn reponse instance
    this.res.clear();

    // Convert box shape to polygon
    if (a.shape.type === BOX) {
      let rot = a.shape.rotation;
      a.shape = a.shape.toPolygon();
      a.shape.rotation = rot;
    }
    if (b.shape.type === BOX) {
      let rot = b.shape.rotation;
      b.shape = b.shape.toPolygon();
      b.shape.rotation = rot;
    }

    // Polygon vs polygon
    if (a.shape.type === POLY) {
      if (b.shape.type === POLY) {
        return testPolygonPolygon(a, b, this.res);
      }
      else {
        return testPolygonCircle(a, b, this.res);
      }
    }
    else if (a.shape.type === CIRC) {
      if (b.shape.type === CIRC) {
        return testCircleCircle(a, b, this.res);
      }
      else {
        return testCirclePolygon(a, b, this.res);
      }
    }

    return false;
  }
  /**
   * Apply hit respose to group of overlaping bodies.
   * @memberof SATSolver#
   * @param  {Body} a
   * @param  {Body} b
   * @param  {boolean} AvsB
   * @param  {boolean} BvsA
   */
  hitResponse(a, b, AvsB, BvsA) {
    // Make sure a and b are not reversed
    var uniqueA = (a === this.res.a ? a : b),
      uniqueB = (b === this.res.b ? b : a);
    var responseToA = false, responseToB = false;
    // Check to see which one or two finally get the response
    if (AvsB && !BvsA) {
      responseToA = uniqueA.collide(uniqueB, this.res);
    }
    else if (!AvsB && BvsA) {
      responseToB = uniqueB.collide(uniqueA, this.res);
    }
    else if (AvsB && BvsA) {
      responseToA = uniqueA.collide(uniqueB, this.res);
      responseToB = uniqueB.collide(uniqueA, this.res);
    }

    // Only apply response to A if it wants to
    if (responseToA && !responseToB) {
      uniqueA.position.subtract(this.res.overlapV);
      uniqueA.afterCollide(uniqueB);
    }
    // Only apply response to B if it wants to
    else if (!responseToA && responseToB) {
      uniqueB.position.add(this.res.overlapV);
      uniqueB.afterCollide(uniqueA);
    }
    // Apply response to both A and B
    else if (responseToA && responseToB) {
      this.res.overlapV.multiply(0.5);
      uniqueA.position.subtract(this.res.overlapV);
      uniqueB.position.add(this.res.overlapV);
      uniqueA.afterCollide(uniqueB);
      uniqueB.afterCollide(uniqueA);
    }
  }
}

// Helper Functions ------------------------------------

/**
 * Flattens the specified array of points onto a unit vector axis,
 * resulting in a one dimensional range of the minimum and
 * maximum value on that axis.
 * @private
 * @param {array<Vector>} points The points to flatten
 * @param {Vector} normal The unit vector axis to flatten on
 * @param {array<Number>} result An array.  After calling this function,
 *   result[0] will be the minimum value,
 *   result[1] will be the maximum value
 */
function flattenPointsOn(points, normal, result) {
  var min = +Number.MAX_VALUE;
  var max = -Number.MAX_VALUE;
  var len = points.length;
  for (var i = 0; i < len; i++) {
    // The magnitude of the projection of the point onto the normal
    var dot = points[i].dot(normal);
    if (dot < min) { min = dot; }
    if (dot > max) { max = dot; }
  }
  result[0] = min;
  result[1] = max;
}

/**
 * Check whether two convex polygons are separated by the specified
 * axis (must be a unit vector).
 * @private
 * @param {Vector} aPos The position of the first polygon
 * @param {Vector} bPos The position of the second polygon
 * @param {array<Vector>} aPoints The points in the first polygon
 * @param {array<Vector>} bPoints The points in the second polygon
 * @param {Vector} axis The axis (unit sized) to test against. The points of both polygons
 *   will be projected onto this axis
 * @param {Response=} response A Response object (optional) which will be populated
 *   if the axis is not a separating axis
 * @return {boolean} true if it is a separating axis, false otherwise.  If false,
 *   and a response is passed in, information about how much overlap and
 *   the direction of the overlap will be populated
 */
function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
  var rangeA = T_ARRAYS.pop();
  var rangeB = T_ARRAYS.pop();
  // The magnitude of the offset between the two polygons
  var offsetV = T_VECTORS.pop().copy(bPos).subtract(aPos);
  var projectedOffset = offsetV.dot(axis);
  // Project the polygons onto the axis.
  flattenPointsOn(aPoints, axis, rangeA);
  flattenPointsOn(bPoints, axis, rangeB);
  // Move B's range to its position relative to A.
  rangeB[0] += projectedOffset;
  rangeB[1] += projectedOffset;
  // Check if there is a gap. If there is, this is a separating axis and we can stop
  if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
    T_VECTORS.push(offsetV);
    T_ARRAYS.push(rangeA);
    T_ARRAYS.push(rangeB);
    return true;
  }
  // This is not a separating axis. If we're calculating a response, calculate the overlap.
  if (response) {
    var overlap = 0;
    // A starts further left than B
    if (rangeA[0] < rangeB[0]) {
      response.aInB = false;
      // A ends before B does. We have to pull A out of B
      if (rangeA[1] < rangeB[1]) {
        overlap = rangeA[1] - rangeB[0];
        response.bInA = false;
        // B is fully inside A.  Pick the shortest way out.
      }
      else {
        var option1 = rangeA[1] - rangeB[0];
        var option2 = rangeB[1] - rangeA[0];
        overlap = option1 < option2 ? option1 : -option2;
      }
    // B starts further left than A
    }
    else {
      response.bInA = false;
      // B ends before A ends. We have to push A out of B
      if (rangeA[1] > rangeB[1]) {
        overlap = rangeA[0] - rangeB[1];
        response.aInB = false;
      // A is fully inside B.  Pick the shortest way out.
      }
      else {
        var option1 = rangeA[1] - rangeB[0];
        var option2 = rangeB[1] - rangeA[0];
        overlap = option1 < option2 ? option1 : -option2;
      }
    }
    // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
    var absOverlap = Math.abs(overlap);
    if (absOverlap < response.overlap) {
      response.overlap = absOverlap;
      response.overlapN.copy(axis);
      if (overlap < 0) {
        response.overlapN.reverse();
      }
    }
  }
  T_VECTORS.push(offsetV);
  T_ARRAYS.push(rangeA);
  T_ARRAYS.push(rangeB);
  return false;
}

/**
 * Calculates which Vornoi region a point is on a line segment.
 * It is assumed that both the line and the point are relative to `(0,0)`
 *            |       (0)      |
 *     (-1)  [S]--------------[E]  (1)
 *            |       (0)      |
 *
 * @private
 * @param {Vector} line The line segment
 * @param {Vector} point The point
 * @return {number} LEFT_VORNOI_REGION (-1) if it is the left region,
 *         MIDDLE_VORNOI_REGION (0) if it is the middle region,
 *         RIGHT_VORNOI_REGION (1) if it is the right region
 */
function vornoiRegion(line, point) {
  var len2 = line.squaredLength();
  var dp = point.dot(line);
  // If the point is beyond the start of the line, it is in the
  // left vornoi region.
  if (dp < 0) { return LEFT_VORNOI_REGION; }
  // If the point is beyond the end of the line, it is in the
  // right vornoi region.
  else if (dp > len2) { return RIGHT_VORNOI_REGION; }
  // Otherwise, it's in the middle one.
  else { return MIDDLE_VORNOI_REGION; }
}
// Constants for Vornoi regions
var LEFT_VORNOI_REGION = -1;
var MIDDLE_VORNOI_REGION = 0;
var RIGHT_VORNOI_REGION = 1;

// Collision Tests ---------------------------------------

/**
 * Check if two circles collide.
 * @private
 * @param {Body} a The first circle body
 * @param {Body} b The second circle body
 * @param {Response=} response Response object (optional) that will be populated if
 *   the circles intersect
 * @return {boolean} true if the circles intersect, false if they don't
 */
function testCircleCircle(a, b, response) {
  // Check if the distance between the centers of the two
  // circles is greater than their combined radius.
  var differenceV = T_VECTORS.pop().copy(b.position).subtract(a.position);
  var totalRadius = a.shape.radius + b.shape.radius;
  var totalRadiusSq = totalRadius * totalRadius;
  var distanceSq = differenceV.squaredLength();
  // If the distance is bigger than the combined radius, they don't intersect.
  if (distanceSq > totalRadiusSq) {
    T_VECTORS.push(differenceV);
    return false;
  }
  // They intersect.  If we're calculating a response, calculate the overlap.
  if (response) {
    var dist = Math.sqrt(distanceSq);
    response.a = a;
    response.b = b;
    response.overlap = totalRadius - dist;
    response.overlapN.copy(differenceV.normalize());
    response.overlapV.copy(differenceV).multiply(response.overlap);
    response.aInB = a.shape.radius <= b.shape.radius && dist <= b.shape.radius - a.shape.radius;
    response.bInA = b.shape.radius <= a.shape.radius && dist <= a.shape.radius - b.shape.radius;
  }
  T_VECTORS.push(differenceV);
  return true;
}

/**
 * Check if a polygon and a circle collide.
 * @private
 * @param {Polygon} polygon The polygon
 * @param {Circle} circle The circle
 * @param {Response=} response Response object (optional) that will be populated if
 *   they interset
 * @return {boolean} true if they intersect, false if they don't
 */
function testPolygonCircle(polygon, circle, response) {
  // Get the position of the circle relative to the polygon.
  var circlePos = T_VECTORS.pop().copy(circle.position).subtract(polygon.position);
  var radius = circle.shape.radius;
  var radius2 = radius * radius;
  var points = polygon.shape.calcPoints;
  var len = points.length;
  var edge = T_VECTORS.pop();
  var point = T_VECTORS.pop();

  // For each edge in the polygon:
  for (var i = 0; i < len; i++) {
    var next = i === len - 1 ? 0 : i + 1;
    var prev = i === 0 ? len - 1 : i - 1;
    var overlap = 0;
    var overlapN = null;

    // Get the edge.
    edge.copy(polygon.shape.edges[i]);
    // Calculate the center of the circle relative to the starting point of the edge.
    point.copy(circlePos).subtract(points[i]);

    // If the distance between the center of the circle and the point
    // is bigger than the radius, the polygon is definitely not fully in
    // the circle.
    if (response && point.squaredLength() > radius2) {
      response.aInB = false;
    }

    // Calculate which Vornoi region the center of the circle is in.
    var region = vornoiRegion(edge, point);
    // If it's the left region:
    if (region === LEFT_VORNOI_REGION) {
      // We need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge.
      edge.copy(polygon.shape.edges[prev]);
      // Calculate the center of the circle relative the starting point of the previous edge
      var point2 = T_VECTORS.pop().copy(circlePos).subtract(points[prev]);
      region = vornoiRegion(edge, point2);
      if (region === RIGHT_VORNOI_REGION) {
        // It's in the region we want.  Check if the circle intersects the point.
        var dist = point.length();
        if (dist > radius) {
          // No intersection
          T_VECTORS.push(circlePos);
          T_VECTORS.push(edge);
          T_VECTORS.push(point);
          T_VECTORS.push(point2);
          return false;
        }
        else if (response) {
          // It intersects, calculate the overlap.
          response.bInA = false;
          overlapN = point.normalize();
          overlap = radius - dist;
        }
      }
      T_VECTORS.push(point2);
    }
    // If it's the right region:
    else if (region === RIGHT_VORNOI_REGION) {
      // We need to make sure we're in the left region on the next edge
      edge.copy(polygon.shape.edges[next]);
      // Calculate the center of the circle relative to the starting point of the next edge.
      point.copy(circlePos).subtract(points[next]);
      region = vornoiRegion(edge, point);
      if (region === LEFT_VORNOI_REGION) {
        // It's in the region we want.  Check if the circle intersects the point.
        var dist = point.length();
        if (dist > radius) {
          // No intersection
          T_VECTORS.push(circlePos);
          T_VECTORS.push(edge);
          T_VECTORS.push(point);
          return false;
        }
        else if (response) {
          // It intersects, calculate the overlap.
          response.bInA = false;
          overlapN = point.normalize();
          overlap = radius - dist;
        }
      }
    }
    // Otherwise, it's the middle region:
    else {
      // Need to check if the circle is intersecting the edge,
      // Change the edge into its "edge normal".
      var normal = edge.perp().normalize();
      // Find the perpendicular distance between the center of the
      // circle and the edge.
      var dist = point.dot(normal);
      var distAbs = Math.abs(dist);
      // If the circle is on the outside of the edge, there is no intersection.
      if (dist > 0 && distAbs > radius) {
        // No intersection
        T_VECTORS.push(circlePos);
        T_VECTORS.push(normal);
        T_VECTORS.push(point);
        return false;
      }
      else if (response) {
        // It intersects, calculate the overlap.
        overlapN = normal;
        overlap = radius - dist;
        // If the center of the circle is on the outside of the edge, or part of the
        // circle is on the outside, the circle is not fully inside the polygon.
        if (dist >= 0 || overlap < 2 * radius) {
          response.bInA = false;
        }
      }
    }

    // If this is the smallest overlap we've seen, keep it.
    // (overlapN may be null if the circle was in the wrong Vornoi region).
    if (overlapN && response && Math.abs(overlap) < Math.abs(response.overlap)) {
      response.overlap = overlap;
      response.overlapN.copy(overlapN);
    }
  }

  // Calculate the final overlap vector - based on the smallest overlap.
  if (response) {
    response.a = polygon;
    response.b = circle;
    response.overlapV.copy(response.overlapN).multiply(response.overlap);
  }
  T_VECTORS.push(circlePos);
  T_VECTORS.push(edge);
  T_VECTORS.push(point);
  return true;
}

/**
 * Check if a circle and a polygon collide.
 *
 * **NOTE:** This is slightly less efficient than polygonCircle as it just
 * runs polygonCircle and reverses everything at the end.
 *
 * @private
 *
 * @param {Circle} circle The circle
 * @param {Polygon} polygon The polygon
 * @param {Response=} response Response object (optional) that will be populated if
 *   they interset
 * @return {boolean} true if they intersect, false if they don't
 */
function testCirclePolygon(circle, polygon, response) {
  // Test the polygon against the circle.
  var result = testPolygonCircle(polygon, circle, response);
  if (result && response) {
    // Swap A and B in the response.
    var a = response.a;
    var aInB = response.aInB;
    response.overlapN.reverse();
    response.overlapV.reverse();
    response.a = response.b;
    response.b = a;
    response.aInB = response.bInA;
    response.bInA = aInB;
  }
  return result;
}

/**
 * Checks whether polygons collide.
 * @private
 * @param {Polygon} a The first polygon
 * @param {Polygon} b The second polygon
 * @param {Response=} response Response object (optional) that will be populated if
 *   they interset
 * @return {boolean} true if they intersect, false if they don't
 */
function testPolygonPolygon(a, b, response) {
  var aPoints = a.shape.calcPoints;
  var aLen = aPoints.length;
  var bPoints = b.shape.calcPoints;
  var bLen = bPoints.length;
  // If any of the edge normals of A is a separating axis, no intersection.
  for (var i = 0; i < aLen; i++) {
    if (isSeparatingAxis(a.position, b.position, aPoints, bPoints, a.shape.normals[i], response)) {
      return false;
    }
  }
  // If any of the edge normals of B is a separating axis, no intersection.
  for (var i = 0;i < bLen; i++) {
    if (isSeparatingAxis(a.position, b.position, aPoints, bPoints, b.shape.normals[i], response)) {
      return false;
    }
  }
  // Since none of the edge normals of A or B are a separating axis, there is an intersection
  // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
  // final overlap vector.
  if (response) {
    response.a = a;
    response.b = b;
    response.overlapV.copy(response.overlapN).multiply(response.overlap);
  }
  return true;
}

// Object Pools -----------------------------------------

let i = 0;
/**
 * A pool of `Vector` objects that are used in calculations to avoid
 * allocating memory.
 * @type {array<Vector>}
 * @private
 */
const T_VECTORS = new Array(10);
for (i = 0; i < 10; i++) { T_VECTORS[i] = new Vector(); }

/**
 * A pool of arrays of numbers used in calculations to avoid allocating
 * memory.
 * @type {array<array<number>>}
 * @private
 */
const T_ARRAYS = new Array(5);
for (i = 0; i < 5; i++) { T_ARRAYS[i] = []; }

/**
 * Temporary response used for polygon hit detection.
 * @type {Response}
 * @private
 */
const T_RESPONSE = new Response();
