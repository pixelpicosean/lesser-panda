'use strict';

var config = require('game/config').default;

/**
 * Local storage wrapper.
 * No need to create instance, an instance is exported as default.
 *
 * @class Storage
 * @constructor
 *
 * @param {object} config Settings from `game/config`.
 */
function Storage(config) {
  /**
   * Namespace to save data to.
   * @type {string}
   */
  this.id = config.id;
  /**
   * Is local storage supported?
   * @type {boolean}
   */
  this.supported = this._isSupported();
}

/**
 * Set value to local storage.
 * @memberof Storage#
 * @method set
 * @param {string} key
 * @param {*} value
 */
Storage.prototype.set = function(key, value) {
  if (!this.supported) return false;
  localStorage.setItem(this.id + '.' + key, this._encode(value));
};

/**
 * Get key from local storage.
 * @memberof Storage#
 * @method get
 * @param {string} key
 * @param {*} [defaultValue]
 * @return {*} value
 */
Storage.prototype.get = function(key, defaultValue) {
  var raw = localStorage.getItem(this.id + '.' + key);
  if (raw === null) return defaultValue;
  try {
    return this._decode(raw);
  }
  catch (e) {
    return raw;
  }
};

/**
 * Check if a key is in local storage.
 * @memberof Storage#
 * @method has
 * @param {string} key
 * @return {boolean}
 */
Storage.prototype.has = function(key) {
  return localStorage.getItem(this.id + '.' + key) !== null;
};

/**
 * Remove key from local storage.
 * @memberof Storage#
 * @method remove
 * @param {string} key
 */
Storage.prototype.remove = function(key) {
  localStorage.removeItem(this.id + '.' + key);
};

/**
 * Reset local storage. This removes ALL keys.
 * @memberof Storage#
 * @method reset
 */
Storage.prototype.reset = function() {
  for (var i = localStorage.length - 1; i >= 0; i--) {
    var key = localStorage.key(i);
    if (key.indexOf(this.id + '.') !== -1) localStorage.removeItem(key);
  }
};

/**
 * @memberof Storage#
 * @method _encode
 * @private
 */
Storage.prototype._encode = function(val) {
  return JSON.stringify(val);
};

/**
 * @memberof Storage#
 * @method _decode
 * @private
 */
Storage.prototype._decode = function(str) {
  return JSON.parse(str);
};

/**
 * @memberof Storage#
 * @method _isSupported
 * @private
 */
Storage.prototype._isSupported = function() {
  if (typeof localStorage !== 'object') return false;
  try {
    localStorage.setItem('localStorage', 1);
    localStorage.removeItem('localStorage');
  }
  catch (e) {
    return false;
  }

  return true;
};

module.exports = new Storage(Object.assign({
  id: 'lpanda-debug',
}, config.storage));
