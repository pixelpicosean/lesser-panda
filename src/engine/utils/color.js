/**
 * Color utility functions.
 *
 * @module engine/utils/color
 */

/**
 * Converts a hex color number to an [R, G, B] array
 *
 * @param {number} hex        Color hex number
 * @param {number[]} [out=[]] Output
 * @return {number[]} An array representing the [R, G, B] of the color.
 */
module.exports.hex2rgb = function(hex, out) {
  out = out || [];

  out[0] = (hex >> 16 & 0xFF) / 255;
  out[1] = (hex >> 8 & 0xFF) / 255;
  out[2] = (hex & 0xFF) / 255;

  return out;
};

/**
 * Converts a hex color number to a string.
 *
 * @param {number} hex  Color hex number
 * @return {string} The color string.
 */
module.exports.hex2string = function(hex) {
  hex = hex.toString(16);
  hex = '000000'.substr(0, 6 - hex.length) + hex;

  return '#' + hex;
};

/**
 * Converts a color as an [R, G, B] array to a hex number
 *
 * @param {number[]} rgb List of numbers representing a color.
 * @return {number} The color number in hex.
 */
module.exports.rgb2hex = function(rgb) {
  return ((rgb[0] * 255 << 16) + (rgb[1] * 255 << 8) + rgb[2] * 255);
};
