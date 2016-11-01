const EventEmitter = require('engine/EventEmitter');

/**
 * Data storage base class. Provides data define, set and get support.
 *
 * @class Data
 * @constructor
 * @extends {EventEmitter}
 */
class Data extends EventEmitter {
  constructor() {
    super();

    /**
     * Data map
     * @type {object}
     * @private
     */
    this.data = {};
    /**
     * List of added keys
     * @type {array}
     * @private
     */
    this.keys = [];

    /**
     * Default values
     * @type {object}
     * @private
     */
    this.defaultVal = {};
  }

  /**
   * Check whether a key is valid.
   * @memberof Data#
   * @method validKey
   * @param  {string} key
   * @return {boolean}
   */
  validKey(key) {
    if (this.keys.indexOf(key) >= 0) {
      console.log('Data field "' + key + '" is already defined!');
      return false;
    }
    return true;
  }

  /**
   * Add a boolean property.
   * @memberof Data#
   * @method addBool
   * @param {string} key
   * @param {boolean} defaultVal
   * @return {Data} Self for chaining
   */
  addBool(key, defaultVal) {
    if (this.validKey(key)) {
      this.keys.push(key);
      this.data[key] = Boolean(defaultVal);
      this.defaultVal[key] = this.data[key];
    }

    return this;
  }
  /**
   * Add a integer number property.
   * @memberof Data#
   * @method addInt
   * @param {string} key
   * @param {number} defaultVal
   * @return {Data} Self for chaining
   */
  addInt(key, defaultVal) {
    if (this.validKey(key)) {
      this.keys.push(key);
      this.data[key] = parseInt(defaultVal);
      this.defaultVal[key] = this.data[key];
    }

    return this;
  }
  /**
   * Add a float number property.
   * @memberof Data#
   * @method addFloat
   * @param {string} key
   * @param {number} defaultVal
   * @return {Data} Self for chaining
   */
  addFloat(key, defaultVal) {
    if (this.validKey(key)) {
      this.keys.push(key);
      this.data[key] = parseFloat(defaultVal);
      this.defaultVal[key] = this.data[key];
    }

    return this;
  }
  /**
   * Add a string property.
   * @memberof Data#
   * @method addString
   * @param {string} key
   * @param {string} defaultVal
   * @return {Data} Self for chaining
   */
  addString(key, defaultVal) {
    if (this.validKey(key)) {
      this.keys.push(key);
      this.data[key] = JSON.stringify(defaultVal);
      this.defaultVal[key] = this.data[key];
    }

    return this;
  }
  /**
   * Add an array property.
   * @memberof Data#
   * @method addArray
   * @param {string} key
   * @param {array} defaultVal
   * @return {Data} Self for chaining
   */
  addArray(key, defaultVal) {
    if (this.validKey(key)) {
      this.keys.push(key);
      this.data[key] = defaultVal || [];
      this.defaultVal[key] = this.data[key];
    }

    return this;
  }

  /**
   * Check whether this data has a property with a key.
   * @memberof Data#
   * @method has
   * @param {string} key
   * @return {boolean}
   */
  has(key) {
    return this.keys.indexOf(key) >= 0;
  }

  /**
   * Set a property by key.
   * @memberof Data#
   * @method set
   * @param {string} key
   * @param {*} value
   * @return {Data} Self for chaining
   */
  set(key, value) {
    if (this.has(key)) {
      this.data[key] = value;
      this.emit(key, value);
    }

    return this;
  }
  /**
   * Set a boolean property
   * @memberof Data#
   * @method setBool
   * @param {string} key
   * @param {boolean} value
   * @return {Data} Self for chaining
   */
  setBool(key, value) {
    return this.set(key, Boolean(value));
  }
  /**
   * Set a integer number property
   * @memberof Data#
   * @method setInt
   * @param {string} key
   * @param {number} value
   * @return {Data} Self for chaining
   */
  setInt(key, value) {
    return this.set(key, parseInt(value));
  }
  /**
   * Set a float number property
   * @memberof Data#
   * @method setFloat
   * @param {string} key
   * @param {number} value
   * @return {Data} Self for chaining
   */
  setFloat(key, value) {
    return this.set(key, parseFloat(value));
  }
  /**
   * Set a string property
   * @memberof Data#
   * @method setString
   * @param {string} key
   * @param {string} value
   * @return {Data} Self for chaining
   */
  setString(key, value) {
    return this.set(key, JSON.stringify(value));
  }
  /**
   * Set value of an element of array property
   * @memberof Data#
   * @method setArrayItem
   * @param {string} key
   * @param {number} idx
   * @param {bool} value
   * @return {Data} Self for chaining
   */
  setArrayItem(key, idx, value) {
    let arr = this.get(key);
    if (arr && arr.length > idx) {
      arr[idx] = value;
      this.emit(key, arr);
    }

    return this;
  }

  /**
   * Get value of a property
   * @memberof Data#
   * @method get
   * @param {string} key
   */
  get(key) {
    if (this.has(key)) {
      return this.data[key];
    }

    return undefined;
  }
  /**
   * Get value of an element of an array property
   * @memberof Data#
   * @method getArrayItem
   * @param {string} key
   * @param {number} idx
   */
  getArrayItem(key, idx) {
    let arr = this.get(key);
    if (arr && arr.length > idx) {
      return arr[idx];
    }

    return undefined;
  }
}

/**
 * @exports engine/storage/data
 * @see Data
 *
 * @requires module:engine/eventemitter3
 */
module.exports = Data;
