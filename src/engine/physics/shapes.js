import Vector from 'engine/Vector';
import { BOX, CIRC, POLY } from './const';

/**
 * Box shape for physic body.
 * @class Box
 */
export class Box {
  /**
   * @constructor
   * @param {number} [width]  Width of this box
   * @param {number} [height] Height of this box
   */
  constructor(width = 8, height = 8) {
    /**
      Width of rectangle.
      @property {Number} width
      @default 8
    **/
    this.width = width;
    /**
     * Height of rectangle.
     * @property {Number} height
     * @default 8
     */
    this.height = height;
    /**
     * Rotation
     * @property {Number} rotation
     * @default 0
     */
    this.rotation = 0;

    /**
     * Type of this shape, should always be `BOX`.
     * @type {number}
     * @const
     */
    this.type = BOX;
  }

  toPolygon() {
    const halfWidth = this.width * 0.5;
    const halfHeight = this.height * 0.5;
    return new Polygon([
      new Vector(-halfWidth, -halfHeight), new Vector(halfWidth, -halfHeight),
      new Vector(halfWidth, halfHeight), new Vector(-halfWidth, halfHeight),
    ]);
  }
}

/**
 * Circle shape for physic body.
 *
 * @class Circle
 */
export class Circle {
  /**
   * @constructor
   * @param {number} [radius]   Radius of this circle
   */
  constructor(radius = 4) {
    /**
     * Radius of circle.
     * @property {number} radius
     * @default 4
     */
    this.radius = radius;
    /**
     * Rotation
     * @property {Number} rotation
     * @default 0
     */
    this.rotation = 0;

    /**
     * Type of this shape, should always be `CIRC`.
     * @type {number}
     * @const
     */
    this.type = CIRC;
  }
  /**
   * Width of the circle shape.
   * @memberof Circle#
   * @type {number}
   * @readonly
   */
  get width() {
    return this.radius * 2;
  }
  /**
   * Height of the circle shape.
   * @memberof Circle#
   * @type {number}
   * @readonly
   */
  get height() {
    return this.radius * 2;
  }
}

/**
 * Polygon collision shape.
 * @class Polygon
 * @constructor
 * @param {array<Vector>} points Vertices that define the polygon.
 */
export class Polygon {
  constructor(points) {
    /**
     * Type of this shape, should always be `CIRC`.
     * @type {number}
     * @const
     */
    this.type = POLY;

    /**
     * Width of this polygon.
     * @type {number}
     */
    this.width = 1;
    /**
     * Height of this polygon.
     * @type {number}
     */
    this.height = 1;

    /**
     * Vertices.
     * @type {array<Vector>}
     */
    this.points = [];
    /**
     * Vertices cache.
     * @private
     * @type {array<Vector>}
     */
    this.calcPoints = [];

    /**
     * Edges of the polygon.
     * @private
     * @type {array<Vector>}
     */
    this.edges = [];
    /**
     * Normals of edges.
     * @private
     * @type {array<Vector>}
     */
    this.normals = [];

    /**
     * Offset of the vertices to the center.
     * @type {Vector}
     */
    this.offset = new Vector();

    this._rotation = 0;

    this.setPoints(points || []);
  }

  /**
   * Rotation of this polygon.
   * @memberof Polygon#
   * @type {number}
   */
  get rotation() {
    return this._rotation;
  }
  set rotation(rotation) {
    this._rotation = rotation;
    this._recalc();
  }

  /**
   * Set the points of the polygon.
   * @memberof Polygon#
   * @param {Array<Vector>=} points An array of vectors representing the points in the polygon,
   *   in clockwise order
   * @return {Polygon} This for chaining
   */
  setPoints(points) {
    // Only re-allocate if this is a new polygon or the number of points has changed.
    var lengthChanged = !this.points || this.points.length !== points.length;
    if (lengthChanged) {
      var calcPoints = this.calcPoints = [];
      var edges = this.edges = [];
      var normals = this.normals = [];
      // Allocate the vector arrays for the calculated properties
      for (var i = 0, len = points.length; i < len; i++) {
        calcPoints.push(new Vector());
        edges.push(new Vector());
        normals.push(new Vector());
      }
    }
    this.points = points;
    this._recalc();
    return this;
  }
  /**
   * Set the current offset to apply to the `points` before applying the `rotation` rotation.
   * @param {Vector} offset The new offset vector
   * @return {Polygon} This for chaining
   */
  setOffset(offset) {
    this.offset = offset;
    this._recalc();
    return this;
  }
  /**Rotates this polygon counter-clockwise around the origin of *its local coordinate system* (i.e. `pos`).
   * Note: This changes the **original** points (so any `rotation` will be applied on top of this rotation).
   * @memberof Polygon#
   * @param {number} rotation The rotation to rotate (in radians)
   * @return {Polygon} This for chaining
   */
  rotate(rotation) {
    var points = this.points;
    for (var i = 0, len = points.length; i < len; i++) {
      points[i].rotate(rotation);
    }
    this._recalc();
    return this;
  }
  /**
   * Translates the points of this polygon by a specified amount relative to the origin of *its own coordinate
   * system* (i.e. `body.position`)
   * This is most useful to change the "center point" of a polygon. If you just want to move the whole polygon, change
   * the coordinates of `body.position`.
   * Note: This changes the **original** points (so any `offset` will be applied on top of this translation)
   * @memberof Polygon#
   * @param {number} x The horizontal amount to translate
   * @param {number} y The vertical amount to translate
   * @return {Polygon} This for chaining
   */
  translate(x, y) {
    var points = this.points;
    for (var i = 0, len = points.length; i < len; i++) {
      points[i].x += x;
      points[i].y += y;
    }
    this._recalc();
    return this;
  }
  /**
   * Computes the calculated collision polygon. Applies the `rotation` and `offset` to the original points then recalculates the
   * edges and normals of the collision polygon.
   * @memberof Polygon#
   * @return {Polygon} This for chaining
   */
  _recalc() {
    // Calculated points - this is what is used for underlying collisions and takes into account
    // the rotation/offset set on the polygon.
    var calcPoints = this.calcPoints;
    // The edges here are the direction of the `n`th edge of the polygon, relative to
    // the `n`th point. If you want to draw a given edge from the edge value, you must
    // first translate to the position of the starting point.
    var edges = this.edges;
    // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
    // to the position of the `n`th point. If you want to draw an edge normal, you must first
    // translate to the position of the starting point.
    var normals = this.normals;
    // Copy the original points array and apply the offset/rotation
    var points = this.points;
    var offset = this.offset;
    var rotation = this._rotation;
    var len = points.length;
    var i;
    var left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    for (i = 0; i < len; i++) {
      var calcPoint = calcPoints[i].copy(points[i]);
      calcPoint.x += offset.x;
      calcPoint.y += offset.y;
      if (rotation !== 0) {
        calcPoint.rotate(rotation);
      }

      // Update AABB info
      left = Math.min(left, calcPoint.x);
      top = Math.min(top, calcPoint.y);
      right = Math.max(right, calcPoint.x);
      bottom = Math.max(bottom, calcPoint.y);
    }

    // Calculate the edges/normals
    for (i = 0; i < len; i++) {
      var p1 = calcPoints[i];
      var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
      var e = edges[i].copy(p2).subtract(p1);
      normals[i].copy(e).perp().normalize();
    }

    // Calculate size
    this.width = right - left;
    this.height = bottom - top;

    return this;
  }
}
