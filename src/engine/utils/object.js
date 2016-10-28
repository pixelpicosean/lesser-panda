'use strict';

/**
 * Object utility functions.
 *
 * @module engine/utils/object
 */

/**
 * Merge any number of associative arrays into first.
 *
 * All arguments are expected to be associative arrays.
 * If same key appears multiple times the final value
 * will come from last argument that contains it.
 *
 * @return {object} first argument
 *
 * @example
 * merge({ a: { var_1: 1 } }, { a: { var_1: 2 } });
 * // return { a: { var_1: 2 } }
 */
module.exports.merge = function(a) {
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
