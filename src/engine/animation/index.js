'use strict';

/**
 * Animation system is consist of two powerful sub-systems:
 *
 * 1. Tween : a classic but better tween engine.
 * 2. Action: a Blender/Flash like, keyframe based timeline animation system.
 *
 * @module engine/animation
 *
 * @requires engine/scene
 * @requires engine/utils
 * @requires engine/animation/tween
 * @requires engine/animation/action
 */

var Scene = require('engine/scene');
var utils = require('engine/utils');

var Tween = require('./tween');
var Action = require('./action').Action;

Object.assign(Scene.prototype, {
  /**
   * Pause animations with specific tag.
   * @memberof Scene#
   * @method pauseAnimationsTagged
   * @param  {string} tag
   * @return {Scene}      Self for chaining.
   */
  pauseAnimationsTagged: function pauseAnimationsTagged(tag) {
    if (this.animationSystem.anims[tag]) {
      utils.removeItems(this.animationSystem.activeTags, this.animationSystem.activeTags.indexOf(tag), 1);
      this.animationSystem.deactiveTags.push(tag);
    }

    return this;
  },

  /**
   * Resume animations with specific tag.
   * @memberof Scene#
   * @method resumeAnimationsTagged
   * @param  {string} tag
   * @return {Scene}      Self for chaining.
   */
  resumeAnimationsTagged: function resumeAnimationsTagged(tag) {
    if (this.animationSystem.anims[tag]) {
      utils.removeItems(this.animationSystem.deactiveTags, this.animationSystem.deactiveTags.indexOf(tag), 1);
      this.animationSystem.activeTags.push(tag);
    }

    return this;
  },
});

Scene.registerSystem('Animation', {
  init: function init(scene) {
    /**
     * Map of animation lists.
     * @property {Object} anims
     */
    scene.animationSystem = {
      activeTags: ['0'],
      deactiveTags: [],
      anims: {
        '0': [],
      },
    };
  },
  preUpdate: function preUpdate(scene) {
    var i, key, anims, t;
    for (key in scene.animationSystem.anims) {
      if (scene.animationSystem.activeTags.indexOf(key) < 0) continue;

      anims = scene.animationSystem.anims[key];
      for (i = 0; i < anims.length; i++) {
        t = anims[i];
        if (t.removed) {
          t.recycle();
          utils.removeItems(anims, i--, 1);
        }
      }
    }
  },
  update: function update(scene, delta) {
    var i, key, anims, t;
    for (key in scene.animationSystem.anims) {
      if (scene.animationSystem.activeTags.indexOf(key) < 0) continue;

      anims = scene.animationSystem.anims[key];
      for (i = 0; i < anims.length; i++) {
        t = anims[i];

        if (!t.removed) {
          t._step(delta);
        }
      }
    }
  },
});

module.exports = {
  Tween: Tween,
  Action: Action,
};
