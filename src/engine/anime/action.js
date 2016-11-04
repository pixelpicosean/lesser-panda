/**
 * Action module provides functionalities to create Flash/Blender like
 * key based animation.
 *
 * @module engine/anime/action
 *
 * @requires engine/EventEmitter
 * @requires engine/anime/utils
 * @requires engine/anime/easing
 */

const EventEmitter = require('engine/EventEmitter');

const { getTargetAndKey } = require('./utils');
const { Easing } = require('./easing');

/**
 * Type of channels
 * @enum {number}
 */
const CHANNEL_TYPE = {
  VALUE: 0,
  EVENT: 1,
};

/**
 * A single key of an action.
 * @class Key
 */
class Key {
  /**
   * @constructor
   * @param {number} time     At which time.
   * @param {*} value         Value for this key.
   * @param {function} easing Easing function.
   */
  constructor(time, value, easing = Easing.Linear.None) {
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

    let easingFn = easing;
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
}

/**
 * Channel represents a specific path of variable. Say we have an
 * action that modifies `position` and two channels will be created
 * for that as `position.x` and `position.y`.
 * @class Channel
 */
class Channel {
  /**
   * @constructor
   * @param {string} path       Path of the target variable.
   * @param {Action} owner      Which action this channel is in.
   * @param {CHANNEL_TYPE} type Type of this channel.
   */
  constructor(path, owner, type = CHANNEL_TYPE.VALUE) {
    /**
     * Which action is this channel belongs to
     * @type {module:engine/anime/action~Action}
     */
    this.owner = owner;

    /**
     * Full path to the property
     * @type {string}
     */
    this.path = path;

    var theType = type;
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
     * @type {array<module:engine/anime/action~Key>}
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
   * @param  {module:engine/anime/action~Key} key Key to insert.
   */
  insert(key) {
    this.keys.push(key);

    // Sort keys based on their times
    let i, tmpKey;
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
  }
  /**
   * Find the key at a specific time.
   * @param  {number} time  Time to seek for.
   * @return {module:engine/anime/action~Key}          Will return undefined if no one can be found.
   */
  findKey(time) {
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
    let i, key = this.keys[0];
    for (i = 0; i < this.keys.length - 1; i++) {
      key = this.keys[i];
      if (this.keys[i + 1].time > time) {
        return key;
      }
    }

    // Return the last key
    return key;
  }
}

/**
 * Action is a data structure that represents an independent
 * animation clip.
 *
 * `Action.create()` is prefered to create a new Action.
 *
 * @class Action
 */
class Action {
  /**
   * @constructor
   */
  constructor() {
    /**
     * ID of this action
     * @type {number}
     */
    this.id = Action.nextId++;
    /**
     * Duration of this action (time between first and last key).
     * @type {number}
     */
    this.duration = 0;
    /**
     * Channel list.
     * @type {array<module:engine/anime/action~Channel>}
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
   * @return {module:engine/anime/action~Action}             Self for chaining.
   */
  channel(path, type) {
    let channel = new Channel(path, this, type);

    this.channels.push(channel);
    this.channelMap[path] = channel;

    this._latestChannel = channel;

    return this;
  }
  /**
   * Insert a new key to the last inserted channel.
   * @memberof Action#
   * @method key
   * @param  {number} time      Time of the key.
   * @param  {*} value          Value of the key.
   * @param  {function} easing  Easing function.
   * @return {module:engine/anime/action~Action}           Self for chaining
   */
  key(time, value, easing) {
    if (!this._latestChannel) {
      console.log('[Warning]: can not insert key without a channel!');
      return this;
    }

    this._latestChannel.insert(new Key(time, value, easing));

    return this;
  }
  /**
   * Find a channel by path.
   * @memberof Action#
   * @method findChannel
   * @param  {string} path Path to a specific channel.
   * @return {module:engine/anime/action~Channel} Channel with the path.
   */
  findChannel(path) {
    return this.channelMap[path];
  }
}

Action.nextId = 0;
/**
 * Create a new action.
 * @return {module:engine/anime/action~Action} Action instance.
 */
Action.create = function create() {
  return new Action();
};

/**
 * Action player controls and plays an action defination.
 *
 * Usually you only need to run an action using {@link Scene#runAction}.
 *
 * @class ActionPlayer
 */
class ActionPlayer extends EventEmitter {
  /**
   * @constructor
   * @param {module:engine/anime/action~Action} action Action to play.
   * @param {object} target Target object this action is apply to.
   */
  constructor(action, target) {
    super();

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

    let channel, channels = this.action.channels;
    for (let i = 0; i < channels.length; i++) {
      // Channel: [propContext, propKey]
      channel = getTargetAndKey(this.context, channels[i].path);
      // Channel: [propContext, propKey, keys[], currKeyIdx]
      channel.push(channels[i].keys, 0);
      this.channelCache.push(channel);
    }
  }

  /**
   * Update.
   * @memberof ActionPlayer
   * @private
   * @method _step
   * @param  {number} delta Delta time.
   */
  _step(delta) {
    let c, channel;
    let keys, keyIdx, key, nextKey;
    let length, progress, mod, change;

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
        if (this.time > channel.duration) {
          continue;
        }

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
  }
  /**
   * Go to a specific time
   * @memberof ActionPlayer#
   * @method goto
   * @param  {number} time The moment to go to.
   */
  goto(/* time*/) {}
}

/**
 * Create a player for actor
 * @param  {module:engine/anime/action~Action} action Action to play.
 * @param  {object} target Object this action will target.
 * @return {module:engine/anime/action~ActionPlayer} ActionPlayer instance.
 */
ActionPlayer.create = function(action, target) {
  return new ActionPlayer(action, target);
};

module.exports = {
  CHANNEL_TYPE: CHANNEL_TYPE,

  Key: Key,
  Channel: Channel,
  Action: Action,
  ActionPlayer: ActionPlayer,
};
