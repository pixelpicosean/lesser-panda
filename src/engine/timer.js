var Scene = require('engine/scene');
var utils = require('engine/utils');

/**
  @class Timer
  @constructor
  @param {Number} [ms]
**/
function Timer(ms) {
  /**
    Timer's target time.
    @property {Number} target
  **/
  this.target = 0;
  /**
    Timer's base time.
    @property {Number} base
  **/
  this.base = 0;
  /**
    @property {Number} _last
    @private
  **/
  this._last = Timer.time;
  /**
    @property {Number} _pauseTime
    @private
  **/
  this._pauseTime = 0;

  this.callback = null;
  this.callbackCtx = null;

  this.set(ms);
}

/**
  Set time for timer.
  @method set
  @param {Number} ms
**/
Timer.prototype.set = function set(ms) {
  if (typeof ms !== 'number') ms = 0;
  this.target = ms;
  this.reset();
};

/**
  Reset timer.
  @method reset
**/
Timer.prototype.reset = function reset() {
  this.base = Timer.time;
  this._pauseTime = 0;
};

/**
  Get time since last delta.
  @method delta
  @return {Number} delta
**/
Timer.prototype.delta = function delta() {
  var delta = Timer.time - this._last;
  this._last = Timer.time;
  return this._pauseTime ? 0 : delta;
};

/**
  Get time since start.
  @method time
  @return {Number} time
**/
Timer.prototype.time = function time() {
  var time = (this._pauseTime || Timer.time) - this.base - this.target;
  return time;
};

/**
  Pause timer.
  @method pause
**/
Timer.prototype.pause = function pause() {
  if (!this._pauseTime) this._pauseTime = Timer.time;
};

/**
  Resume paused timer.
  @method resume
**/
Timer.prototype.resume = function resume() {
  if (this._pauseTime) {
    this.base += Timer.time - this._pauseTime;
    this._pauseTime = 0;
  }
};

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
    Current time.
    @attribute {Number} time
  **/
  time: 0,
  /**
    Delta since last frame (ms).
    @attribute {Number} delta
  **/
  delta: 0,
  /**
   * List of current running timer instances
   * @type {Array<Timer>}
   */
  timers: [],
  /**
   * Update timer system.
   * @attribute {Function} update
   */
  update: function update(delta) {
    this.delta = delta;
    this.time += this.delta;

    // Update timers
    var timer;
    for (var i = 0; i < this.timers.length; i++) {
      timer = this.timers[i];
      if (timer.time() > 0) {
        if (typeof timer.callback === 'function') {
          timer.callback.call(timer.callbackCtx);
        }

        if (timer.repeat) {
          timer.reset();
        }
        else {
          utils.removeItems(this.timers, i--, 1);
        }
      }
    }
  },

  /**
   * Create a not repeat timer.
   * @param {Number} wait        Time in milliseconds
   * @param {Function} callback  Callback function to run, when timer ends
   * @param {Object}   context   Context of the callback to be invoked
   * @return {Timer}
   */
  later: function later(wait, callback, context) {
    var timer = createTimer(wait);

    timer.repeat = false;
    timer.callback = callback;
    timer.callbackCtx = context;
    this.timers.push(timer);

    return timer;
  },

  /**
   * Create a repeat timer.
   * @param {Number} interval    Time in milliseconds
   * @param {Function} callback  Callback function to run, when timer ends
   * @param {Object}   context   Context of the callback to be invoked
   * @return {Timer}
   */
  interval: function interval(interval, callback, context) {
    var timer = createTimer(interval);

    timer.repeat = true;
    timer.callback = callback;
    timer.callbackCtx = context;
    this.timers.push(timer);

    return timer;
  },
  /**
    Remove a running timer.
    @param {Timer} timer
  **/
  remove: function remove(timer) {
    if (!timer) return;
    timer.callback = null;
    timer.callbackCtx = null;
    timer.repeat = false;
    timer.set(0);

    recycleTimer(timer);
  },
});

module.exports = Timer;
