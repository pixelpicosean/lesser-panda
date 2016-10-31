const System = require('engine/system');
const { removeItems } = require('engine/utils/array');

/**
 * @class Timer
 */
class Timer {
  /**
   * @property {number} elapsed   Time elapsed since start.
   * @readonly
   */
  get elapsed() { return this.duration - this._count }

  /**
   * @property {number} left  Time left till the end.
   * @readonly
   */
  get left() { return this._count }

  /**
   * Timer constructor should not be used directly, use the static methods instead:
   *
   * - {@link Timer.later}
   * - {@link Timer.laterSec}
   * - {@link Timer.interval}
   * - {@link Timer.intervalSec}
   *
   * @constructor
   * @param {number} [ms]
   */
  constructor(ms) {
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
  set(ms) {
    if (Number.isFinite(ms)) {
      this.duration = ms;
    }
    else {
      this.duration = 0;
    }
    return this.reset();
  }

  /**
   * Reset timer to current duration.
   * @method reset
   * @memberof Timer#
   */
  reset() {
    this.removed = false;
    this._count = this.duration;
    return this;
  }

  /**
   * Pause timer.
   * @method pause
   * @memberof Timer#
   */
  pause() {
    this.paused = true;
    return this;
  }

  /**
   * Resume paused timer.
   * @method resume
   * @memberof Timer#
   */
  resume() {
    this.paused = false;
    return this;
  }

  /**
   * Update method that is called by timer system.
   * @method update
   * @memberof Timer#
   * @protected
   * @param  {number} delta Delta time
   */
  update(delta) {
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
  }
}

/**
 * Timer instance pool
 * @type {array<Timer>}
 * @private
 */
const pool = [];
function createTimer(ms) {
  let t = pool.pop();
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

/**
 * Timer system.
 */
class SystemTimer extends System {
  constructor() {
    super();

    this.name = 'sTimer';

    this.delta = 0;
    this.now = 0;
    this.timers = {
      '0': [],
    };
    this.activeTags = ['0'];
    this.deactiveTags = [];
  }

  update(delta) {
    this.delta = delta;

    this.now += delta;

    let i, key, timers;
    for (key in this.timers) {
      if (this.activeTags.indexOf(key) < 0) continue;

      timers = this.timers[key];
      for (i = 0; i < timers.length; i++) {
        if (!timers[i].removed) {
          timers[i].update(delta);
        }
        if (timers[i].removed) {
          recycleTimer(timers[i]);
          removeItems(timers, i--, 1);
        }
      }
    }
  }

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
  later(wait, callback, context, tag = '0') {
    let timer = createTimer(wait);

    timer.repeat = false;
    timer.callback = callback;
    timer.callbackCtx = context;

    if (!this.timers[tag]) {
      // Create a new timer list
      this.timers[tag] = [];

      // Active new tag by default
      this.activeTags.push(tag);
    }

    if (this.timers[tag].indexOf(timer) < 0) {
      this.timers[tag].push(timer);
    }

    return timer;
  }
  /**
   * Create an one-shoot timer while the time is in seconds instead.
   * @memberof Timer
   * @method laterSec
   * @see Timer.later
   */
  laterSec(wait, callback, context, tag = '0') {
    this.later(Math.floor(wait * 1000), callback, context, tag);
  }

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
  interval(interval, callback, context, tag = '0') {
    let timer = createTimer(interval);

    timer.repeat = true;
    timer.callback = callback;
    timer.callbackCtx = context;

    if (!this.timers[tag]) {
      // Create a new timer list
      this.timers[tag] = [];

      // Active new tag by default
      this.activeTags.push(tag);
    }

    if (this.timers[tag].indexOf(timer) < 0) {
      this.timers[tag].push(timer);
    }

    return timer;
  }
  /**
   * Create a repeat timer while the time is in seconds instead.
   * @memberof Timer
   * @method intervalSec
   * @see Timer.interval
   */
  intervalSec(interval, callback, context, tag = '0') {
    this.later(Math.floor(interval * 1000), callback, context, tag);
  }

  /**
   * Remove a timer.
   * @memberof Timer
   * @method remove
   * @param {Timer} timer
   */
  remove(timer) {
    if (timer) timer.removed = true;
  }

  /**
   * Pause timers with a specific tag.
   * @memberof Timer
   * @method pauseTimersTagged
   * @param  {string} tag
   */
  pauseTimersTagged(tag) {
    if (this.timers[tag]) {
      removeItems(this.activeTags, this.activeTags.indexOf(tag), 1);
      this.deactiveTags.push(tag);
    }

    return this;
  }

  /**
   * Resume timers with a specific tag.
   * @memberof Timer
   * @method resumeTimersTagged
   * @param  {string} tag
   */
  resumeTimersTagged(tag) {
    if (this.timers[tag]) {
      removeItems(this.deactiveTags, this.deactiveTags.indexOf(tag), 1);
      this.activeTags.push(tag);
    }

    return this;
  }
}

module.exports = SystemTimer;
