/**
 * Powerful tween based animation.
 */

var EventEmitter = require('engine/eventemitter3');
var Scene = require('engine/scene');
var utils = require('engine/utils');

/**
 * Get the real target and its property key from
 * a root context and full path of the target property.
 * @param  {Object} context  Root context that contains the target
 * @param  {String} fullPath Full path of the target property
 * @return {Array}           [target, key] or undefined if no property matches
 */
function getTargetAndKey(context, fullPath) {
  var path = fullPath.split('.');
  // Path is just the property key
  if (path.length === 1) {
    return [context, fullPath];
  }
  else {
    var target = context;
    for (var i = 0; i < path.length - 1; i++) {
      if (target.hasOwnProperty(path[i])) {
        target = target[path[i]];
      }
      else {
        console.log('[Warning]: anim target "' + path[i] + '" not found');
        return undefined;
      }
    }

    if (!target.hasOwnProperty(path[path.length - 1])) {
      console.log('[Warning]: anim target "' + path[path.length - 1] + '" not found');
      return undefined;
    }
    return [target, path[path.length - 1]];
  }
}

var pool = [];

// TODO: better easing support (https://github.com/rezoner/ease)

/**
 * @class Tween
 * @constructor
 * @param {Object} context
 */
function Tween(context) {
  EventEmitter.call(this);

  this.context = context;

  /**
    List of actions.
    @property {Array}
  **/
  this.actions = [];
  this.index = -1;
  this.current = null;
  this.currentAction = null;

  /**
   * Delta cache for updating
   * @type {Number}
   */
  this.delta = 0;

  /**
   * Tween duration.
   * @property {Number} duration
   * @default 500
   */
  this.duration = 500;

  /**
   * Progress of current performing action
   * @type {Number}
   */
  this.progress = 0;

  /**
   * Tween's easing function.
   * @property {Function} easing
   */
  this.easing = Easing.Linear.None;
  /**
   * Tween's interpolation function.
   * @property {Function} interpolationFn
   */
  this.interpolation = Interpolation.Linear;

  /**
   * Whether this tween is finished
   * @type {Boolean}
   */
  this.finished = false;

  /**
   * Whether this tween is removed
   * @type {Boolean}
   */
  this.removed = false;

  /**
   * Whether this tween is paused
   * @type {Boolean}
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

/**
 * Add a new action to the tween
 * @param  {Object} properties              Target properties
 * @param  {Number} duration                Duration of the action in ms
 * @param  {String|Function} easing         Easing function
 * @param  {String|Function} interpolation  Interpolation function
 * @chainable
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
 * @param  {Number} times How many times to repeat
 * @chainable
 */
Tween.prototype.repeat = function repeat(times) {
  this.actions.push(['repeat', times]);
  return this;
};

/**
 * Wait a short time before next action
 * @param  {Number} time Time to wait in ms
 * @chainable
 */
Tween.prototype.wait = function wait(time) {
  this.actions.push(['wait', time]);
  return this;
};

/**
 * Stop this tween
 * @chainable
 */
Tween.prototype.stop = function stop() {
  this.removed = true;
  return this;
};

/**
 * Pause this tween
 * @chainable
 */
Tween.prototype.pause = function pause() {
  this.paused = true;
  return this;
};

/**
 * Resume this tween from pausing
 * @chainable
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

  if (this.current[0] === 'wait') {
    this.duration = this.current[1];
    this.currentAction = 'wait';
  }
  else if (this.current[0] === 'repeat') {
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

    this.currentAction = 'animate';

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
    case 'animate':
      this._doAnimate();
      break;
    case 'wait':
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

Object.assign(Tween, {
  create: function create(context) {
    var t = pool.shift();
    if (!t) {
      t = new Tween(context);
    }
    else {
      Tween.call(t, context);
    }
    return t;
  },
  recycle: function recycle(tween) {
    pool.push(tween);
  },
});

Object.assign(Scene.prototype, {
  /**
   * Create a new tween
   * @method tween
   * @param {Object}     context Context of this tween
   * @param {String}     tag     Tag of this tween (default is '0')
   * @return {Tween}
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

  pauseAnimationsTagged: function pauseAnimationsTagged(tag) {
    if (this.animationSystem.anims[tag]) {
      utils.removeItems(this.animationSystem.activeTags, this.animationSystem.activeTags.indexOf(tag), 1);
      this.animationSystem.deactiveTags.push(tag);
    }

    return this;
  },

  resumeAnimationsTagged: function resumeAnimationsTagged(tag) {
    if (this.animationSystem.anims[tag]) {
      utils.removeItems(this.animationSystem.deactiveTags, this.animationSystem.deactiveTags.indexOf(tag), 1);
      this.animationSystem.activeTags.push(tag);
    }

    return this;
  },
});

Scene.registerSystem('Animation', {
  init: function init(scene) {
    /**
     * Map of animation lists.
     * @property {Object} anims
     */
    scene.animationSystem = {
      activeTags: ['0'],
      deactiveTags: [],
      anims: {
        '0': [],
      },
    };
  },
  preUpdate: function preUpdate(scene) {
    var i, key, anims, t;
    for (key in scene.animationSystem.anims) {
      if (scene.animationSystem.activeTags.indexOf(key) < 0) continue;

      anims = scene.animationSystem.anims[key];
      for (i = 0; i < anims.length; i++) {
        t = anims[i];
        if (t.removed) {
          Tween.recycle(t);
          utils.removeItems(anims, i--, 1);
        }
      }
    }
  },
  update: function update(scene, delta) {
    var i, key, anims, t;
    for (key in scene.animationSystem.anims) {
      if (scene.animationSystem.activeTags.indexOf(key) < 0) continue;

      anims = scene.animationSystem.anims[key];
      for (i = 0; i < anims.length; i++) {
        t = anims[i];

        if (!t.removed) {
          t._step(delta);
        }
      }
    }
  },
});

