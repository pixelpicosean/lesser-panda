const core = require('engine/core');
const EventEmitter = require('engine/EventEmitter');
const { removeItems } = require('engine/utils/array');
const Entity = require('engine/Entity');

/**
 * Game is the main hub for a game. A game made with LesserPanda
 * is a combination of different `Games`(menu, shop, game, game-over .etc).
 *
 * @class Game
 * @extends {EvenetEmitter}
 */
class Game extends EventEmitter {
  /**
   * @constructor
   */
  constructor() {
    super();

    /**
     * Desired FPS this scene should run
     * @property {Number} desiredFPS
     * @default 60
     */
    this.desiredFPS = 60;

    /**
     * Map of added systems
     * @property {Object} systems
     */
    this.systems = {};

    /**
     * List of system updating order.
     * Note: `systemOrder` should only be modified after systems added!
     * @property {Array<String>} systemOrder
     */
    this.systemOrder = [];

    /**
     * List of entities in the game world.
     * @type {Array<Entity>}
     */
    this.entities = [];
    /**
     * Holding all the named entities(has `name` been set).
     * @type {Object}
     */
    this.namedEntities = {};
    /**
     * Holding all the tagged entities(has `tag` been set).
     * @type {Object}
     */
    this.taggedEntities = {};

    /**
     * Caches update informations
     * @type {Object}
     * @private
     */
    this.updateInfo = {
      spiraling: 0,
      last: -1,
      realDelta: 0,
      deltaTime: 0,
      lastCount: 0,
      step: 0,
      slowStep: 0,
      count: 0,
    };
  }

  /**
   * Called each single frame by engine core, support both idle and fixed update.
   * Using a modified fixed update implementation from Phaser by @photonstorm
   * @param {Number} timestamp Timestamp at this invoking
   * @protected
   */
  run(timestamp) {
    let updateInfo = this.updateInfo;

    if (updateInfo.last > 0) {
      updateInfo.realDelta = timestamp - updateInfo.last;
    }
    updateInfo.last = timestamp;

    // If the logic time is spiraling upwards, skip a frame entirely
    if (updateInfo.spiraling > 1) {
      // Reset the deltaTime accumulator which will cause all pending dropped frames to be permanently skipped
      updateInfo.deltaTime = 0;
      updateInfo.spiraling = 0;
    }
    else {
      // Step size
      updateInfo.step = 1000.0 / this.desiredFPS;
      updateInfo.slowStep = updateInfo.step * core.speed;
      updateInfo.slowStepSec = updateInfo.step * 0.001 * core.speed;

      // Accumulate time until the step threshold is met or exceeded... up to a limit of 3 catch-up frames at step intervals
      updateInfo.deltaTime += Math.max(Math.min(updateInfo.step * 3, updateInfo.realDelta), 0);

      // Call the game update logic multiple times if necessary to "catch up" with dropped frames
      // unless forceSingleUpdate is true
      updateInfo.count = 0;

      while (updateInfo.deltaTime >= updateInfo.step) {
        updateInfo.deltaTime -= updateInfo.step;

        // Fixed update
        this.fixedUpdate(updateInfo.slowStep, updateInfo.slowStepSec);

        updateInfo.count += 1;
      }

      // Detect spiraling (if the catch-up loop isn't fast enough, the number of iterations will increase constantly)
      if (updateInfo.count > updateInfo.lastCount) {
        updateInfo.spiraling += 1;
      }
      else if (updateInfo.count < updateInfo.lastCount) {
        // Looks like it caught up successfully, reset the spiral alert counter
        updateInfo.spiraling = 0;
      }

      updateInfo.lastCount = updateInfo.count;
    }

    // Idle update
    this.update(updateInfo.realDelta, updateInfo.realDelta * 0.001);
  }

