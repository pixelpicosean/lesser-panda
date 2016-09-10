'use strict';

var Scene = require('engine/scene');
var utils = require('engine/utils');

/**
 * Timer constructor should not be used directly, use the static methods instead:
 *
 * - {@link Timer.later}
 * - {@link Timer.laterSec}
 * - {@link Timer.interval}
 * - {@link Timer.intervalSec}
 *
 * @class Timer
 *
 * @constructor
 * @param {number} [ms]
 */
function Timer(ms) {
  /**
   * @type {number}
   * @private
   */
  this._count = 0;

  /**
   * Duration of this timer.
   * @type {number}
   * @default 0
   */
  this.duration = 0;

  /**
   * Whether this timer should repeat.
   * @type {boolean}
   * @default false
   */
  this.repeat = false;

  /**
   * Whether this timer is already removed.
   * @type {boolean}
   * @protected
   * @default false
   */
  this.removed = false;

  /**
   * Callback
   * @type {function}
   * @private
   */
  this.callback = null;
  /**
   * Callback context
   * @type {object}
   * @private
   */
  this.callbackCtx = null;

  this.set(ms);
}

/**
 * Set duration for timer.
 * @method set
 * @memberof Timer#
 * @param {number} ms
 */
Timer.prototype.set = function(ms) {
  if (typeof ms !== 'number') {
    this.duration = 0;
  }
  else {
    this.duration = ms;
  }
  return this.reset();
};

/**
 * Reset timer to current duration.
 * @method reset
 * @memberof Timer#
 */
Timer.prototype.reset = function() {
  this.removed = false;
  this._count = this.duration;
  return this;
};

/**
 * Pause timer.
 * @method pause
 * @memberof Timer#
 */
Timer.prototype.pause = function() {
  this.paused = true;
  return this;
};

/**
 * Resume paused timer.
 * @method resume
 * @memberof Timer#
 */
Timer.prototype.resume = function() {
  this.paused = false;
  return this;
};

/**
 * Update method that is called by timer system.
 * @method update
 * @memberof Timer#
 * @protected
 * @param  {number} delta Delta time
 */
Timer.prototype.update = function(delta) {
  if (this.removed || this.paused) return;

  this._count -= delta;
  if (this._count < 0) {
    this._count = 0;

    if (typeof this.callback === 'function') {
      this.callback.call(this.callbackCtx);
    }

    if (this.repeat && !this.removed) {
      this.reset();
    }
    else {
      this.removed = true;
    }
  }
};

/**
 * @property {number} elapsed Time elapsed since start.
 * @readonly
 */
Object.defineProperty(Timer.prototype, 'elapsed', {
  get: function() {
    return this.duration - this._count;
  },
});

/**
 * @property {number} left Time left till the end.
 * @readonly
 */
Object.defineProperty(Timer.prototype, 'left', {
  get: function() {
    return this._count;
  },
});

/**
 * Timer instance pool
 * @type {array<Timer>}
 * @private
 */
var pool = [];
function createTimer(ms) {
  var t = pool.pop();
  if (!t) {
    t = new Timer(ms);
  }
  else {
    Timer.call(t, ms);
  }
  return t;
}
function recycleTimer(timer) {
  pool.push(timer);
}

// Timer static properties and functions
Object.assign(Timer, {
  /**
   * Delta since last frame (ms).
   * @memberof Timer
   * @type {number}
   */
  delta: 0,
  /**
   * A cumulative number represents how long has passed since the
   * game is launched (in milliseconds).
   * @memberof Timer
   * @type {number}
   */
  now: 0,
  /**
   * Map of timers
   * @memberof Timer
   * @type {object}
   */
  timers: {
    '0': [],
  },
  activeTags: ['0'],
  deactiveTags: [],
  /**
   * Update timer system.
   * @memberof Timer
   * @method update
   * @protected
   */
  update: function(delta) {
    this.delta = delta;

    this.now += delta;

    var i, key, timers;
    for (key in this.timers) {
      if (this.activeTags.indexOf(key) < 0) continue;

      timers = this.timers[key];
      for (i = 0; i < timers.length; i++) {
        if (!timers[i].removed) {
          timers[i].update(delta);
        }
        if (timers[i].removed) {
          recycleTimer(timers[i]);
          utils.removeItems(timers, i--, 1);
        }
      }
    }
  },

  /**
   * Create an one-shoot timer.
   * @memberof Timer
   * @method later
   * @param {number}    wait      Time in milliseconds
   * @param {function}  callback  Callback function to run, when timer ends
   * @param {object}    context   Context of the callback to be invoked
   * @param {string}    tag       Tag of this timer, default is '0'
   * @return {Timer}
   */
  later: function(wait, callback, context, tag) {
    var t = tag || '0';
    var timer = createTimer(wait);

    timer.repeat = false;
    timer.callback = callback;
    timer.callbackCtx = context;

    if (!this.timers[t]) {
      // Create a new timer list
      this.timers[t] = [];

      // Active new tag by default
      this.activeTags.push(t);
    }

    if (this.timers[t].indexOf(timer) < 0) {
      this.timers[t].push(timer);
    }

    return timer;
  },
  /**
   * Create an one-shoot timer while the time is in seconds instead.
   * @memberof Timer
   * @method laterSec
   * @see Timer.later
   */
  laterSec: function(wait, callback, context, tag) {
    this.later(Math.floor(wait * 1000), callback, context, tag);
  },

  /**
   * Create a repeat timer.
   * @memberof Timer
   * @method interval
   * @param {number}    interval  Time in milliseconds
   * @param {function}  callback  Callback function to run, when timer ends
   * @param {object}    context   Context of the callback to be invoked
   * @param {string}    tag       Tag of this timer, default is '0'
   * @return {Timer}
   */
  interval: function(interval, callback, context, tag) {
    var t = tag || '0';
    var timer = createTimer(interval);

    timer.repeat = true;
    timer.callback = callback;
    timer.callbackCtx = context;

    if (!this.timers[t]) {
      // Create a new timer list
      this.timers[t] = [];

      // Active new tag by default
      this.activeTags.push(t);
    }

    if (this.timers[t].indexOf(timer) < 0) {
      this.timers[t].push(timer);
    }

    return timer;
  },
  /**
   * Create a repeat timer while the time is in seconds instead.
   * @memberof Timer
   * @method intervalSec
   * @see Timer.interval
   */
  intervalSec: function(interval, callback, context, tag) {
    this.later(Math.floor(interval * 1000), callback, context, tag);
  },

  /**
   * Remove a timer.
   * @memberof Timer
   * @method remove
   * @param {Timer} timer
   */
  remove: function(timer) {
    if (timer) timer.removed = true;
  },

  /**
   * Pause timers with a specific tag.
   * @memberof Timer
   * @method pauseTimersTagged
   * @param  {string} tag
   */
  pauseTimersTagged: function(tag) {
    if (this.timers[tag]) {
      utils.removeItems(this.activeTags, this.activeTags.indexOf(tag), 1);
      this.deactiveTags.push(tag);
    }

    return this;
  },

  /**
   * Resume timers with a specific tag.
   * @memberof Timer
   * @method resumeTimersTagged
   * @param  {string} tag
   */
  resumeTimersTagged: function(tag) {
    if (this.timers[tag]) {
      utils.removeItems(this.deactiveTags, this.deactiveTags.indexOf(tag), 1);
      this.activeTags.push(tag);
    }

    return this;
  },
});

/**
 * @exports engine/timer
 * @see Timer
 *
 * @requires engine/scene
 * @requires engine/utils
 */
module.exports = Timer;
