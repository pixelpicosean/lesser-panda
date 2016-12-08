const config = require('game/config');

/**
 * Local storage wrapper.
 * No need to create instance, an instance is exported as default.
 *
 * @class Storage
 */
class Storage {
  /**
   * @constructor
   * @param {object} config Settings from `game/config`.
   */
  constructor(config) {
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
   * @param {string} key  Key of the property
   * @param {*} value     Value to set
   */
  set(key, value) {
    if (!this.supported) {
      return;
    }
    localStorage.setItem(this.id + '.' + key, this._encode(value));
  }

  /**
   * Get key from local storage.
   * @memberof Storage#
   * @method get
   * @param {string} key        Key of the property
   * @param {*} [defaultValue]  Default value if no value is found
   * @return {*} value          Value for the key
   */
  get(key, defaultValue) {
    let raw = localStorage.getItem(this.id + '.' + key);
    if (raw === null) {return defaultValue;}
    try {
      return this._decode(raw);
    }
    catch (e) {
      return raw;
    }
  }

  /**
   * Check if a key is in local storage.
   * @memberof Storage#
   * @method has
   * @param {string} key  Key to find
   * @return {boolean}    Whether a property with this key exists
   */
  has(key) {
    return localStorage.getItem(this.id + '.' + key) !== null;
  }

  /**
   * Remove key from local storage.
   * @memberof Storage#
   * @method remove
   * @param {string} key  Key to remove
   */
  remove(key) {
    localStorage.removeItem(this.id + '.' + key);
  }

  /**
   * Reset local storage. This removes ALL keys.
   * @memberof Storage#
   * @method reset
   */
  reset() {
    let i, key;
    for (i = localStorage.length - 1; i >= 0; i--) {
      key = localStorage.key(i);
      if (key.indexOf(this.id + '.') !== -1) {localStorage.removeItem(key);}
    }
  }

  /**
   * @memberof Storage#
   * @method _encode
   * @private
   * @param {*} val Value to encoe
   * @return {String} Encoded string
   */
  _encode(val) {
    return JSON.stringify(val);
  }

  /**
   * @memberof Storage#
   * @method _decode
   * @private
   * @param {String} str  String to decode
   * @return {Object} Decoded object
   */
  _decode(str) {
    return JSON.parse(str);
  }

  /**
   * @memberof Storage#
   * @method _isSupported
   * @private
   * @return {Boolean} Whether `localStorage` is supported by the browser
   */
  _isSupported() {
    if (typeof localStorage !== 'object') {return false;}
    try {
      localStorage.setItem('localStorage', 1);
      localStorage.removeItem('localStorage');
    }
    catch (e) {
      return false;
    }

    return true;
  }
}

module.exports = new Storage(Object.assign({
  id: 'lpanda-debug',
}, config.storage));