/**
 * @attribute {Object} Easing
 */
var Easing = {
  Linear: {
    None: function(k) {
      return k;
    },
  },

  Quadratic: {
    In: function(k) {
      return k * k;
    },

    Out: function(k) {
      return k * (2 - k);
    },

    InOut: function(k) {
      if ((k *= 2) < 1) return 0.5 * k * k;
      return -0.5 * (--k * (k - 2) - 1);
    },
  },

  Cubic: {
    In: function(k) {
      return k * k * k;
    },

    Out: function(k) {
      return --k * k * k + 1;
    },

    InOut: function(k) {
      if ((k *= 2) < 1) return 0.5 * k * k * k;
      return 0.5 * ((k -= 2) * k * k + 2);
    },
  },

  Quartic: {
    In: function(k) {
      return k * k * k * k;
    },

    Out: function(k) {
      return 1 - (--k * k * k * k);
    },

    InOut: function(k) {
      if ((k *= 2) < 1) return 0.5 * k * k * k * k;
      return -0.5 * ((k -= 2) * k * k * k - 2);
    },
  },

  Quintic: {
    In: function(k) {
      return k * k * k * k * k;
    },

    Out: function(k) {
      return --k * k * k * k * k + 1;
    },

    InOut: function(k) {
      if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
      return 0.5 * ((k -= 2) * k * k * k * k + 2);
    },
  },

  Sinusoidal: {
    In: function(k) {
      return 1 - Math.cos(k * Math.PI / 2);
    },

    Out: function(k) {
      return Math.sin(k * Math.PI / 2);
    },

    InOut: function(k) {
      return 0.5 * (1 - Math.cos(Math.PI * k));
    },
  },

  Exponential: {
    In: function(k) {
      return k === 0 ? 0 : Math.pow(1024, k - 1);
    },

    Out: function(k) {
      return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
    },

    InOut: function(k) {
      if (k === 0) return 0;
      if (k === 1) return 1;
      if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
      return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
    },
  },

  Circular: {
    In: function(k) {
      return 1 - Math.sqrt(1 - k * k);
    },

    Out: function(k) {
      return Math.sqrt(1 - (--k * k));
    },

    InOut: function(k) {
      if ((k *= 2) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
      return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
    },
  },

  Elastic: {
    In: function(k) {
      var s, a = 0.1,
        p = 0.4;
      if (k === 0) return 0;
      if (k === 1) return 1;
      if (!a || a < 1) {
        a = 1;
        s = p / 4;
      } else s = p * Math.asin(1 / a) / (2 * Math.PI);
      return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
    },

    Out: function(k) {
      var s, a = 0.1,
        p = 0.4;
      if (k === 0) return 0;
      if (k === 1) return 1;
      if (!a || a < 1) {
        a = 1;
        s = p / 4;
      } else s = p * Math.asin(1 / a) / (2 * Math.PI);
      return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
    },

    InOut: function(k) {
      var s, a = 0.1,
        p = 0.4;
      if (k === 0) return 0;
      if (k === 1) return 1;
      if (!a || a < 1) {
        a = 1;
        s = p / 4;
      } else s = p * Math.asin(1 / a) / (2 * Math.PI);
      if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
      return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
    },
  },

  Back: {
    In: function(k) {
      var s = 1.70158;
      return k * k * ((s + 1) * k - s);
    },

    Out: function(k) {
      var s = 1.70158;
      return --k * k * ((s + 1) * k + s) + 1;
    },

    InOut: function(k) {
      var s = 1.70158 * 1.525;
      if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
      return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
    },
  },

  Bounce: {
    In: function(k) {
      return 1 - Tween.Easing.Bounce.Out(1 - k);
    },

    Out: function(k) {
      if (k < (1 / 2.75)) {
        return 7.5625 * k * k;
      } else if (k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
      } else if (k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
      } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
      }
    },

    InOut: function(k) {
      if (k < 0.5) return Tween.Easing.Bounce.In(k * 2) * 0.5;
      return Tween.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
    },
  },
};

