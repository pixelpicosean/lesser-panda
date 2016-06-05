var EventEmitter = require('engine/eventemitter3');
var engine = require('engine/core');
var utils = require('engine/utils');
var renderer = require('engine/renderer');
var config = require('game/config').default;

/**
 * Scene is the main hub for a game. A game made with LesserPanda
 * is a combination of different scenes(menu, shop, game, game-over .etc).
 *
 * @class Scene
 * @constructor
 * @extends {EvenetEmitter}
 */
function Scene() {
  EventEmitter.call(this);

  /**
   * Desired FPS this scene should run
   * @property {Number} desiredFPS
   * @default 30
   */
  this.desiredFPS = config.desiredFPS || 30;

  /**
   * @property {Array} updateOrder
   * @private
   */
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
 * Called before activating this scene.
 * @protected
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
 * Called each single frame once or more.
 * @protected
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
 * Called before deactivating this scene.
 * @protected
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

/**
 * Awake is called when this scene is activated.
 * @method awake
 * @memberof Scene#
 */
Scene.prototype.awake = function awake() {};
/**
 * PreUpdate is called at the beginning of each frame
 * @method preUpdate
 * @memberof Scene#
 */
Scene.prototype.preUpdate = function preUpdate() {};
/**
 * Update is called each frame, right after `preUpdate`.
 * @method update
 * @memberof Scene#
 */
Scene.prototype.update = function update() {};
/**
 * PostUpdate is called at the end of each frame, right after `update`.
 * @method postUpdate
 * @memberof Scene#
 */
Scene.prototype.postUpdate = function postUpdate() {};
/**
 * Freeze is called when this scene is deactivated(switched to another one)
 * @method freeze
 * @memberof Scene#
 */
Scene.prototype.freeze = function freeze() {};

/**
 * System pause callback.
 * @method pause
 * @memberof Scene#
 */
Scene.prototype.pause = function pause() {};
/**
 * System resume callback.
 * @method resume
 * @memberof Scene#
 */
Scene.prototype.resume = function resume() {};

/**
 * Create a new layer
 * @param {string} name      Name of this layer
 * @param {string} [parent]  Key of parent layer, default is `stage`.
 */
Scene.prototype.createLayer = function createLayer(name, parent) {
  renderer.createLayer(this, name, parent);
  return this;
};

Object.assign(Scene, {
  /**
   * Sub-systems.
   * @memberof Scene
   * @type {object}
   */
  systems: {},
  /**
   * Sub-system updating order
   * @memberof Scene
   * @type {array}
   */
  updateOrder: [
    'Actor',
    'Animation',
    'Physics',
    'Renderer',
  ],
  /**
   * Register a new sub-system.
   * @memberOf Scene
   * @method registerSystem
   * @param  {string} name
   * @param  {object} system
   */
  registerSystem: function registerSystem(name, system) {
    if (Scene.systems[name]) console.log('Warning: override [' + name + '] system!');

    Scene.systems[name] = system;
  },
});

// Actor system --------------------------------------------
Object.assign(Scene.prototype, {
  /**
   * Spawn an Actor to this scene
   * @method spawnActor
   * @memberOf Scene#
   * @param  {Actor} actor      Actor class
   * @param  {number} [x]
   * @param  {number} [y]
   * @param  {string} [layerName] Name of the layer to add to(key of a PIXI.Container instance in this scene)
   * @param  {object} [settings]  Custom settings
   * @param  {string} [settings.name] Name of this actor
   * @param  {string} [settings.tag]  Tag of this actor
   * @return {Actor}            Actor instance
   */
  spawnActor: function spawnActor(actor, x, y, layerName, settings) {
    var settings_ = settings || {};

    var layerName_ = layerName;
    if (!this[layerName_]) {
      layerName_ = 'stage';
    }

    // Create instance
    var a;
    if (actor.canBePooled) {
      a = actor.create(settings_);
    }
    else {
      a = new actor(settings_);
    }
    a.CTOR = actor;

    // Add actor components
    a.scene = this;
    a.layer = this[layerName_];
    a.sprite && a.layer.addChild(a.sprite);
    a.body && this.world.addBody(a.body);
    a.position.set(x || 0, y || 0);

    // Add to actor system
    this.addActor(a, settings_.tag);

    // Keep a reference if it has a name
    if (settings_.name) {
      a.name = settings_.name;
      this.actorSystem.namedActors[settings_.name] = a;
    }

    return a;
  },

  /**
   * Add actor to this scene, so its `update()` function gets called every frame.
   * @method addActor
   * @memberOf Scene#
   * @param {Actor} actor   Actor you want to add
   * @param {string} tag    Tag of this actor, default is '0'
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

    actor.ready();
  },

  /**
   * Remove actor from scene.
   * @method removeActor
   * @memberOf Scene#
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

  /**
   * Pause actors with a specific tag.
   * @method pauseActorsTagged
   * @memberof Scene#
   * @param  {string} tag
   */
  pauseActorsTagged: function pauseActorsTagged(tag) {
    if (this.actorSystem.actors[tag]) {
      utils.removeItems(this.actorSystem.activeTags, this.actorSystem.activeTags.indexOf(tag), 1);
      this.actorSystem.deactiveTags.push(tag);
    }

    return this;
  },

  /**
   * Resume actors with a specific tag.
   * @method resumeActorsTagged
   * @memberof Scene#
   * @param  {string} tag
   */
  resumeActorsTagged: function resumeActorsTagged(tag) {
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
    var i, key, actors, actor;
    for (key in scene.actorSystem.actors) {
      if (scene.actorSystem.activeTags.indexOf(key) < 0) continue;

      actors = scene.actorSystem.actors[key];
      for (i = 0; i < actors.length; i++) {
        actor = actors[i];

        if (!actor.removed) {
          if (actor.behaviorList.length > 0) {
            actor.updateBehaviors(deltaMS, deltaSec);
          }
          if (actor.canEverTick) {
            actor.update(deltaMS, deltaSec);
          }
        }

        if (actor.removed) {
          actor.CTOR.canBePooled && actor.CTOR.recycle(actor);
          utils.removeItems(actors, i--, 1);
        }
      }
    }
  },
  freeze: function freeze(scene) {
    // Cleanup
    var i, key, actors, actor;
    for (key in scene.actorSystem.actors) {
      if (scene.actorSystem.activeTags.indexOf(key) < 0) continue;

      actors = scene.actorSystem.actors[key];
      for (i = 0; i < actors.length; i++) {
        actor = actors[i];

        if (actor.removed) {
          actor.CTOR.canBePooled && actor.CTOR.recycle(actor);
          utils.removeItems(actors, i--, 1);
        }
      }
    }
  },
  freeze: function freeze(scene) {
    // Cleanup
    var i, key, actors, actor;
    for (key in scene.actorSystem.actors) {
      if (scene.actorSystem.activeTags.indexOf(key) < 0) continue;

      actors = scene.actorSystem.actors[key];
      for (i = 0; i < actors.length; i++) {
        actor = actors[i];

        if (actor.removed) {
          utils.removeItems(actors, i--, 1);
        }
      }
    }
  },
});

/**
 * @example <captain>Create a new scene class</captain>
 * import Scene from 'engine/scene';
 * class MyScene extends Scene {}
 *
 * @example <captain>Register a new scene</captain>
 * import core from 'engine/core';
 * core.addScene('MyScene', MyScene);
 *
 * @example <captain>Switch to another scene</captain>
 * import core from 'engine/core';
 * core.setScene('MyScene');
 *
 * @exports engine/scene
 * @requires engine/eventemitter3
 * @requires engine/core
 * @requires engine/utils
 */
module.exports = Scene;
