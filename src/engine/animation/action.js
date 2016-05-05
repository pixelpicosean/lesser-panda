/**
 * Action module provides functionalities to create Flash/Blender like
 * key based animation.
 *
 * @module engine/animation/action
 *
 * @requires engine/scene
 * @requires engine/eventemitter3
 * @requires engine/animation/utils
 * @requires engine/animation/easing
 */

var Scene = require('engine/scene');
var EventEmitter = require('engine/eventemitter3');

var animUtils = require('./utils');
var getTargetAndKey = animUtils.getTargetAndKey;

var easing = require('./easing');
var Easing = easing.Easing;
var Interpolation = easing.Interpolation;

/**
 * Type of channels
 * @enum {number}
 */
var CHANNEL_TYPE = {
  VALUE: 0,
  EVENT: 1,
};

/**
 * A single key of an action.
 * @class Key
 * @constructor
 * @param {number} time     At which time.
 * @param {*} value         Value for this key.
 * @param {function} easing Easing function.
 */
function Key(time, value, easing) {
  /**
   * Time of this key
   * @type {number}
   */
  this.time = time;

  /**
   * Value of this key.
   * @type {*}
   */
  this.value = value;

  var easingFn = easing || Easing.Linear.None;
  if (typeof(easing) === 'string') {
    easing = easing.split('.');
    easingFn = Easing[easing[0]][easing[1]];
  }

  /**
   * Easing of this key.
   * @type {function}
   */
  this.easing = easingFn;
}

/**
 * Channel represents a specific path of variable. Say we have an
 * action that modifies `position` and two channels will be created
 * for that as `position.x` and `position.y`.
 * @class Channel
 * @constructor
 * @param {string} path       Path of the target variable.
 * @param {Action} owner      Which action this channel is in.
 * @param {CHANNEL_TYPE} type Type of this channel.
 */
function Channel(path, owner, type) {
  /**
   * Which action is this channel belongs to
   * @type {module:engine/animation/action~Action}
   */
  this.owner = owner;

  /**
   * Full path to the property
   * @type {string}
   */
  this.path = path;

  var theType = type || CHANNEL_TYPE.VALUE;
  if (typeof(type) === 'string') {
    theType = CHANNEL_TYPE[type.toUpperCase()];
  }
  /**
   * Type of this channel, valid types are:
   * - VALUE
   * - EVENT
   * @type {string|number}
   */
  this.type = theType;

  /**
   * Key list.
   * @type {array<module:engine/animation/action~Key>}
   */
  this.keys = [];

  /**
   * Time between the first and last key.
   * @type {number}
   */
  this.duration = 0;
}
/**
 * Insert a new key.
 * @memberof Channel#
 * @method insert
 * @param  {module:engine/animation/action~Key} key Key to insert.
 */
Channel.prototype.insert = function insert(key) {
  this.keys.push(key);

  // Sort keys based on their times
  var i, tmpKey;
  for (i = this.keys.length - 1; i > 0; i--) {
    if (this.keys[i].time < this.keys[i - 1].time) {
      tmpKey = this.keys[i - 1];
      this.keys[i - 1] = this.keys[i];
      this.keys[i] = tmpKey;
    }
    else {
      break;
    }
  }

  // Update duration
  this.duration = this.keys[this.keys.length - 1].time;

  // Update duration of owner Action
  this.owner.duration = Math.max(this.owner.duration, this.duration);
};
/**
 * Find the key at a specific time.
 * @param  {number} time  Time to seek for.
 * @return {module:engine/animation/action~Key}          Will return undefined if no one can be found.
 */
Channel.prototype.findKey = function(time) {
  // Empty channel
  if (this.keys.length === 0) {
    return undefined;
  }

  // Return the last key if time is
  // larger than channel duration
  if (time > this.duration) {
    return this.keys[this.keys.length - 1];
  }

  // Find the key and return
  var i, key = this.keys[0];
  for (i = 0; i < this.keys.length - 1; i++) {
    key = this.keys[i];
    if (this.keys[i + 1].time > time) {
      return key;
    }
  }

  // Return the last key
  return key;
};

