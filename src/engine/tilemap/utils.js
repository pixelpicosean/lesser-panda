/**
 * Tilemap utilty functions.
 *
 * @module engine/tilemap/utils
 */

/**
 * Lift an 2D array to 1D. (is that even a lifting?!)
 * @param  {array<array>} arr 2D array.
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
