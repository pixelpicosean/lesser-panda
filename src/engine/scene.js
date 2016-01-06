var EventEmitter = require('engine/eventemitter3');
var engine = require('engine/core');
var utils = require('engine/utils');
var config = require('game/config');

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
Scene.prototype._update = function _update(delta) {
  var i;

  // Pre-update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys.preUpdate && sys.preUpdate(this, delta);
  }

  this.emit('preUpdate', delta);
  this.preUpdate(delta);

  // Update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys.update && sys.update(this, delta);
  }

  this.emit('update', delta);
  this.update(delta);

  // Post-update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys.postUpdate && sys.postUpdate(this, delta);
  }

  this.emit('postUpdate', delta);
  this.postUpdate(delta);
};

/**
 * Called before deactivating this scene
 */
Scene.prototype._freeze = function _freeze() {
  this.emit('freeze');
  this.freeze();

  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys.freeze && sys.freeze(this);
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
    'Object',
    'Timeline',
    'Physics',
    'Renderer',
  ],
  registerSystem: function registerSystem(name, system) {
    if (Scene.systems[name]) throw 'System [' + name + '] is already defined!';

    Scene.systems[name] = system;
  },
});

// Object system --------------------------------------------
Object.assign(Scene.prototype, {
  /**
   * Add object to scene, so it's `update()` function get's called every frame.
   * @method addObject
   * @param {Object} object
   */
  addObject: function addObject(object) {
    if (this.objects.indexOf(object) === -1) {
      object._remove = false;
      this.objects.push(object);
    }
  },

  /**
   * Remove object from scene.
   * @method removeObject
   * @param {Object} object
   */
  removeObject: function removeObject(object) {
    object._remove = true;
  },
});

Scene.registerSystem('Object', {
  init: function init(scene) {
    /**
     * List of objects in scene.
     * @property {Array} objects
     */
    scene.objects = [];
  },
  update: function update(scene, dt) {
    for (var i = 0; i < scene.objects.length; i++) {
      if (typeof scene.objects[i].update === 'function' && !scene.objects[i]._remove) {
        scene.objects[i].update(dt);
      }
      if (scene.objects[i]._remove) {
        utils.removeItems(scene.objects, i, 1);
      }
    }
  },
  freeze: function freeze(scene) {
    for (var i = 0; i < scene.objects.length; i++) {
      if (scene.objects[i]._remove) {
        utils.removeItems(scene.objects, i, 1);
      }
    }
  },
});

module.exports = Scene;
