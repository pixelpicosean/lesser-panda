/**
 * Behavior base class
 * @interface
 */
class Behavior {
  /**
   * @constructor
   */
  constructor() {
    /**
     * Type of this behavior.
     * Every behavior should have a unique type!
     * @type {String}
     */
    this.type = 'Behavior';

    /**
     * Reference to the entity
     * @type {Entity}
     */
    this.entity = null;
  }
  /**
   * Initialize
   * @param  {Entity} entity      Entity of this behavior
   * @param  {Object} [settings]  Settings to merge
   */
  init(entity, settings) {
    this.entity = entity;
  }
  /**
   * Update
   * @memberof Behavior#
   * @param  {Number} dt  Delta time
   * @param  {Number} sec Delta time in seconds
   */
  update(dt, sec) {} /* eslint no-unused-vars:0 */
  /**
   * Fixed update
   * @memberof Behavior#
   * @param  {Number} dt  Delta time
   * @param  {Number} sec Delta time in seconds
   */
  fixedUpdate(dt, sec) {} /* eslint no-unused-vars:0 */
}

/**
 * Behavior class map.
 * @type {Object}
 */
Behavior.types = {};

/**
 * Register a Behavior
 * @param  {String} type    Type of this Behavior
 * @param  {Function} ctor  Class of this behavior
 */
Behavior.register = function(type, ctor) {
  if (!Behavior.types[type]) {
    Behavior.types[type] = ctor;
  }
  else {
    console.log('[WARNING]: "' + type + '" behavior is already registered!');
  }
};

module.exports = Behavior;
