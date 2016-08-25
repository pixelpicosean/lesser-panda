/**
 * Behavior base class.
 *
 * @class Behavior
 * @constructor
 */
function Behavior() {
  /**
   * Whether this behavior is currently activated
   * @type {boolean}
   */
  this.isActive = true;

  /**
   * Target Actor instance
   * @type {Actor}
   */
  this.actor = null;
};
Behavior.TYPE = 'Behavior';

/**
 * Called once when the behavior is added to an actor.
 * @memberof Behavior#
 * @method awake
 */
Behavior.prototype.awake = function() {};
/**
 * Activate this behavior
 * @memberof Behavior#
 * @method activate
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.activate = function() {
  this.isActive = true;
  return this;
};
/**
 * De-activate this behavior
 * @memberof Behavior#
 * @method deactivate
 * @return {Behavior} Behavior itself for chaining
 */
Behavior.prototype.deactivate = function() {
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
module.exports = exports = Behavior;
