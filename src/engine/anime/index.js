/**
 * Animation system is consist of two powerful sub-systems:
 *
 * 1. Tween : a classic but better tween engine.
 * 2. Action: a Blender/Flash like, keyframe based timeline animation system.
 *
 * @module engine/anime
 *
 * @requires engine/system
 * @requires engine/utils/array
 * @requires engine/anime/tween
 * @requires engine/anime/action
 */
const System = require('engine/system');
const { removeItems } = require('engine/utils/array');

const Tween = require('./tween');
const { ActionPlayer } = require('./action');

/**
 * Anime sub-system.
 * @class
 * @extends {System}
 */
class SystemAnime extends System {
  /**
   * @constructor
   */
  constructor() {
    super();

    /**
     * Name of this system.
     * @type {String}
     */
    this.name = 'Anime';

    /**
     * Animation item collection
     * @type {Object}
     */
    this.anims = {
      '0': [],
    };

    /**
     * Activated tags
     * @type {Array}
     */
    this.activeTags = ['0'];
    /**
     * Deactivated tags
     * @type {Array}
     */
    this.deactiveTags = [];
  }

  /**
   * Overrided update.
   * @memberof SystemAnime#
   * @method update
   * @protected
   * @param  {number} dt Delta time
   */
  update(dt) {
    let i, key, anims, t;
    for (key in this.anims) {
      if (this.activeTags.indexOf(key) < 0) {continue;}

      anims = this.anims[key];
      for (i = 0; i < anims.length; i++) {
        t = anims[i];

        if (!t.isRemoved) {
          t._step(dt);

          if (t.isRemoved) {
            t.recycle();
            removeItems(anims, i--, 1);
          }
        }
      }
    }
  }

  /**
   * Pause animations with a specific tag.
   * @memberof SystemAnime#
   * @method pauseAnimesTagged
   * @param  {string} tag   Tag of the animations to pause.
   * @return {SystemAnime}  System itself.
   */
  pauseAnimesTagged(tag) {
    if (this.timers[tag]) {
      removeItems(this.activeTags, this.activeTags.indexOf(tag), 1);
      this.deactiveTags.push(tag);
    }

    return this;
  }

  /**
   * Resume animations with a specific tag.
   * @memberof SystemAnime#
   * @method resumeAnimesTagged
   * @param  {string} tag     Tag of the animations to resume.
   * @return {SySystemAnime}  System itself.
   */
  resumeAnimesTagged(tag) {
    if (this.timers[tag]) {
      removeItems(this.deactiveTags, this.deactiveTags.indexOf(tag), 1);
      this.activeTags.push(tag);
    }

    return this;
  }

  /**
   * Create a tween for an object.
   * @method tween
   * @memberOf SystemAnime#
   * @param {Oblject} context Context of this tween.
   * @param {string}  [tag]   Tag of this tween (default is '0').
   * @return {module:engine/anime/tween~Tween} Tween instance.
   */
  tween(context, tag = '0') {
    if (!this.anims[tag]) {
      // Create a new tween list
      this.anims[tag] = [];

      // Active new tag by default
      this.activeTags.push(tag);
    }

    let tween = Tween.create(context);
    this.anims[tag].push(tween);

    return tween;
  }

  /**
   * Run an action on a target object
   * @memberof SystemAnime#
   * @method runAction
   * @param {module:engine/animation/action~Action}  action Action to run
   * @param {object}  target Target object
   * @param {string}  [tag]  Tag of this action player (default is '0')
   * @return {module:engine/anime/action~ActionPlayer}  An ActionPlayer instance that runs the specific Action
   */
  runAction(action, target, tag = '0') {
    if (!this.anims[tag]) {
      // Create a new tween list
      this.anims[tag] = [];

      // Active new tag by default
      this.activeTags.push(tag);
    }

    let player = ActionPlayer.create(action, target);
    this.anims[tag].push(player);

    return player;
  }
}

module.exports = SystemAnime;