/**
 * Action is a data structure that represents an independent
 * animation clip.
 *
 * `Action.create()` is prefered to create a new Action.
 *
 * @class Action
 * @constructor
 * @param {number} id
 */
function Action(id) {
  /**
   * ID of this action
   * @type {number}
   */
  this.id = id;
  /**
   * Duration of this action (time between first and last key).
   * @type {number}
   */
  this.duration = 0;
  /**
   * Channel list.
   * @type {array<module:engine/animation/action~Channel>}
   */
  this.channels = [];
  /**
   * <Path, Channel> map
   * @type {object}
   */
  this.channelMap = {};

  // Internal caches
  this._latestChannel = null;
}
/**
 * Insert a new channel.
 * @memberof Action#
 * @method channel
 * @see Channel
 * @param  {string} path        Path of the channel.
 * @param  {CHANNEL_TYPE} type  Type of this channel.
 * @return {module:engine/animation/action~Action}             Self for chaining.
 */
Action.prototype.channel = function(path, type) {
  var channel = new Channel(path, this, type);

  this.channels.push(channel);
  this.channelMap[path] = channel;

  this._latestChannel = channel;

  return this;
};
/**
 * Insert a new key to the last inserted channel.
 * @memberof Action#
 * @method key
 * @param  {number} time      Time of the key.
 * @param  {*} value          Value of the key.
 * @param  {function} easing  Easing function.
 * @return {module:engine/animation/action~Action}           Self for chaining
 */
Action.prototype.key = function(time, value, easing) {
  if (!this._latestChannel) {
    console.log('[Warning]: can not insert key without a channel!');
    return this;
  }

  this._latestChannel.insert(new Key(time, value, easing));

  return this;
};
/**
 * Find a channel by path.
 * @memberof Action#
 * @method findChannel
 * @param  {string} path
 * @return {module:engine/animation/action~Channel}
 */
Action.prototype.findChannel = function(path) {
  return this.channelMap[path];
};
var ActionUID = 0;
/**
 * Create a new action.
 * @return {module:engine/animation/action~Action}
 */
Action.create = function create() {
  return new Action(ActionUID++);
};

/**
 * Action player controls and plays an action defination.
 *
 * Usually you only need to run an action using {@link Scene#runAction}.
 *
 * @class ActionPlayer
 * @constructor
 * @param {module:engine/animation/action~Action} action Action to play.
 * @param {object} target Target object this action is apply to.
 */
function ActionPlayer(action, target) {
  EventEmitter.call(this);

  this.action = action;
  this.context = target;

  this.channelCache = [];

  /**
   * Play speed (-1: reverse, 0: stop, 1: forward)
   * @type {number}
   * @default 1
   */
  this.speed = 1;

  /**
   * Current time
   * @type {number}
   * @default 0
   */
  this.time = 0;

  /**
   * Whether this action is finished
   * @type {boolean}
   * @default false
   */
  this.finished = false;

  /**
   * Loop the action or not
   * @type {boolean}
   * @default false
   */
  this.looped = true;

  var channel, props = [], channels = this.action.channels;
  for (var i = 0; i < channels.length; i++) {
    // Channel: [propContext, propKey]
    channel = getTargetAndKey(this.context, channels[i].path);
    // Channel: [propContext, propKey, keys[], currKeyIdx]
    channel.push(channels[i].keys, 0);
    this.channelCache.push(channel);
  }
}
ActionPlayer.prototype = Object.create(EventEmitter.prototype);
ActionPlayer.prototype.constructor = ActionPlayer;

