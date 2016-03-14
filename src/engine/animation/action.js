var Scene = require('engine/scene');
var EventEmitter = require('engine/eventemitter3');

var animUtils = require('./utils');
var getTargetAndKey = animUtils.getTargetAndKey;

var easing = require('./easing');
var Easing = easing.Easing;
var Interpolation = easing.Interpolation;

var CHANNEL_TYPE = {
  VALUE: 0,
  EVENT: 1,
};

function Key(time, value, easing) {
  /**
   * Time of this key
   * @type {Number}
   */
  this.time = time;

  /**
   * Value of this key
   * @type {Any}
   */
  this.value = value;

  var easingFn = easing || Easing.Linear.None;
  if (typeof(easing) === 'string') {
    easing = easing.split('.');
    easingFn = Easing[easing[0]][easing[1]];
  }

  /**
   * Easing of this key
   * @type {Function}
   */
  this.easing = easingFn;
}

function Channel(path, type) {
  /**
   * Full path to the property
   * @type {String}
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
   * @type {String|Number}
   */
  this.type = theType;

  /**
   * Key list
   * @type {Array.<Key>}
   */
  this.keys = [];
}
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
};

function Action(id) {
  /**
   * ID of this action
   * @type {Number}
   */
  this.id = id;
  /**
   * Duration of this action (time between first and last key)
   * @type {Number}
   */
  this.duration = 0;
  /**
   * Channel list
   * @type {Array.<Channel>}
   */
  this.channels = [];
  /**
   * <Path, Channel> map
   */
  this.channelMap = {};

  // Internal caches
  this._latestChannel = null;
}
Action.prototype.channel = function(path, type) {
  var channel = new Channel(path, type);

  this.channels.push(channel);
  this.channelMap[path] = channel;

  this._latestChannel = channel;

  return this;
};
Action.prototype.key = function(time, value, easing) {
  if (!this._latestChannel) {
    console.log('[Warning]: can not insert key without a channel!');
    return this;
  }

  var key = new Key(time, value, easing);
  this._latestChannel.insert(key);

  this.duration = Math.max(this.duration, key.time);

  return this;
};
var ActionUID = 0;
Action.create = function create() {
  return new Action(ActionUID++);
};

function ActionPlayer(action, target) {
  EventEmitter.call(this);

  this.action = action;
  this.context = target;

  this.channelCache = [];

  /**
   * Play speed (-1: reverse, 0: stop, 1: forward)
   * @type {Number}
   * @default 1
   */
  this.speed = 1;

  /**
   * Current time
   * @type {Number}
   * @default 0
   */
  this.time = 0;

  /**
   * Whether this action is finished
   * @type {Boolean}
   * @default false
   */
  this.finished = false;

  /**
   * Loop the action or not
   * @type {Boolean}
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
 * @param  {Number} time
 */
ActionPlayer.prototype.goto = function goto(time) {};

ActionPlayer.create = function create(action, target) {
  return new ActionPlayer(action, target);
};

// Inject action factory method
Object.assign(Scene.prototype, {
  /**
   * Run an action on a target object
   * @method runAction
   * @param {Action}  action Action to run
   * @param {Object}  target Target object
   * @param {String}  tag    Tag of this action player (default is '0')
   * @return {ActionPlayer}  An ActionPlayer instance that runs the specific Action
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
