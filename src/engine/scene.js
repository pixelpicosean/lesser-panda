var EventEmitter = require('engine/eventemitter3');
var engine = require('engine/core');
var utils = require('engine/utils');
var config = require('game/config').default;

/**
  Game scene.
  @class Scene
**/
function Scene() {
  EventEmitter.call(this);

  /**
    Desired FPS this scene should run
    @attribute {Number} desiredFPS
    @default 30
  **/
  this.desiredFPS = config.desiredFPS || 30;

  /**
    @property {Array} updateOrder
    @private
  **/
  this.updateOrder = [];

  var i, name, sys;
  for (i in Scene.updateOrder) {
    name = Scene.updateOrder[i];
    sys = Scene.systems[name];

    if (sys) {
      this.updateOrder.push(name);
      sys.init && sys.init(this);
    }
  }
}

Scene.prototype = Object.create(EventEmitter.prototype);
Scene.prototype.constructor = Scene;

/**
 * Called before activating this scene
 */
Scene.prototype._awake = function _awake() {
  for (var i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys.awake && sys.awake(this);
  }

  this.emit('awake');
  this.awake();
};

/**
 * Called each single frame once or more
 */
Scene.prototype._update = function _update(deltaMS, deltaSec) {
  var i, sys;

  // Pre-update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.preUpdate && sys.preUpdate(this, deltaMS, deltaSec);
  }

  this.emit('preUpdate', deltaMS, deltaSec);
  this.preUpdate(deltaMS, deltaSec);

  // Update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.update && sys.update(this, deltaMS, deltaSec);
  }

  this.emit('update', deltaMS, deltaSec);
  this.update(deltaMS, deltaSec);

  // Post-update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.postUpdate && sys.postUpdate(this, deltaMS, deltaSec);
  }

  this.emit('postUpdate', deltaMS, deltaSec);
  this.postUpdate(deltaMS, deltaSec);
};

/**
 * Called before deactivating this scene
 */
Scene.prototype._freeze = function _freeze() {
  this.emit('freeze');
  this.freeze();

  var i, sys;
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.freeze && sys.freeze(this);
  }
};

Scene.prototype.awake = function awake() {};
Scene.prototype.preUpdate = function preUpdate() {};
Scene.prototype.update = function update() {};
Scene.prototype.postUpdate = function postUpdate() {};
Scene.prototype.freeze = function freeze() {};

Scene.prototype.pause = function pause() {};
Scene.prototype.resume = function resume() {};

Object.assign(Scene, {
  desiredFPS: config.desiredFPS || 30,

  systems: {},
  /**
   * System updating order
   * @attribute {Array} updateOrder
   */
  updateOrder: [
    'Actor',
    'Animation',
    'Physics',
    'Renderer',
  ],
  registerSystem: function registerSystem(name, system) {
    if (Scene.systems[name]) console.log('Warning: override [' + name + '] system!');

    Scene.systems[name] = system;
  },
});

// Actor system --------------------------------------------
Object.assign(Scene.prototype, {
  /**
   * Spawn an Actor to this scene
   * @param  {Actor} actor      Actor class
   * @param  {Number} x
   * @param  {Number} y
   * @param  {String} layerName Name of the layer to add to(key of a PIXI.Container instance in this scene)
   * @param  {Object} settings  Custom settings
   * @param  {String} [settings.name] Name of this actor
   * @param  {String} [settings.tag]  Tag of this actor
   * @return {Actor}            Actor instance
   */
  spawnActor: function spawnActor(actor, x, y, layerName, settings) {
    var settings_ = settings || {};

    if (!this[layerName]) {
      console.log('Layer ' + layerName + ' does not exist!');
      return null;
    }

    var a = new actor().addTo(this, this[layerName]);
    a.position.set(x, y);
    this.addActor(a, settings_.tag);

    if (settings_.name) {
      a.name = settings_.name;
      this.namedActors[settings_.name] = a;
    }

    return a;
  },

  /**
   * Add actor to this scene, so its `update()` function gets called every frame.
   * @method addActor
   * @param {Actor} actor   Actor you want to add
   * @param {String} tag    Tag of this actor, default is '0'
   */
  addActor: function addActor(actor, tag) {
    var t = tag || '0';

    actor.tag = t;

    if (!this.actorSystem.actors[t]) {
      // Create a new actor list
      this.actorSystem.actors[t] = [];

      // Active new tag by default
      this.actorSystem.activeTags.push(t);
    }

    if (this.actorSystem.actors[t].indexOf(actor) < 0) {
      actor.removed = false;
      this.actorSystem.actors[t].push(actor);
    }
  },

  /**
   * Remove actor from scene.
   * @method removeActor
   * @param {Actor} actor
   */
  removeActor: function removeActor(actor) {
    // Will remove in next frame
    if (actor) actor.removed = true;

    // Remove name based reference
    if (actor.name) {
      if (this.actorSystem.namedActors[actor.name] === actor) {
        this.actorSystem.namedActors[actor.name] = null;
      }
    }
  },

  pauseObjectsTagged: function pauseObjectsTagged(tag) {
    if (this.actorSystem.actors[tag]) {
      utils.removeItems(this.actorSystem.activeTags, this.actorSystem.activeTags.indexOf(tag), 1);
      this.actorSystem.deactiveTags.push(tag);
    }

    return this;
  },

  resumeObjectsTagged: function resumeObjectsTagged(tag) {
    if (this.actorSystem.actors[tag]) {
      utils.removeItems(this.actorSystem.deactiveTags, this.actorSystem.deactiveTags.indexOf(tag), 1);
      this.actorSystem.activeTags.push(tag);
    }

    return this;
  },
});

Scene.registerSystem('Actor', {
  init: function init(scene) {
    /**
     * Actor system runtime data storage
     */
    scene.actorSystem = {
      activeTags: ['0'],
      deactiveTags: [],
      actors: {
        '0': [],
      },
      namedActors: {},
    };
  },
  update: function update(scene, deltaMS, deltaSec) {
    var i, key, actors;
    for (key in scene.actorSystem.actors) {
      if (scene.actorSystem.activeTags.indexOf(key) < 0) continue;

      actors = scene.actorSystem.actors[key];
      for (i = 0; i < actors.length; i++) {
        if (!actors[i].removed && actors[i].canEverTick) {
          actors[i].update(deltaMS, deltaSec);
        }
        if (actors[i].removed) {
          utils.removeItems(actors, i--, 1);
        }
      }
    }
  },
});

module.exports = Scene;
