const EventEmitter = require('engine/EventEmitter');

/**
 * Data storage base class. Provides data define, set and get support.
 *
 * @class Data
 * @extends {EventEmitter}
 */
class Data extends EventEmitter {
  /**
   * @constructor
   */
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
   * @param  {String} key   Key to validate
   * @return {Boolean}      Whether this key is valid
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
   * @param {String} key            Key of this property
   * @param {Boolean} defaultVal    Default value of this property
   * @return {Data}                 Self for chaining
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
   * @param {string} key          Key of this property
   * @param {number} defaultVal   Default value of this property
   * @return {Data}               Self for chaining
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
   * @param {string} key          Key of this property
   * @param {number} defaultVal   Default value of this property
   * @return {Data}               Self for chaining
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
   * @param {string} key          Key of this property
   * @param {string} defaultVal   Default value of this property
   * @return {Data}               Self for chaining
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
   * @param {string} key        Key of this property
   * @param {array} defaultVal  Default value of this property
   * @return {Data}             Self for chaining
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
   * @param {string} key  Key to find
   * @return {boolean}    Whether a property with this key exist
   */
  has(key) {
    return this.keys.indexOf(key) >= 0;
  }

  /**
   * Set a property by key.
   * @memberof Data#
   * @method set
   * @param {string} key  Key of the property
   * @param {*} value     Value to set
   * @return {Data}       Self for chaining
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
   * @param {string} key      Key of this property
   * @param {boolean} value   Value to set
   * @return {Data}           Self for chaining
   */
  setBool(key, value) {
    return this.set(key, Boolean(value));
  }
  /**
   * Set a integer number property
   * @memberof Data#
   * @method setInt
   * @param {string} key    Key of the property
   * @param {number} value  Value to set
   * @return {Data}         Self for chaining
   */
  setInt(key, value) {
    return this.set(key, parseInt(value));
  }
  /**
   * Set a float number property
   * @memberof Data#
   * @method setFloat
   * @param {string} key    Key of the property
   * @param {number} value  Value to set
   * @return {Data}         Self for chaining
   */
  setFloat(key, value) {
    return this.set(key, parseFloat(value));
  }
  /**
   * Set a string property
   * @memberof Data#
   * @method setString
   * @param {string} key    Key of the property
   * @param {string} value  Value to set
   * @return {Data}         Self for chaining
   */
  setString(key, value) {
    return this.set(key, JSON.stringify(value));
  }
  /**
   * Set value of an element of array property
   * @memberof Data#
   * @method setArrayItem
   * @param {string} key  Key of the array
   * @param {number} idx  Index of the element
   * @param {bool} value  Value to set
   * @return {Data}       Self for chaining
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
   * @param {string} key  Key of the property
   * @return {*}          Value of the property
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
   * @param {string} key  Key of the array
   * @param {number} idx  Index of the element
   * @return {*}          Value of the element or `undefined`
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
 * @exports engine/storage/Data
 * @see Data
 *
 * @requires module:engine/EventEmitter
 */
module.exports = Data;
