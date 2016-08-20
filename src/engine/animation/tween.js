var EventEmitter = require('engine/eventemitter3');
var Scene = require('engine/scene');
var utils = require('engine/utils');

var animUtils = require('./utils');
var getTargetAndKey = animUtils.getTargetAndKey;
var easing = require('./easing');
var Easing = easing.Easing;
var Interpolation = easing.Interpolation;

/**
 * Action type enums
 * @enum {number}
 * @memberof Tween
 */
var ACTION_TYPES = {
  REPEAT:   0,
  WAIT:     1,
  ANIMATE:  2,
};

// TODO: better easing support (https://github.com/rezoner/ease)

/**
 * @class Tween
 * @extends {EventEmitter}
 * @constructor
 * @param {object} context
 */
function Tween(context) {
  EventEmitter.call(this);

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
  this.finished = false;

  /**
   * Whether this tween is removed
   * @type {boolean}
   */
  this.removed = false;

  /**
   * Whether this tween is paused
   * @type {boolean}
   */
  this.paused = false;

  // Interal variables
  this.repeatCount = 0;
  this.propCtx = [];  // Property context list
  this.propKey = [];  // Property key list
  this.before = [];   // Target property list
  this.change = [];   // Property change list
  this.types = [];    // Property type list
}
Tween.prototype = Object.create(EventEmitter.prototype);
Tween.prototype.constructor = Tween;

Tween.prototype.init = function(context) {
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

  this.finished = false;
  this.removed = false;
  this.paused = false;

  this.repeatCount = 0;
  this.propCtx.length = 0;
  this.propKey.length = 0;
  this.before.length = 0;
  this.change.length = 0;
  this.types.length = 0;
};

/**
 * Add a new action to the tween
 * @memberof Tween#
 * @method to
 * @param  {Object} properties              Target properties
 * @param  {Number} duration                Duration of the action in ms
 * @param  {String|Function} easing         Easing function
 * @param  {String|Function} interpolation  Interpolation function
 */
Tween.prototype.to = function to(properties, duration, easing, interpolation) {
  var easingFn = easing || Easing.Linear.None;
  var interpolationFn = interpolation || Interpolation.Linear;

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
  var props = [], keys = Object.keys(properties), pair;
  for (var i = 0; i < keys.length; i++) {
    pair = getTargetAndKey(this.context, keys[i]);
    props.push(pair[0], pair[1], properties[keys[i]]);
  }
  this.actions.push([props, duration, easingFn, interpolationFn]);

  return this;
};

/**
 * Repeat the tween for times
 * @memberof Tween#
 * @param  {number} times How many times to repeat
 */
Tween.prototype.repeat = function repeat(times) {
  this.actions.push([ACTION_TYPES.REPEAT, times]);
  return this;
};

/**
 * Wait a short time before next action
 * @memberof Tween#
 * @method wait
 * @param  {number} time Time to wait in ms
 */
Tween.prototype.wait = function wait(time) {
  this.actions.push([ACTION_TYPES.WAIT, time]);
  return this;
};

/**
 * Stop this tween
 * @memberof Tween#
 * @method stop
 */
Tween.prototype.stop = function stop() {
  this.removed = true;
  this.removeAllListeners();
  return this;
};

/**
 * Pause this tween
 * @memberof Tween#
 * @method pause
 */
Tween.prototype.pause = function pause() {
  this.paused = true;
  return this;
};

/**
 * Resume this tween from pausing
 * @memberof Tween#
 * @method resume
 */
Tween.prototype.resume = function resume() {
  this.paused = false;
  return this;
};

Tween.prototype._next = function _next() {
  this.delta = 0;

  this.index++;

  if (this.index >= this.actions.length) {
    this.finished = true;
    this.removed = true;

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

    for (var i = 0; i < this.properties.length; i += 3) {
      // Property context
      var context = this.properties[i];
      // Property key
      var key = this.properties[i + 1];
      // Current value
      var currValue = context[key];
      // Target value
      var targetValue = this.properties[i + 2];

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
};

Tween.prototype._step = function _step(delta) {
  if (this.removed || this.paused) return;

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
};

Tween.prototype._doAnimate = function _doAnimate() {
  this.progress = Math.min(1, this.delta / this.duration);
  var mod = this.easing(this.progress);

  var i, key;
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
        if (this.progress >= 1) this.propCtx[i][key] = this.change[i];
        break;
    }
  }

  if (this.progress >= 1) {
    this._next();
  }
};

Tween.prototype._doWait = function _doWait() {
  if (this.delta >= this.duration) {
    this._next();
  }
};

Tween.prototype.recycle = function recycle() {
  pool.push(this);
};

// Object recycle
var pool = [];
for (var i = 0; i < 20; i++) {
  pool.push(new Tween(null));
}

/**
 * Tween factory method.
 * @param  {object} context
 * @return {module:engine/animation/tween~Tween}
 */
Tween.create = function create(context) {
  var t = pool.pop();
  if (!t) {
    t = new Tween(context);
  }
  t.init(context);
  return t;
};

Tween.ACTION_TYPES = ACTION_TYPES;

// Inject tween factory method
Object.assign(Scene.prototype, {
  /**
   * Create and add a new tween to the scene.
   * @method tween
   * @memberOf Scene#
   * @param {Oblject}     context Context of this tween
   * @param {string}     tag     Tag of this tween (default is '0')
   * @return {module:engine/animation/tween~Tween}
   */
  tween: function tween(context, tag) {
    var t = tag || '0';

    if (!this.animationSystem.anims[t]) {
      // Create a new tween list
      this.animationSystem.anims[t] = [];

      // Active new tag by default
      this.animationSystem.activeTags.push(t);
    }

    var tween = Tween.create(context);
    this.animationSystem.anims[t].push(tween);

    return tween;
  },
});

/**
 * Classic tween animation.
 * Use {@link Scene#tween} to create a new tween and start it immediately.
 *
 * @example
 * // Remember to import `animation` module.
 * import 'engine/animation';
 *
 * class MyScene extends Scene {
 *   awake() {
 *     let coin = new PIXI.Sprite(...);
 *     this.tween(coin)
 *       .wait(1000)
 *       .to({
 *         'position.x': 20,
 *         'position.y': 20,
 *         'scale.x': 1.2,
 *         'scale.y': 1.2,
 *       });
 *   }
 * }
 *
 * @exports engine/animation/tween
 *
 * @requires engine/eventemitter3
 * @requires engine/scene
 * @requires engine/utils
 * @requires engine/animation/utils
 * @requires engine/animation/easing
 */
module.exports = Tween;
