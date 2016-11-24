const Vector = require('engine/Vector');
const { merge } = require('engine/utils/object');

/**
 * Base object that may contain a graphic element(as `gfx`)
 * and a collider instance(as `coll`).
 *
 * The `gfx` and `coll` share the same postion.
 *
 * @class Entity
 */
class Entity {
  /**
   * @constructor
   * @param {Number} x          X coordinate
   * @param {Number} y          Y coordinate
   * @param {Object} settings   Setting object to be merged in
   */
  constructor(x, y, settings) {
    /**
     * Each entity has a unique ID.
     * @memberof Entity#
     */
    this.id = ++Entity.nextId;

    /**
     * Name of this Entity, default is null.
     * @type {string}
     */
    this.name = null;

    /**
     * Real tag field
     * @type {string}
     * @private
     */
    this._tag = null;

    /**
     * Whether this actor is removed from game.
     * @type {boolean}
     */
    this.isRemoved = false;

    /**
     * Want this actor to be updated?
     * @type {boolean}
     * @default false
     */
    this.canEverTick = false;

    /**
     * Want this actor to be fixed-updated?
     * @type {boolean}
     * @default false
     */
    this.canFixedTick = false;

    /**
     * Graphic component.
     * @memberof Entity#
     */
    this.gfx = null;

    /**
     * Name of the layer that `gfx` will be added to while spawning.
     * @memberof Entity#
     * @type {String}
     */
    this.layer = null;

    /**
     * Collider component.
     * @memberof Entity#
     */
    this.coll = null;

    /**
     * Position of this entity.
     * @memberof Entity#
     */
    this.position = new Vector(x, y);

    /**
     * Reference to the game this actor is added to.
     * @type {Game}
     * @default null
     */
    this.game = null;

    /**
     * Reference to the constructor for pooling.
     * @type {class}
     */
    this.CTOR = Entity;

    // Apply settings
    this.setup(settings);
  }

  /**
   * Get tag of this Entity
   * @type {string}
   */
  get tag() { return this._tag; }
  set tag(t) {
    if (this.game) {
      this.game.changeEntityTag(this, t);
    }
    else {
      this._tag = t;
    }
  }

  /**
   * Poolable entity initialization (called immediately after picking from the pool)
   * @memberof Entity#
   * @param {Number} x        X coordinate
   * @param {Number} y        Y coordinate
   * @param {String} layer    Name of the layer to added to
   * @param {Object} settings Setting object
   * @return {Entity} Entity instance
   */
  init(x, y, layer, settings) {
    this.position.set(x, y);
    this.layer = layer;

    return this.setup(settings);
  }
  /**
   * Remove self from game
   * @memberof Entity#
   */
  remove() {
    if (this.game) {
      this.game.removeEntity(this);
    }
  }

  /**
   * Setup this entity with settings(deeply merge is used by default)
   * @param {Object} settings Settings
   * @return {Entity} Self for chaining
   */
  setup(settings) {
    merge(this, settings);
    return this;
  }

  /**
   * Will be called after this Entity is added to a game.
   * @method ready
   * @memberof Entity#
   */
  ready() {}
  /**
   * Update method to be called each frame. Set `canEverTick = true` to activate.
   * Doing nothing by default.
   * @method update
   * @memberof Entity#
   * @param {Number} dt     Delta time in millisecond
   * @param {Number} dtSec  Delta time in second
   */
  update(dt, dtSec) {} /* eslint no-unused-vars:0 */
  /**
   * Update method to be called each fixed step. Set `canFixedTick = true` to activate.
   * Doing nothing by default.
   * @method fixedUpdate
   * @memberof Entity#
   * @param {Number} dt     Delta time in millisecond
   * @param {Number} dtSec  Delta time in second
   */
  fixedUpdate(dt, dtSec) {} /* eslint no-unused-vars:0 */
}
/**
 * ID of next Entity instance
 * @type {Number}
 * @static
 */
Entity.nextId = 0;

/**
 * Entity class map.
 * @type {Object}
 */
Entity.types = {};
Entity.register = function(type, ctor) {
  if (!Entity.types[type]) {
    Entity.types[type] = ctor;
  }
  else {
    console.log('[WARNING]: "' + type + '" entity is already registered!');
  }
};

/**
 * Entity base class is not poolable.
 * @type {Boolean}
 * @static
 */
Entity.canBePooled = false;

module.exports = Entity;
