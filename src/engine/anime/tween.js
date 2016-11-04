const EventEmitter = require('engine/EventEmitter');

const { getTargetAndKey } = require('./utils');
const { Easing, Interpolation } = require('./easing');

/**
 * Action type enums
 * @enum {number}
 * @memberof Tween
 */
const ACTION_TYPES = {
  REPEAT: 0,
  WAIT: 1,
  ANIMATE: 2,
};

// TODO: better easing support (https://github.com/rezoner/ease)

/**
 * @class Tween
 * @extends {EventEmitter}
 */
class Tween extends EventEmitter {
  /**
   * @constructor
   * @param {object} context Object to apply this tween to.
   */
  constructor(context) {
    super();

    this.context = context;

    /**
     * List of actions.
     * @type {array}
     */
    this.actions = [];
    this.index = -1;
    this.current = null;
    this.currentAction = null;

    /**
     * Delta cache for updating
     * @type {number}
     */
    this.delta = 0;

    /**
     * Tween duration.
     * @type {number}
     * @default 500
     */
    this.duration = 500;

    /**
     * Progress of current performing action
     * @type {number}
     */
    this.progress = 0;

    /**
     * Tween's easing function.
     * @property {function} easing
     */
    this.easing = Easing.Linear.None;
    /**
     * Tween's interpolation function.
     * @property {function} interpolationFn
     */
    this.interpolation = Interpolation.Linear;

    /**
     * Whether this tween is finished
     * @type {boolean}
     */
    this.isFinished = false;

    /**
     * Whether this tween is removed
     * @type {boolean}
     */
    this.isRemoved = false;

    /**
     * Whether this tween is paused
     * @type {boolean}
     */
    this.isPaused = false;

    // Interal variables
    this.repeatCount = 0;
    this.propCtx = [];  // Property context list
    this.propKey = [];  // Property key list
    this.before = [];   // Target property list
    this.change = [];   // Property change list
    this.types = [];    // Property type list
  }

  /**
   * Initialize this tween
   * @param  {object} context Target object.
   */
  init(context) {
    this.removeAllListeners();

    this.context = context;

    this.actions.length = 0;
    this.index = -1;
    this.current = null;
    this.currentAction = null;

    this.delta = 0;
    this.duration = 500;
    this.progress = 0;

    this.easing = Easing.Linear.None;
    this.interpolation = Interpolation.Linear;

    this.isFinished = false;
    this.isRemoved = false;
    this.isPaused = false;

    this.repeatCount = 0;
    this.propCtx.length = 0;
    this.propKey.length = 0;
    this.before.length = 0;
    this.change.length = 0;
    this.types.length = 0;
  }

  /**
   * Push a new action to the tween.
   * @memberof Tween#
   * @method to
   * @param  {Object} properties              Target properties
   * @param  {Number} duration                Duration of the action in ms
   * @param  {String|Function} easing         Easing function
   * @param  {String|Function} interpolation  Interpolation function
   * @return {Tween} Tween itself for chaining.
   */
  to(properties, duration, easing = Easing.Linear.None, interpolation = Interpolation.Linear) {
    let easingFn = easing, interpolationFn = interpolation;
    if (typeof easing === 'string') {
      easing = easing.split('.');
      easingFn = Easing[easing[0]][easing[1]];
    }

    if (typeof interpolation === 'string') {
      interpolationFn = Interpolation[interpolation];
    }

    /**
     * props [
     *   propertyContext1, propertyKey1, targetValue1,
     *   propertyContext2, propertyKey2, targetValue2,
     *   ...
     * ]
     */
    let props = [], keys = Object.keys(properties), pair;
    for (let i = 0; i < keys.length; i++) {
      pair = getTargetAndKey(this.context, keys[i]);
      props.push(pair[0], pair[1], properties[keys[i]]);
    }
    this.actions.push([props, duration, easingFn, interpolationFn]);

    return this;
  }

  /**
   * Repeat the tween for times.
   * @memberof Tween#
   * @method repeat
   * @param  {number} times How many times to repeat.
   * @return {Tween}  Tween itself.
   */
  repeat(times) {
    this.actions.push([ACTION_TYPES.REPEAT, times]);
    return this;
  }

  /**
   * Wait a short time before next action.
   * @memberof Tween#
   * @method wait
   * @param  {number} time Time to wait in ms.
   * @return {Tween}  Tween itself for chaining.
   */
  wait(time) {
    this.actions.push([ACTION_TYPES.WAIT, time]);
    return this;
  }

  /**
   * Stop this tween.
   * @memberof Tween#
   * @method stop
   * @return {Tween}  Tween itself for chaining.
   */
  stop() {
    this.isRemoved = true;
    this.removeAllListeners();
    return this;
  }

