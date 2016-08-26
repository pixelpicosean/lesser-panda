'use strict';

var Data = require('./data');
var storage = require('./storage');

/**
 * Persistent data storage, save/load data from `localStorage`.
 *
 * @class PersistentData
 * @constructor
 * @extends {Data}
 */
function PersistentData() {
  Data.call(this);
}
PersistentData.prototype = Object.create(Data.prototype);
PersistentData.prototype.constructor = PersistentData;

/**
 * Save data to localStorage.
 * @memberof PersistentData
 * @method save
 */
PersistentData.prototype.save = function() {
  storage.set('savedata', this.data);
};
/**
 * Load data from localStorage.
 * @memberof PersistentData
 * @method load
 */
PersistentData.prototype.load = function() {
  var i, valid, key, value;

  var data = storage.get('savedata', this.defaultVal);

  for (i = 0; i < this.keys.length; i++) {
    key = this.keys[i];
    value = data[key];

    // Check whether the valus is valid
    valid = false;
    if (
      (this.defaultVal[key] instanceof Array) &&
      (value instanceof Array) && (value.length >= this.defaultVal[key].length)
    ) {
      valid = true;
    }
    else if (
      ((typeof(this.defaultVal[key]) === 'boolean') && (typeof(value) === 'boolean')) ||
      ((typeof(this.defaultVal[key]) === 'number') && (typeof(value) === 'number')) ||
      ((typeof(this.defaultVal[key]) === 'string') && (typeof(value) === 'string'))
    ) {
      valid = true;
    }

    this.set(key, valid ? data[key] : this.defaultVal[key]);
  }
};

/**
 * @exports engine/storage/persistent-data
 * @see PersistentData
 *
 * @requires module:engine/storage/storage
 * @requires module:engine/storage/data
 */
module.exports = PersistentData;
