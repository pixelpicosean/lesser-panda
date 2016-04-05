/**
 * Behavior base class
 * All the built-in behaviors inherit from this one.
 */

function Behavior(settings) {
  this.isActive = false;

  this.target = null;
  this.scene = null;

  Object.assign(this, settings);
};
/**
 * Add to target and scene
 * @param {Object} target Any objects meet this behavior's requirement
 * @param {Scene} scene   Which scene this behavior will run inside
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.addTo = function addTo(target, scene) {
  this.target = target;
  this.scene = scene;
  return this;
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

module.exports = exports = Behavior;