  /**
   * Awake is called when this scene is activated.
   * @method awake
   * @memberof Game#
   */
  awake() {
    let i, sys;
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].awake();
    }

    this.emit('awake');
  }

  /**
   * Update is called every single frame.
   * @method update
   * @memberof Game#
   * @param {Number} delta    Delta time in millisecond
   * @param {Number} deltaSec Delta time in second
   */
  update(delta, deltaSec) {
    let i, sys, ent;

    // Update entities
    for (i = 0; i < this.entities.length; i++) {
      ent = this.entities[i];
      if (!ent.isRemoved && ent.canEverTick) {
        ent.update(delta, deltaSec);
      }

      if (ent.isRemoved) {
        if (ent.CTOR.canBePooled) {
          ent.CTOR.recycle(ent);
        }
        removeItems(this.entities, i--, 1);
      }
    }

    // Update systems
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].update(delta, deltaSec);
    }

    this.emit('update', delta, deltaSec);
  }

  /**
   * Fixed update is called in a constant frenquence decided by `desiredFPS`.
   * @method fixedUpdate
   * @memberof Game#
   * @param {Number} delta    Delta time in millisecond
   * @param {Number} deltaSec Delta time in second
   */
  fixedUpdate(delta, deltaSec) {
    let i, sys, ent;

    // Update entities
    for (i = 0; i < this.entities.length; i++) {
      ent = this.entities[i];
      if (!ent.isRemoved && ent.canFixedTick) {
        ent.fixedUpdate(delta, deltaSec);
      }

      if (ent.isRemoved) {
        if (ent.CTOR.canBePooled) {
          ent.CTOR.recycle(ent);
        }
        removeItems(this.entities, i--, 1);
      }
    }

    // Update systems
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].fixedUpdate(delta, deltaSec);
    }

    this.emit('fixedUpdate', delta, deltaSec);
  }

  /**
   * Freeze is called when this scene is deactivated(switched to another one)
   * @method freeze
   * @memberof Game#
   */
  freeze() {
    let i, sys;
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].freeze();
    }

    this.emit('freeze');
  }

  /**
   * Add a system instance to this game.
   * @method addSystem
   * @memberof Game#
   * @param {System} sys System instance to add
   * @return {Game} Self for chaining
   */
  addSystem(sys) {
    if (sys.name.length === 0) {
      console.log(`System name "${sys.name}" is invalid!`);
      return this;
    }

    if (this.systemOrder.indexOf(sys.name) >= 0) {
      console.log(`System "${sys.name}" already added!`);
      return this;
    }

    this.systems[sys.name] = sys;
    this.systemOrder.push(sys.name);
    this[`sys${sys.name}`] = sys;
    sys.game = this;

    return this;
  }

  /**
   * System pause callback.
   * @method pause
   * @memberof Game#
   */
  pause() {
    let i, sys;
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].onPause();
    }

    this.emit('pause');
  }
  /**
   * System resume callback.
   * @method resume
   * @memberof Game#
   */
  resume() {
    let i, sys;
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].onResume();
    }

    this.emit('resume');
  }

  /**
   * Spawn an `Entity` into game world.
   * @method spawnEntity
   * @memberof Game#
   * @param  {Class} type       Entity class
   * @param  {Number} x         X coordinate
   * @param  {Number} y         Y coordinate
   * @param  {String} layer     Name of the layer to added to
   * @param  {Object} settings  Instance settings
   * @return {Entity}           Entity instance
   */
  spawnEntity(type, x, y, layer, settings) {
    let ctor = type;
    if (typeof(type) === 'string') {
      ctor = Entity.types[type];
      if (!ctor) {
        console.log(`[WARNING]: Entity type "${type}" does not exist!`);
        return undefined;
      }
    }

    // Create entity instance
    let ent;
    if (ctor.canBePooled) {
      ent = ctor.create(x, y, settings);
    }
    else {
      ent = new ctor(x, y, settings);
      ent.CTOR = ctor;
    }
    ent.layer = layer;
    ent.game = this;

    // Add to list
    this.entities.push(ent);

    // Add to name list
    if (ent.name) {
      this.namedEntities[ent.name] = ent;
    }

    // Add to tag list
    if (ent._tag) {
      if (!this.taggedEntities.hasOwnProperty(ent._tag)) {
        this.taggedEntities[ent._tag] = [];
      }
      this.taggedEntities[ent._tag].push(ent);
    }

    // Notify systems
    let i, sys;
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].onEntitySpawn(ent);
    }

    // Entity is ready to rock :D
    ent.ready();

    return ent;
  }
  /**
   * Remove an entity instance from this game
   * @memberof Game#
   * @param  {Entity} ent Entity instance
   */
  removeEntity(ent) {
    // Mark as removed
    ent.isRemoved = true;

    // Remove from name list
    if (ent.name) {
      delete this.namedEntities[ent.name];
    }

    // Remove from tag list
    if (ent._tag && this.taggedEntities.hasOwnProperty(ent._tag)) {
      let idx = this.taggedEntities[ent._tag].indexOf(ent);

      if (idx !== -1) {
        removeItems(this.taggedEntities[ent._tag], idx, 1);
      }
    }

    // Notify systems
    let i, sys;
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].onEntityRemove(ent);
    }
  }
  /**
   * Change tag of an entity instance
   * @memberof Game#
   * @param  {Entity} ent Entity instance
   * @param {String} tag  Tag to change to
   */
  changeEntityTag(ent, tag) {
    // Remove from tag list
    if (ent._tag && this.taggedEntities.hasOwnProperty(tag)) {
      let idx = this.taggedEntities[tag].indexOf(ent);

      if (idx !== -1) {
        removeItems(this.taggedEntities[tag], idx, 1);
      }
    }

    // Add to new tag group
    if (!this.taggedEntities.hasOwnProperty(tag)) {
      this.taggedEntities[tag] = [];
    }
    this.taggedEntities[tag].push(ent);

    // Notify systems
    let i, sys;
    for (i = 0; i < this.systemOrder.length; i++) {
      sys = this.systemOrder[i];
      this.systems[sys] && this.systems[sys].onEntityTagChange(ent, tag);
    }

    // Change entity tag value
    ent._tag = tag;
  }
  /**
   * Find an entity with specific name.
   * @memberof Game#
   * @param  {string} name Name of the entity
   * @return {Entity} Entity with the name
   */
  getEntityByName(name) {
    return this.namedEntities[name];
  }
  /**
   * Find entities with a specific tag.
   * @memberof Game#
   * @param  {string} tag Tag of the entities
   * @return {Array<Entity>|null} Entities with the tag
   */
  getEntitiesByTag(tag) {
    if (this.taggedEntities.hasOwnProperty(tag)) {
      return this.taggedEntities[tag];
    }
    return null;
  }

  /**
   * Resize callback.
   * @method resize
   * @memberof Game#
   * @param {Number} w New window width
   * @param {Number} h New window height
   */
  resize(w, h) {} /* eslint no-unused-vars:0 */
}

/**
 * @example <captain>Create a new game class</captain>
 * const Game = require('engine/Game');
 * class MyGame extends Game {}
 *
 * @example <captain>Switch to another game</captain>
 * const core = require('engine/core');
 * const MyGame = require('engine/MyGame');
 * core.setGame(MyGame);
 *
 * @exports engine/Game
 * @requires engine/core
 * @requires engine/EventEmitter
 * @requires engine/utils/math
 */
module.exports = Game;
