var EventEmitter = require('engine/eventemitter3');

/**
 * Behavior base class.
 *
 * @class Behavior
 * @extends {EventEmitter}
 *
 * @constructor
 */
function Behavior() {
  EventEmitter.call(this);

  /**
   * Type of this behavior
   * @type {string}
   */
  this.type = '';

  /**
   * Whether this behavior is currently activated
   * @type {boolean}
   */
  this.isActive = false;

  /**
   * Target Actor instance
   * @type {Actor}
   */
  this.target = null;
};
Behavior.prototype = Object.create(EventEmitter.prototype);
Behavior.prototype.constructor = Behavior;

/**
 * Add to target
 * @memberof Behavior#
 * @method addTo
 * @param {object} target Any objects meet this behavior's requirement
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.addTo = function addTo(target) {
  this.target = target;
  return this;
};
/**
 * Setup the behavior
 * @memberof Behavior#
 * @method setup
 * @param {object} settings
 * @return {Behavior} Self for chaining
 */
Behavior.prototype.setup = function setup(settings) {
  // Merge settings
  Object.assign(this, this.defaultSettings || {}, settings);
};
/**
 * Activate this behavior
 * @memberof Behavior#
 * @method activate
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.activate = function activate() {
  this.isActive = true;
  return this;
};
/**
 * De-activate this behavior
 * @memberof Behavior#
 * @method deactivate
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.deactivate = function deactivate() {
  this.isActive = false;
  return this;
};

/**
 * Behaviors map
 * @memberof Behavior
 * @type {object}
 */
Behavior.behaviors = {};

/**
 * Register a new type of behavior.
 * @memberof Behavior
 * @param  {string}           type  Type of this behavior.
 * @param  {Behavior|object}  behv  Behavior sub-class or pure object
 */
Behavior.register = function(type, behv) {
  if (Behavior.behaviors[type]) {
    console.log('Behavior "' + type + '" is already defined!');
    return;
  }

  Behavior.behaviors[type] = behv;
};

/**
 * Behavior is just an "interface", you can inherit from it or
 * simply create an object with the methods as light-weight
 * behavior.
 *
 * @exports engine/behavior
 *
 * @requires module:engine/eventemitter3
 */
module.exports = Behavior;
