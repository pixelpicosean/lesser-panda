'use strict';

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
Scene.prototype._awake = function() {
  var i, sys;

  for (i in this.updateOrder) {
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
Scene.prototype._update = function(deltaMS, deltaSec) {
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
Scene.prototype._freeze = function() {
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
Scene.prototype.awake = function() {};
/**
 * PreUpdate is called at the beginning of each frame
 * @method preUpdate
 * @memberof Scene#
 */
Scene.prototype.preUpdate = function() {};
/**
 * Update is called each frame, right after `preUpdate`.
 * @method update
 * @memberof Scene#
 */
Scene.prototype.update = function() {};
/**
 * PostUpdate is called at the end of each frame, right after `update`.
 * @method postUpdate
 * @memberof Scene#
 */
Scene.prototype.postUpdate = function() {};
/**
 * Freeze is called when this scene is deactivated(switched to another one)
 * @method freeze
 * @memberof Scene#
 */
Scene.prototype.freeze = function() {};

/**
 * System pause callback.
 * @method pause
 * @memberof Scene#
 */
Scene.prototype.pause = function() {};
/**
 * System resume callback.
 * @method resume
 * @memberof Scene#
 */
Scene.prototype.resume = function() {};

/**
 * Create a new layer
 * @param {string} name      Name of this layer
 * @param {string} [parent]  Key of parent layer, default is `stage`.
 */
Scene.prototype.createLayer = function(name, parent) {
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
  registerSystem: function(name, system) {
    if (Scene.systems[name]) console.log('Warning: override [' + name + '] system!');

    Scene.systems[name] = system;
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
