/**
 * Behavior is just an "interface", you can inherit from it or
 * simply create an object with the methods as light-weight
 * behavior.
 */

var EventEmitter = require('engine/eventemitter3');

function Behavior() {
  EventEmitter.call(this);

  this.type = '';

  this.isActive = false;

  this.target = null;
};
Behavior.prototype = Object.create(EventEmitter.prototype);
Behavior.prototype.constructor = Behavior;

/**
 * Add to target
 * @param {Object} target Any objects meet this behavior's requirement
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.addTo = function addTo(target) {
  this.target = target;
  return this;
};
/**
 * Setup the behavior
 * @param {Object} settings
 * @return {Behavior} Self for chaining
 */
Behavior.prototype.setup = function setup(settings) {
  // Merge settings
  Object.assign(this, this.defaultSettings || {}, settings);
};
/**
 * Activate this behavior
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.activate = function activate() {
  this.isActive = true;
  return this;
};
/**
 * De-activate this behavior
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.deactivate = function deactivate() {
  this.isActive = false;
  return this;
};

/**
 * Behaviors map
 * @type {Object}
 */
Behavior.behaviors = {};

/**
 * Register a new type of behavior.
 * @param  {String}           type  Type of this behavior.
 * @param  {Behavior|Object}  behv  Behavior sub-class or pure object
 */
Behavior.register = function(type, behv) {
  if (Behavior.behaviors[type]) {
    console.log('Behavior "' + type + '" is already defined!');
    return;
  }

  behv.type = type;
  Behavior.behaviors[type] = behv;
};

module.exports = exports = Behavior;