  /**
   * Pause this tween.
   * @memberof Tween#
   * @method pause
   * @return {Tween}  Tween itself for chaining.
   */
  pause() {
    this.isPaused = true;
    return this;
  }

  /**
   * Resume this tween from pausing.
   * @memberof Tween#
   * @method resume
   * @return {Tween}  Tween itself for chaining.
   */
  resume() {
    this.isPaused = false;
    return this;
  }

  /**
   * Do next action.
   * @private
   */
  _next() {
    this.delta = 0;

    this.index++;

    if (this.index >= this.actions.length) {
      this.isFinished = true;
      this.isRemoved = true;

      this.emit('finish', this);

      return;
    }

    this.current = this.actions[this.index];

    if (this.current[0] === ACTION_TYPES.WAIT) {
      this.duration = this.current[1];
      this.currentAction = ACTION_TYPES.WAIT;
    }
    else if (this.current[0] === ACTION_TYPES.REPEAT) {
      if (!this.current.counter) {
        this.current.counter = this.current[1];
      }
      this.current.counter--;
      if (this.current.counter > 0) {
        this.emit('repeat', this);

        // Restart from beginning
        this.index = -1;
        this.current = null;
        this._step(0);
      }
      else {
        // Reset counter for next repeat if exists
        this.current.counter = this.current[1];

        // Clear for next action
        this.current = null;
        this.currentAction = null;
        this._step(0);
      }
    }
    else {
      this.properties = this.current[0];

      this.propCtx.length = 0;
      this.propKey.length = 0;
      this.change.length = 0;
      this.before.length = 0;
      this.types.length = 0;

      for (let i = 0; i < this.properties.length; i += 3) {
        // Property context
        let context = this.properties[i];
        // Property key
        let key = this.properties[i + 1];
        // Current value
        let currValue = context[key];
        // Target value
        let targetValue = this.properties[i + 2];

        // Construct action lists
        this.propKey.push(key);
        this.propCtx.push(context);

        // Number
        if (typeof(currValue) === 'number') {
          this.before.push(currValue);
          this.change.push(targetValue - currValue);
          this.types.push(0);
        }
        // String
        else if (typeof(currValue) === 'string') {
          this.before.push(currValue);
          this.change.push(targetValue);
          this.types.push(1);
        }
        // Boolean or object
        else {
          this.before.push(currValue);
          this.change.push(targetValue);
          this.types.push(2);
        }
      }

      this.currentAction = ACTION_TYPES.ANIMATE;

      this.duration = this.current[1];
      this.easing = this.current[2];
      this.interpolation = this.current[3];
    }
  }

  /**
   * Update.
   * @param  {number} delta Delta time
   * @protected
   */
  _step(delta) {
    if (this.isRemoved || this.isPaused) {return;}

    this.delta += delta;

    if (!this.current) {
      this._next();
    }

    switch (this.currentAction) {
      case ACTION_TYPES.ANIMATE:
        this._doAnimate();
        break;
      case ACTION_TYPES.WAIT:
        this._doWait();
        break;
    }
  }

  /**
   * Do current action.
   * @private
   */
  _doAnimate() {
    this.progress = Math.min(1, this.delta / this.duration);
    let mod = this.easing(this.progress);

    let i, key;
    for (i = 0; i < this.change.length; i++) {
      key = this.propKey[i];
      switch (this.types[i]) {
        // Number tweening
        case 0:
          this.propCtx[i][key] = this.before[i] + this.change[i] * mod;
          break;
        // Tweening text content
        case 1:
          this.propCtx[i][key] = this.change[i].slice(0, Math.floor(this.change[i].length * mod));
          break;
        // Instantly value changing for boolean and objects
        case 2:
          if (this.progress >= 1) {this.propCtx[i][key] = this.change[i];}
          break;
      }
    }

    if (this.progress >= 1) {
      this._next();
    }
  }

  /**
   * Do wait action.
   * @private
   */
  _doWait() {
    if (this.delta >= this.duration) {
      this._next();
    }
  }

  /**
   * Recycle this tween for later use.
   */
  recycle() {
    pool.push(this);
  }
}

// Object recycle
const pool = [];
for (let i = 0; i < 20; i++) {
  pool.push(new Tween(null));
}

/**
 * Tween factory method.
 * @memberOf Tween
 * @param  {object} context Target object.
 * @return {module:engine/animation/tween~Tween} Tween instance.
 */
Tween.create = function(context) {
  let t = pool.pop();
  if (!t) {
    t = new Tween(context);
  }
  t.init(context);
  return t;
};

/**
 * Classic tween animation.
 * Use {@link SystemAnime#tween} to create a new tween and start it immediately.
 *
 * @exports engine/anime/tween
 *
 * @requires engine/EventEmitter
 * @requires engine/anime/utils
 * @requires engine/anime/easing
 */
module.exports = Tween;
module.exports.ACTION_TYPES = ACTION_TYPES;