ActionPlayer.prototype._step = function _step(delta) {
  var c, channel;
  var keys, keyIdx, key, nextKey;
  var length, progress, mod, change;

  // Update time
  this.time += delta * this.speed;

  // Forward
  if (this.speed > 0) {
    // Reached the last frame?
    if (this.time >= this.action.duration) {
      if (this.looped) {
        this.time = this.time % this.action.duration;
        // Reset channels to their first keys
        for (c = 0; c < this.channelCache.length; c++) {
          channel = this.channelCache[c];
          channel[3] = 0;
        }

        this.emit('loop', this);
      }
      else {
        this.time = this.action.duration;
        this.finished = true;

        this.emit('finish', this);

        return;
      }
    }

    // Update animated channels
    for (c = 0; c < this.channelCache.length; c++) {
      channel = this.channelCache[c];

      // Already passed the last key?
      if (this.time > channel.duration)
        continue;

      keys = channel[2];
      keyIdx = channel[3];

      // Reached next key?
      if (keyIdx < channel[2].length - 2 && this.time >= channel[2][keyIdx + 1].time) {
        keyIdx += 1;
        channel[3] = keyIdx;
      }

      // Calculate progress of current key
      key = keys[keyIdx];
      nextKey = keys[keyIdx + 1];
      length = nextKey.time - key.time;
      change = nextKey.value - key.value;
      progress = (this.time - key.time) / length;
      mod = key.easing(progress);

      // Update action target
      channel[0][channel[1]] = key.value + change * mod;

      // TODO: event keys
    }
  }
  // Backward
  else if (this.speed < 0) {
    // Reached the first frame?
    if (this.time < 0) {
      if (this.looped) {
        this.time += this.action.duration;
        // Reset channels to their last keys
        for (c = 0; c < this.channelCache.length; c++) {
          channel = this.channelCache[c];
          channel[3] = Math.max(channel[2].length - 2, 0);
        }

        this.emit('loop', this);
      }
      else {
        this.time = 0;
        this.finished = true;

        this.emit('finish', this);

        return;
      }
    }

    // Update animated channels
    for (c = 0; c < this.channelCache.length; c++) {
      channel = this.channelCache[c];
      keys = channel[2];
      keyIdx = channel[3];

      // Reached previous key?
      if (keyIdx > 0 && this.time < channel[2][keyIdx].time) {
        keyIdx -= 1;
        channel[3] = keyIdx;
      }

      // Calculate progress of current key
      key = keys[keyIdx];
      nextKey = keys[keyIdx + 1];
      length = nextKey.time - key.time;
      change = nextKey.value - key.value;
      progress = (this.time - key.time) / length;
      mod = key.easing(progress);

      // Update action target
      channel[0][channel[1]] = key.value + change * mod;

      // TODO: event keys
    }
  }
};
/**
 * Go to a specific time
 * @memberof ActionPlayer#
 * @method goto
 * @param  {number} time
 */
ActionPlayer.prototype.goto = function goto(time) {};

/**
 * Create a player for actor
 * @param  {module:engine/animation/action~Action} action
 * @param  {object} target
 * @return {module:engine/animation/action~ActionPlayer}
 */
ActionPlayer.create = function create(action, target) {
  return new ActionPlayer(action, target);
};

// Inject action factory method
Object.assign(Scene.prototype, {
  /**
   * Run an action on a target object
   * @memberof Scene#
   * @method runAction
   * @param {module:engine/animation/action~Action}  action Action to run
   * @param {object}  target Target object
   * @param {string}  tag    Tag of this action player (default is '0')
   * @return {module:engine/animation/action~ActionPlayer}  An ActionPlayer instance that runs the specific Action
   */
  runAction: function runAction(action, target, tag) {
    var t = tag || '0';

    if (!this.animationSystem.anims[t]) {
      // Create a new tween list
      this.animationSystem.anims[t] = [];

      // Active new tag by default
      this.animationSystem.activeTags.push(t);
    }

    var player = ActionPlayer.create(action, target);
    this.animationSystem.anims[t].push(player);

    return player;
  },
});

module.exports = {
  CHANNEL_TYPE: CHANNEL_TYPE,

  Key: Key,
  Channel: Channel,
  Action: Action,
  ActionPlayer: ActionPlayer,
};
