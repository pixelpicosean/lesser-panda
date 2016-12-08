'use strict';

/**
 * Number.isFinite
 * Copyright (c) 2014 marlun78
 * MIT License, https://gist.github.com/marlun78/bd0800cf5e8053ba9f83
 *
 * Spec: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isfinite
 */
if (typeof(Number.isFinite) !== 'function') {
  /**
   * `Number.isFinite` polyfill
   * @param  {*}  value Value to check
   * @return {Boolean}  Whether the value is a finite number
   */
  Number.isFinite = function(value) {
    // 1. If Type(number) is not Number, return false.
    if (typeof(value) !== 'number') {
      return false;
    }
    // 2. If number is NaN, +∞, or −∞, return false.
    if (value !== value || value === Infinity || value === -Infinity) {
      return false;
    }
    // 3. Otherwise, return true.
    return true;
  };
}
