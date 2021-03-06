import Rectangle from './Rectangle';
import { SHAPES } from '../../const';

/**
 * The Circle object can be used to specify a hit area for displayObjects
 *
 * @class
 */
export default class Circle {
  /**
   * @constructor
   * @param {number} x      The X coordinate of the center of this circle
   * @param {number} y      The Y coordinate of the center of this circle
   * @param {number} radius The radius of the circle
   */
  constructor(x, y, radius) {
    /**
     * @member {number}
     * @default 0
     */
    this.x = x || 0;

    /**
     * @member {number}
     * @default 0
     */
    this.y = y || 0;

    /**
     * @member {number}
     * @default 0
     */
    this.radius = radius || 0;

    /**
     * The type of the object, mainly used to avoid `instanceof` checks
     *
     * @member {number}
     */
    this.type = SHAPES.CIRC;
  }

  /**
   * Creates a clone of this Circle instance
   *
   * @return {Circle} a copy of the Circle
   */
  clone() {
    return new Circle(this.x, this.y, this.radius);
  }

  /**
   * Checks whether the x and y coordinates given are contained within this circle
   *
   * @param {number} x The X coordinate of the point to test
   * @param {number} y The Y coordinate of the point to test
   * @return {boolean} Whether the x/y coordinates are within this Circle
   */
  contains(x, y) {
    if (this.radius <= 0) {
      return false;
    }

    var dx = (this.x - x),
      dy = (this.y - y),
      r2 = this.radius * this.radius;

    dx *= dx;
    dy *= dy;

    return (dx + dy <= r2);
  }

  /**
  * Returns the framing rectangle of the circle as a Rectangle object
  *
  * @return {Rectangle} the framing rectangle
  */
  getBounds() {
    return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
  }
}
