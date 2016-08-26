'use strict';

/**
 * Level utilty functions.
 *
 * @module engine/level/utils
 */

/**
 * Convert a 1D array to 2D.
 * @param  {array<array>} arr Array to convert.
 * @param  {number} w         How many elements in a row.
 * @param  {number} h         How many elements in a column.
 * @return {array}
 */
module.exports.lift = function lift(arr, w, h) {
  var r, q, row, res = new Array(h);
  for (r = 0; r < h; r++) {
    row = new Array(w);
    for (q = 0; q < w; q++) {
      row[q] = arr[w * r + q];
    }
    res[r] = row;
  }
  return res;
};

module.exports.isClockwise = function isClockwise(vertices) {
  var area = 0, i, v1, v2;
  for (i = 0; i < vertices.length; i++) {
    v1 = vertices[i];
    v2 = vertices[(i + 1) % vertices.length];
    area += (v2.x - v1.x) * (v2.y + v1.y);
  }

  return area < 0;
}
