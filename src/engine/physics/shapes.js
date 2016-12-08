const { BOX, CIRC } = require('./const');

/**
 * Box shape for physic body.
 * @class Box
 */
class Box {
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
     * Type of this shape, should always be `BOX`.
     * @type {number}
     * @const
     */
    this.type = BOX;
  }
}

/**
 * Circle shape for physic body.
 *
 * @class Circle
 */
class Circle {
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

module.exports = {
  Box,
  Circle,
};
