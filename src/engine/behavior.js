/**
 * Behavior base class
 * All the built-in behaviors inherit from this one.
 */

var EventEmitter = require('engine/eventemitter3');

function Behavior(type, setupTarget, settings, needUpdate) {
  EventEmitter.call(this);

  this.type = type;
  this.setupTarget = setupTarget;
  this.needUpdate = needUpdate;

  this.isActive = false;

  this.target = null;
  this.scene = null;

  // Merge settings
  Object.assign(this, settings);
};
Behavior.prototype = Object.create(EventEmitter.prototype);
Behavior.prototype.constructor = Behavior;

/**
 * Add to target and scene
 * @param {Object} target Any objects meet this behavior's requirement
 * @param {Scene} scene   Which scene this behavior will run inside
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.addTo = function addTo(target, scene) {
  this.target = target;
  this.scene = scene;

  // Keep a reference to this behavior
  target[this.type] = this;

  // Setup target object
  this.setupTarget.call(target);

  return this;
};
/**
 * Activate this behavior
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.activate = function activate() {
  this.isActive = true;
  if (this.needUpdate) {
    this.scene.addObject(this);
  }
  return this;
};
/**
 * De-activate this behavior
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.deactivate = function deactivate() {
  this.isActive = false;
  if (this.needUpdate) {
    this.scene.removeObject(this);
  }
  return this;
};

module.exports = exports = Behavior;
