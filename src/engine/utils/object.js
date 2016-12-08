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
 * @param {Object} a Objects to merge
 * @return {object} first argument
 *
 * @example
 * mergeMultiple({ a: { var_1: 1 } }, { a: { var_1: 2 } });
 * // return { a: { var_1: 2 } }
 */
module.exports.mergeMultiple = function mergeMultiple(a) {
  var i = 0, b, key, value;
  for (i = 1; i < arguments.length; i++) {
    b = arguments[i];

    for (key in b) {
      value = b[key];

      if (typeof a[key] !== 'undefined') {
        if (typeof a[key] === 'object') {
          mergeMultiple(a[key], value);
        }
        else {
          a[key] = value;
        }
      }
      else {
        a[key] = value;
      }
    }
  }
  return a;
};

/**
 * Deeply merge an object into the another.
 *
 * @param {Object} original Target object to merge to
 * @param {Object} extended Object to merge to the first one
 * @return {Object} First object
 *
 * @example
 * merge({ a: { var_1: 1 } }, { a: { var_1: 2 } });
 * // return { a: { var_1: 2 } }
 */
module.exports.merge = function merge(original, extended) {
  for (var key in extended) {
    var ext = extended[key];
    var extType = typeof ext;
    if (extType !== 'undefined') {
      if (extType !== 'object') {
        // ugly, perhaps there is a better way?
        if (extType === 'string') {
          if (ext === 'true') {
            ext = true;
          }
          else if (ext === 'false') {
            ext = false;
          }
        }

        original[key] = ext;
      }
      else {
        if (!original[key] || typeof(original[key]) !== 'object') {
          original[key] = Array.isArray(ext) ? [] : {};
        }
        merge(original[key], ext);
      }
    }
  }

  return original;
};
