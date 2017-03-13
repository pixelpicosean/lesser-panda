/**
 * Math utility functions and constant variables.
 *
 * @module engine/utils/math
 */

/**
 * PI * 2
 * @type {number}
 */
export const PI_2 = Math.PI * 2;

/**
 * Half PI
 * @type {number}
 */
export const HALF_PI = Math.PI / 2;

/**
 * Force a value within the boundaries by clamping `x` to the range `[a, b]`.
 *
 * @param {number} x Target value to clamp
 * @param {number} a Min value
 * @param {number} b Max value
 * @return {number} Clamped value
 */
export function clamp(x, a, b) {
  return (x < a) ? a : ((x > b) ? b : x);
};

/**
 * Bring the value between min and max.
 *
 * Values larger than `max` are wrapped back to `min`
 * and vice-versa.
 *
 * @param {number}  value value to process
 * @param {number}  min lowest valid value
 * @param {number}  max largest valid value
 * @return {number} result
 */
export function wrap(value, min, max) {
  if (value < min) {return max + (value % max);}
  if (value >= max) {return value % max;}
  return value;
};

/**
 * Bring the value between 0 and 2*PI.
 *
 * Valid values for the length of a circle in radians is
 * 2*PI.
 *
 * @param {number}  val value to process
 * @return {number} a value in 0..2*PI interval
 */
export function circWrap(val) {
  return math.wrap(val, 0, math.PI_2);
};
