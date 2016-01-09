var config = require('game/config');

/**
  Local storage.
  @class Storage
  @constructor
**/
function Storage(config) {
  /**
    @property {String} id
  **/
  this.id = config.id;
  /**
    Is local storage supported.
    @property {Boolean} supported
  **/
  this.supported = this._isSupported();
}

/**
  Set value to local storage.
  @method set
  @param {String} key
  @param {*} value
**/
Storage.prototype.set = function set(key, value) {
  if (!this.supported) return false;
  localStorage.setItem(this.id + '.' + key, this._encode(value));
};

/**
  Get key from local storage.
  @method get
  @param {String} key
  @param {*} [defaultValue]
  @return {*} value
**/
Storage.prototype.get = function get(key, defaultValue) {
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
  Check if a key is in local storage.
  @method has
  @param {String} key
  @return {Boolean}
**/
Storage.prototype.has = function has(key) {
  return localStorage.getItem(this.id + '.' + key) !== null;
};

/**
  Remove key from local storage.
  @method remove
  @param {String} key
**/
Storage.prototype.remove = function remove(key) {
  localStorage.removeItem(this.id + '.' + key);
};

/**
  Reset local storage. This removes ALL keys.
  @method reset
**/
Storage.prototype.reset = function reset() {
  for (var i = localStorage.length - 1; i >= 0; i--) {
    var key = localStorage.key(i);
    if (key.indexOf(this.id + '.') !== -1) localStorage.removeItem(key);
  }
};

/**
  @method _encode
  @private
**/
Storage.prototype._encode = function _encode(val) {
  return JSON.stringify(val);
};

/**
  @method _decode
  @private
**/
Storage.prototype._decode = function _decode(str) {
  return JSON.parse(str);
};

/**
  @method _isSupported
  @private
**/
Storage.prototype._isSupported = function _isSupported() {
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

module.exports = exports = new Storage(Object.assign({
  id: 'lpanda-debug',
}, config.storage));
