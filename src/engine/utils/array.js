/**
 * Array utility functions.
 *
 * @module engine/utils/array
 */

/**
 * Remove items of an arry
 *
 * @param {array} arr The target array
 * @param {number} startIdx The index to begin removing from (inclusive)
 * @param {number} removeCount How many items to remove
 */
module.exports.removeItems = function(arr, startIdx, removeCount) {
  let i, len, length = arr.length;

  if (startIdx >= length || removeCount === 0) {
    return;
  }

  removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount);
  for (i = startIdx, len = length - removeCount; i < len; ++i) {
    arr[i] = arr[i + removeCount];
  }

  arr.length = len;
};
