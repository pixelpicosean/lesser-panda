/**
 * @module engine/timer
 */

var Scene = require('engine/scene');
var utils = require('engine/utils');

/**
 * @class Timer
 * @constructor
 * @param {Number} [ms]
 */
function Timer(ms) {
  /**
   * @property {Number} _count
   * @private
   */
  this._count = 0;

  /**
   * Duration of this timer
   * @property {Number} duration
   */
  this.duration = 0;

  /**
   * Whether this timer should repeat
   * @type {Boolean}
   */
  this.repeat = false;

  /**
   * Whether this timer is already removed
   * @type {Boolean}
   */
  this.removed = false;

  this.callback = null;
  this.callbackCtx = null;

  this.set(ms);
}

/**
 * Set duration for timer.
 * @method set
 * @param {Number} ms
 */
Timer.prototype.set = function set(ms) {
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
 */
Timer.prototype.reset = function reset() {
  this.removed = false;
  this._count = this.duration;
  return this;
};

/**
 * Pause timer.
 * @method pause
 */
Timer.prototype.pause = function pause() {
  this.paused = true;
  return this;
};

/**
 * Resume paused timer.
 * @method resume
 */
Timer.prototype.resume = function resume() {
  this.paused = false;
  return this;
};

/**
 * Update method that is called by timer system.
 * @param  {Number} delta Delta time
 */
Timer.prototype.update = function update(delta) {
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
 * @property {Number} elapsed Time elapsed since start.
 * @readOnly
 */
Object.defineProperty(Timer.prototype, 'elapsed', {
  get: function() {
    return this.duration - this._count;
  },
});

/**
 * @property {Number} left Time left till the end.
 * @readOnly
 */
Object.defineProperty(Timer.prototype, 'left', {
  get: function() {
    return this._count;
  },
});

// Pool timer instances
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
   *  @property {Number} delta
   */
  delta: 0,
  /**
   * A cumulative number represents how long has passed since the
   * game is launched (in milliseconds).
   *  @property {Number}
   */
  now: 0,
  /**
   * Map of timers
   *  @property {Object}
   */
  timers: {
    '0': [],
  },
  activeTags: ['0'],
  deactiveTags: [],
  /**
   * Update timer system.
   *  @property {Number} update
   */
  update: function update(delta) {
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
   * @memberOf Timer
   * @param {Number} wait        Time in milliseconds
   * @param {Function}  callback  Callback function to run, when timer ends
   * @param {Object}    context   Context of the callback to be invoked
   * @param {String}    tag       Tag of this timer, default is '0'
   * @return {Timer}
   */
  later: function later(wait, callback, context, tag) {
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
   * @memberOf Timer
   * @see Timer.later
   */
  laterSec: function laterSec(wait, callback, context, tag) {
    this.later(Math.floor(wait * 1000), callback, context, tag);
  },

  /**
   * Create a repeat timer.
   * @memberOf Timer
   * @param {Number} interval    Time in milliseconds
   * @param {Function}  callback  Callback function to run, when timer ends
   * @param {Object}    context   Context of the callback to be invoked
   * @param {String}    tag       Tag of this timer, default is '0'
   * @return {Timer}
   */
  interval: function interval(interval, callback, context, tag) {
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
   * @memberOf Timer
   * @see Timer.interval
   */
  intervalSec: function intervalSec(interval, callback, context, tag) {
    this.later(Math.floor(interval * 1000), callback, context, tag);
  },

  /**
   * Remove a timer.
   * @memberOf Timer
   * @param {Timer} timer
   */
  remove: function remove(timer) {
    if (timer) timer.removed = true;
  },

  /**
   * Pause timers with a specific tag.
   * @memberOf Timer
   * @param  {String} tag
   */
  pauseTimersTagged: function pauseTimersTagged(tag) {
    if (this.timers[tag]) {
      utils.removeItems(this.activeTags, this.activeTags.indexOf(tag), 1);
      this.deactiveTags.push(tag);
    }

    return this;
  },

  /**
   * Resume timers with a specific tag.
   * @memberOf Timer
   * @param  {String} tag
   */
  resumeTimersTagged: function resumeTimersTagged(tag) {
    if (this.timers[tag]) {
      utils.removeItems(this.deactiveTags, this.deactiveTags.indexOf(tag), 1);
      this.activeTags.push(tag);
    }

    return this;
  },
});

module.exports = Timer;
