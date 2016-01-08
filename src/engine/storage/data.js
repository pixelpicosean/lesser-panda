var storage = require('./index');
var Eventemitter = require('engine/eventemitter3');

function Data() {
  Eventemitter.call(this);

  /**
   * Data map
   * @type {Object}
   */
  this.data = {};
  /**
   * List of added keys
   * @type {Array}
   */
  this.keys = [];

  /**
   * Default values
   * @type {Object}
   */
  this.defaultVal = {};
}
Data.prototype = Object.create(Eventemitter.prototype);
Data.prototype.constructor = Data;

Data.prototype.validKey = function(key) {
  if (this.keys.indexOf(key) >= 0) {
    console.log('Data field "' + key + '" is already defined!');
    return false;
  }
  return true;
};

Data.prototype.addBool = function(key, defaultVal) {
  if (this.validKey(key)) {
    this.keys.push(key);
    this.data[key] = Boolean(defaultVal);
    this.defaultVal[key] = this.data[key];
  }

  return this;
};
Data.prototype.addInt = function(key, defaultVal) {
  if (this.validKey(key)) {
    this.keys.push(key);
    this.data[key] = parseInt(defaultVal);
    this.defaultVal[key] = this.data[key];
  }

  return this;
};
Data.prototype.addFloat = function(key, defaultVal) {
  if (this.validKey(key)) {
    this.keys.push(key);
    this.data[key] = parseFloat(defaultVal);
    this.defaultVal[key] = this.data[key];
  }

  return this;
};
Data.prototype.addString = function(key, defaultVal) {
  if (this.validKey(key)) {
    this.keys.push(key);
    this.data[key] = JSON.stringify(defaultVal);
    this.defaultVal[key] = this.data[key];
  }

  return this;
};
Data.prototype.addArray = function(key, defaultVal) {
  if (this.validKey(key)) {
    this.keys.push(key);
    this.data[key] = defaultVal || [];
    this.defaultVal[key] = this.data[key];
  }

  return this;
};

Data.prototype.has = function(key) {
  return this.keys.indexOf(key) >= 0;
};

Data.prototype.set = function(key, value) {
  if (this.has(key)) {
    this.data[key] = value;
    this.emit(key, value);
  }

  return this;
};
Data.prototype.setBool = function(key, value) {
  return this.set(key, Boolean(value));
};
Data.prototype.setInt = function(key, value) {
  return this.set(key, parseInt(value));
};
Data.prototype.setFloat = function(key, value) {
  return this.set(key, parseFloat(value));
};
Data.prototype.setString = function(key, value) {
  return this.set(key, JSON.stringify(value));
};
Data.prototype.setArrayItem = function(key, idx, value) {
  var arr = this.get(key);
  if (arr && arr.length > idx) {
    arr[idx] = value;
    this.emit(key, arr);
  }

  return this;
};

Data.prototype.get = function(key) {
  if (this.has(key)) {
    return this.data[key];
  }

  return undefined;
};
Data.prototype.getArrayItem = function(key, idx) {
  var arr = this.get(key);
  if (arr && arr.length > idx) {
    return arr[idx];
  }

  return undefined;
};

module.exports.Data = Data;

function PersistentData() {
  Data.call(this);
}
PersistentData.prototype = Object.create(Data.prototype);
PersistentData.prototype.constructor = PersistentData;

PersistentData.prototype.save = function() {
  storage.set('savedata', this.data);
};
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

module.exports.PersistentData = PersistentData;

module.exports.session = new Data();
module.exports.persistent = new PersistentData();
