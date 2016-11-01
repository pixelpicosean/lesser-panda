const Vector = require('engine/vector');
const { merge } = require('engine/utils/object');

/**
 * Base object that may contain a graphic element(as `gfx`)
 * and a collider instance(as `coll`).
 *
 * The `gfx` and `coll` share the same postion.
 *
 * @class Entity
 *
 * @constructor
 * @param {number} x          X coordinate
 * @param {number} y          Y coordinate
 * @param {object} settings   Setting object to be merged in
 */
class Entity {
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
    this.layerName = null;

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
    merge(this, settings);
  }

  /**
   * Tag for filtering by systems.
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

  // TODO: pooling support
  init(x, y, settings) {
    this.position.set(x, y);

    merge(this, settings);
  }
  remove() {
    if (this.game) this.game.removeEntity(this);
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
   */
  update(/*dt, dtSec*/) {}
  /**
   * Update method to be called each fixed step. Set `canFixedTick = true` to activate.
   * Doing nothing by default.
   * @method fixedUpdate
   * @memberof Entity#
   */
  fixedUpdate(/*dt, dtSec*/) {}
}
Entity.nextId = 0;

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
 * @private
 */
Entity.canBePooled = false;

module.exports = Entity;
