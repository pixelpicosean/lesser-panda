var EventEmitter = require('engine/eventemitter3');
var engine = require('engine/core');

/**
  Game scene.
  @class Scene
**/
function Scene() {
  EventEmitter.call(this);

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

Scene.prototype.tickAndRun = function tickAndRun() {
  this.emit('update');
  this.update();

  for (var i in this.systems) {
    if (this['_update' + this.systems[i]]) {
      this['_update' + this.systems[i]]();
    }
  }
};

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
Scene.prototype._updateObjects = function _updateObjects() {
  for (var i = this.objects.length - 1; i >= 0; i--) {
    if (typeof this.objects[i].update === 'function' && !this.objects[i]._remove) this.objects[i].update();
    if (this.objects[i]._remove) this.objects.splice(i, 1);
  }
};

Object.assign(Scene, {
  /**
    Sub-systems of scene.
    @attribute {Array} systems
    @default [Objects]
  **/
  systems: [
    'Objects',
  ],
});

module.exports = Scene;
