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
    @property {Array} systems
    @private
  **/
  this.systems = [];

  var i, s;
  for (i in Scene.systems) {
    s = Scene.systems[i];
    this.systems.push(s);

    if (this['_init' + s]) {
      this['_init' + s]();
    }
  }
}

Scene.prototype = Object.create(EventEmitter.prototype);
Scene.prototype.constructor = Scene;

/**
 * Called before activating this scene
 */
Scene.prototype._awake = function() {
  this.emit('awake');
  this.awake();

  for (var i in this.systems) {
    if (this['_awake' + this.systems[i]]) {
      this['_awake' + this.systems[i]]();
    }
  }
};

/**
 * Called each single frame once or more
 */
Scene.prototype._update = function _update(delta) {
  this.emit('update', delta);
  this.update(delta);

  for (var i in this.systems) {
    if (this['_update' + this.systems[i]]) {
      this['_update' + this.systems[i]](delta);
    }
  }
};

/**
 * Called before deactivating this scene
 */
Scene.prototype._freeze = function _freeze() {
  this.emit('freeze');
  this.freeze();

  for (var i in this.systems) {
    if (this['_freeze' + this.systems[i]]) {
      this['_freeze' + this.systems[i]]();
    }
  }
};

Scene.prototype.awake = function awake() {};
Scene.prototype.update = function update() {};
Scene.prototype.freeze = function freeze() {};

Scene.prototype.pause = function pause() {};
Scene.prototype.resume = function resume() {};

// Objects API --------------------------------------------

/**
  Add object to scene, so it's `update()` function get's called every frame.
  @method addObject
  @param {Object} object
**/
Scene.prototype.addObject = function addObject(object) {
  if (this.objects.indexOf(object) === -1) {
    object._remove = false;
    this.objects.push(object);
  }
};

/**
  Remove object from scene.
  @method removeObject
  @param {Object} object
**/
Scene.prototype.removeObject = function removeObject(object) {
  object._remove = true;
};

Scene.prototype._initObjects = function _initObjects() {
  /**
    List of objects in scene.
    @property {Array} objects
  **/
  this.objects = [];
};

/**
  @method _updateObjects
  @private
**/
Scene.prototype._updateObjects = function _updateObjects(dt) {
  for (var i = 0; i < this.objects.length; i++) {
    if (typeof this.objects[i].update === 'function' && !this.objects[i]._remove) {
      this.objects[i].update(dt);
    }
    if (this.objects[i]._remove) {
      utils.removeItems(this.objects, i, 1);
    }
  }
};

Object.assign(Scene, {
  /**
   * Sub-systems to be updated **in order**.
   * @attribute {Array} systems
   */
  systems: [
    'Objects',
    'Timelines',
    'Physics',
    'Renderer',
  ],
});

module.exports = Scene;
