/**
 * Utility functions and constant variables
 *
 * Some utils come from [playground] and [supermix]
 */

// Math

exports.PI_2 = Math.PI * 2;
exports.PI_HALF = Math.PI * 0.5;

/**
 * Force a value within the boundaries by clamping `x` to the range `[a, b]`.
 *
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
exports.clamp = function clamp(x, a, b) {
  return (x < a) ? a : ((x > b) ? b : x);
};

/**
 * Bring the value between min and max.
 *
 * Values larger than `max` are wrapped back to `min`
 * and vice-versa.
 *
 * @param {Number}  value value to process
 * @param {Number}  min lowest valid value
 * @param {Number}  max largest valid value
 * @return {Number} result
 */
exports.wrap = function wrap(value, min, max) {
  if (value < min) return max + (value % max);
  if (value >= max) return value % max;
  return value;
};

/**
 * Bring the value between 0 and 2*PI.
 *
 * Valid values for the length of a circle in radians is
 * 2*PI.
 *
 * @param {Number}  val value to process
 * @return {Number} a value in 0..2*PI interval
 */
exports.circWrap = function circWrap(val) {
  return wrap(val, 0, PI_2);
};

/**
 * Converts a hex color number to an [R, G, B] array
 *
 * @param hex {Number}
 * @param  {Number[]} [out=[]]
 * @return {Number[]} An array representing the [R, G, B] of the color.
 */
exports.hex2rgb = function hex2rgb(hex, out) {
  out = out || [];

  out[0] = (hex >> 16 & 0xFF) / 255;
  out[1] = (hex >> 8 & 0xFF) / 255;
  out[2] = (hex & 0xFF) / 255;

  return out;
};

/**
 * Converts a hex color number to a string.
 *
 * @param hex {Number}
 * @return {String} The string color.
 */
exports.hex2string = function hex2string(hex) {
  hex = hex.toString(16);
  hex = '000000'.substr(0, 6 - hex.length) + hex;

  return '#' + hex;
};

/**
 * Converts a color as an [R, G, B] array to a hex number
 *
 * @param rgb {Number[]}
 * @return {Number} The color number
 */
exports.rgb2hex = function rgb2hex(rgb) {
  return ((rgb[0]*255 << 16) + (rgb[1]*255 << 8) + rgb[2]*255);
};

// Object

/**
 * Merge any number of associative arrays into first.
 *
 * All arguments are expected to be associative arrays.
 * If same key appears multiple times the final value
 * will come from last argument that contains it.
 *
 * @returns first argument
 *
 * Examples:
 *
 *     merge({ a: { var_1: 1 } }, { a: { var_1: 2 } });
 *     // returns { a: { var_1: 2 } }
 */
exports.merge = function merge(a) {
  var a = 0, b, key, value;
  for (i = 1; i < arguments.length; i++) {
    b = arguments[i];

    for (key in b) {
      value = b[key];

      if (typeof a[key] !== 'undefined') {
        if (typeof a[key] === 'object')
          this.merge(a[key], value);
        else
          a[key] = value;
      }
      else {
        a[key] = value;
      }
    }
  }
  return a;
};

// Array

/**
 * Remove items of an arry
 *
 * @param {Array} arr The target array
 * @param {Number} startIdx The index to begin removing from (inclusive)
 * @param {Number} removeCount How many items to remove
 */
exports.removeItems = function removeItems(arr, startIdx, removeCount) {
  var length = arr.length;

  if (startIdx >= length || removeCount === 0) {
    return;
  }

  removeCount = (startIdx+removeCount > length ? length-startIdx : removeCount);
  for (var i = startIdx, len = length-removeCount; i < len; ++i) {
    arr[i] = arr[i + removeCount];
  }

  arr.length = len;
};