/**
 * @attribute {Object} Interpolation
 */
var Interpolation = {
  Linear: function(v, k) {
    var m = v.length - 1,
      f = m * k,
      i = Math.floor(f),
      fn = Tween.Interpolation.Utils.Linear;
    if (k < 0) return fn(v[0], v[1], f);
    if (k > 1) return fn(v[m], v[m - 1], m - f);
    return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
  },

  Bezier: function(v, k) {
    var b = 0,
      n = v.length - 1,
      pw = Math.pow,
      bn = Tween.Interpolation.Utils.Bernstein,
      i;
    for (i = 0; i <= n; i++) {
      b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
    }

    return b;
  },

  CatmullRom: function(v, k) {
    var m = v.length - 1,
      f = m * k,
      i = Math.floor(f),
      fn = Tween.Interpolation.Utils.CatmullRom;
    if (v[0] === v[m]) {
      if (k < 0) i = Math.floor(f = m * (1 + k));
      return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
    } else {
      if (k < 0) return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
      if (k > 1) return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
      return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
    }
  },

  Utils: {
    Linear: function(p0, p1, t) {
      return (p1 - p0) * t + p0;
    },

    Bernstein: function(n, i) {
      var fc = Tween.Interpolation.Utils.Factorial;
      return fc(n) / fc(i) / fc(n - i);
    },

    Factorial: (function() {
      var a = [1];
      return function(n) {
        var s = 1, i;
        if (a[n]) return a[n];
        for (i = n; i > 1; i--) s *= i;
        return a[n] = s;
      };
    })(),

    CatmullRom: function(p0, p1, p2, p3, t) {
      var v0 = (p2 - p0) * 0.5,
        v1 = (p3 - p1) * 0.5,
        t2 = t * t,
        t3 = t * t2;
      return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
    },
  },
};

module.exports = {
  Tween: Tween,

  Easing: Easing,
  Interpolation: Interpolation,
};
