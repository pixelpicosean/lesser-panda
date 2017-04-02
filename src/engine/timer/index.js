import System from 'engine/System';
import { removeItems } from 'engine/utils/array';
import Clock from './Clock';

/**
 * Clock instance pool
 * @type {array<Clock>}
 * @private
 */
const pool = [];
/**
 * Clock factory
 * @private
 * @param  {Number} ms  Time in millisecond
 * @return {Clock}      Clock instance
 */
function createTimer(ms) {
  let t = pool.pop();
  if (!t) {
    t = new Clock(ms);
  }
  else {
    t.set(ms);
  }
  return t;
}
/**
 * Recycle a timer instance for later reuse
 * @private
 * @param  {Clock} timer Clock instance
 */
function recycleTimer(timer) {
  pool.push(timer);
}

/**
 * Clock system.
 */
export default class Timer extends System {
  /**
   * @constructor
   */
  constructor() {
    super();

    this.name = 'Timer';

    this.delta = 0;
    this.now = 0;
    this.timers = {
      '0': [],
    };
    this.activeTags = ['0'];
    this.deactiveTags = [];
  }

  /**
   * Update
   * @memberof Timer#
   * @param {Number} delta Delta time in millisecond
   */
  update(delta) {
    this.delta = delta;

    this.now += delta;

    let i, key, timers;
    for (key in this.timers) {
      if (this.activeTags.indexOf(key) < 0) {continue;}

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
   * @memberof Timer#
   * @method later
   * @param {number}    wait      Time in milliseconds
   * @param {function}  callback  Callback function to run, when timer ends
   * @param {object}    context   Context of the callback to be invoked
   * @param {string}    [tag]     Tag of this timer, default is '0'
   * @return {Clock} Clock instance
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
   * @memberof Timer#
   * @method laterSec
   * @param {number}    wait      Time in seconds
   * @param {function}  callback  Callback function to run, when timer ends
   * @param {object}    context   Context of the callback to be invoked
   * @param {string}    [tag]     Tag of this timer, default is '0'
   * @return {Clock} Clock instance
   */
  laterSec(wait, callback, context, tag = '0') {
    return this.later(Math.floor(wait * 1000), callback, context, tag);
  }

  /**
   * Create a repeat timer.
   * @memberof Timer#
   * @method interval
   * @param {number}    interval  Time in milliseconds
   * @param {function}  callback  Callback function to run, when timer ends
   * @param {object}    context   Context of the callback to be invoked
   * @param {string}    [tag]     Tag of this timer, default is '0'
   * @return {Clock} Clock instance
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
   * @memberof Timer#
   * @method intervalSec
   * @param {number}    interval  Time in seconds
   * @param {function}  callback  Callback function to run, when timer ends
   * @param {object}    context   Context of the callback to be invoked
   * @param {string}    [tag]     Tag of this timer, default is '0'
   * @return {Clock} Clock instance
   */
  intervalSec(interval, callback, context, tag = '0') {
    return this.interval(Math.floor(interval * 1000), callback, context, tag);
  }

  /**
   * Remove a timer.
   * @memberof Timer#
   * @method remove
   * @param {Clock} timer Clock to remove
   */
  remove(timer) {
    if (timer) {
      timer.removed = true;
    }
  }

  /**
   * Pause timers with a specific tag.
   * @memberof Timer#
   * @method pauseTimersTagged
   * @param  {string} tag Tag of timers to resume
   * @return {Timer} Self for chaining
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
   * @memberof Timer#
   * @method resumeTimersTagged
   * @param  {string} tag Tag of timers to resume
   * @return {Timer} Self for chaining
   */
  resumeTimersTagged(tag) {
    if (this.timers[tag]) {
      removeItems(this.deactiveTags, this.deactiveTags.indexOf(tag), 1);
      this.activeTags.push(tag);
    }

    return this;
  }
}
