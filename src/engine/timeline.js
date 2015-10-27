/**
 * Most implementation comes from [Playground](http://playgroundjs.com/playground-ease)
 * Thanks to author of playground.js: [Rezoner](https://twitter.com/rezoner)
 */

import EventEmitter from 'engine/eventemitter3';
import Timer from 'engine/timer';
import Scene from 'engine/scene';

let pool = [];

// TODO: better easing support (https://github.com/rezoner/ease)

/**
  @class Timeline
  @constructor
  @param {Object} context
**/
function Timeline(context) {
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
    Timeline's target properties.
    @property {Array}
  **/
  this.before = null;
  /**
    Timeline's property changes.
    @property {Array}
  **/
  this.change = null;
  this.types = null;

  this.delta = 0;
  /**
    Timeline duration.
    @property {Number} duration
    @default 500
  **/
  this.duration = 500;

  /**
   * Progress of current performing action
   * @type {Number}
   */
  this.progress = 0;

  /**
    Timeline's easing function.
    @property {Function} easing
  **/
  this.easing = Timeline.Easing.Linear.None;
  /**
    Timeline's interpolation function.
    @property {Function} interpolationFn
  **/
  this.interpolation = Timeline.Interpolation.Linear;

  /**
   * Whether this timeline is finished
   * @type {Boolean}
   */
  this.finished = false;

  /**
   * Whether this timeline is removed
   * @type {Boolean}
   */
  this.removed = false;

  // Interal variables
  this.keys = null;
  this.repeatCount = 0;
}
Timeline.prototype = Object.create(EventEmitter.prototype);
Timeline.prototype.constructor = Timeline;

/**
 * Add a new action to the timeline
 * @param  {Object} properties              Target properties
 * @param  {Number} duration                Duration of the action in ms
 * @param  {String|Function} easing         Easing function
 * @param  {String|Function} interpolation  Interpolation function
 * @chainable
 */
Timeline.prototype.to = function to(properties, duration, easing = Timeline.Easing.Linear.None, interpolation = Timeline.Interpolation.Linear) {
  let easingFn = easing;
  let interpolationFn = interpolation;

  if (typeof easing === 'string') {
    easing = easing.split('.');
    easingFn = Timeline.Easing[easing[0]][easing[1]];
  }

  if (typeof interpolation === 'string') {
    interpolationFn = Timeline.Interpolation[interpolation];
  }

  this.actions.push([properties, duration, easingFn, interpolationFn]);

  return this;
};

/**
 * Repeat last action for times
 * @param  {Number} times How many times to repeat the action
 * @chainable
 */
Timeline.prototype.repeat = function repeat(times) {
  this.actions.push(['repeat', times]);
  return this;
};

/**
 * Wait a short time before next action
 * @param  {Number} time Time to wait in ms
 * @chainable
 */
Timeline.prototype.wait = function wait(time) {
  this.actions.push(['wait', time]);
  return this;
};

/**
 * Stop this timeline
 * @chainable
 */
Timeline.prototype.stop = function stop() {
  this.removed = true;
  return this;
};

Timeline.prototype._next = function _next() {
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
    this.current[1]--;
    if (this.current[1] > 0) {
      this.index--;
      this._step(0);

      return;
    }
    else {
      this._step(0);

      return;
    }
  }
  else {
    let properties = this.current[0];

    this.keys = Object.keys(properties);

    this.change = [];
    this.before = [];
    this.types = [];

    for (let i = 0; i < this.keys.length; i++) {
      let key = this.keys[i];
      let value = this.context[key];

      if (typeof properties[key] === 'number') {
        this.before.push(value);
        this.change.push(properties[key] - value);
        this.types.push(0);
      }
      else if (Array.isArray(properties[key])) {
        this.before.push(value);
        this.change.push([value].concat(properties[key]));
        this.types.push(1);
      }
      else {
        console.log('This type of action is not supported yet!');
      }
    }

    this.currentAction = 'animate';

    this.duration = this.current[1];
    this.easing = this.current[2];
    this.interpolation = this.current[3];
  }
};

Timeline.prototype._step = function _step(delta) {
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

Timeline.prototype._doAnimate = function _doAnimate() {
  this.progress = Math.min(1, this.delta / this.duration);

  let mod = this.easing(this.progress);

  for (let i = 0; i < this.keys.length; i++) {
    let key = this.keys[i];

    switch (this.types[i]) {
      case 0:
        this.context[key] = this.before[i] + this.change[i] * mod;
        break;
      case 1:
        this.context[key] = this.interpolation(this.change[i], mod);
        break;
    }
  }

  if (this.progress >= 1) {
    this._next();
  }
};

Timeline.prototype._doWait = function _doWait() {
  if (this.delta >= this.duration) {
    this._next();
  }
};

Object.assign(Timeline, {
  create: function create(context) {
    let t = pool.pop();
    if (!t) {
      t = new Timeline(context);
    }
    else {
      Timeline.call(t, context);
    }
    return t;
  },
  recycle: function recycle(timeline) {
    pool.push(timeline);
  },
});

Object.assign(Scene.prototype, {
  /**
    Create a new timeline
    @method addTimeline
    @param {Object}     context Context of this timeline
    @return {Timeline}
  **/
  addTimeline: function addTimeline(context) {
    let timeline = Timeline.create(context);
    this.timelines.push(timeline);

    return timeline;
  },

  /**
    Remove timeline.
    @method removeTimeline
    @param {Timeline} timeline
  **/
  removeTimeline: function removeTimeline(timeline) {
    if (!timeline) return;
    timeline.removed = true;
  },

  _initTimelines: function _initTimelines() {
    this.timelines = [];
  },
  _updateTimelines: function _updateTimelines() {
    this.delta = Timer.delta;
    let t;
    for (let i = 0; i < this.timelines.length; i++) {
      t = this.timelines[i];
      if (!t.removed) {
        t._step(Timer.delta);
      }

      if (t.removed) {
        Timeline.recycle(t);
        this.timelines.splice(i--, 1);
      }
    }
  },
  _freezeTimelines: function _freezeTimelines() {
    this.timelines.length = 0;
  },
});

if (Scene.systems.indexOf('Timelines') === -1) {
  Scene.systems.push('Timelines');
}

Object.assign(Timeline, {
  /**
    @attribute {Object} Easing
  **/
  Easing: {
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
        return 1 - Timeline.Easing.Bounce.Out(1 - k);
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
        if (k < 0.5) return Timeline.Easing.Bounce.In(k * 2) * 0.5;
        return Timeline.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
      },
    },
  },

  /**
    @attribute {Object} Interpolation
  **/
  Interpolation: {
    Linear: function(v, k) {
      var m = v.length - 1,
        f = m * k,
        i = Math.floor(f),
        fn = Timeline.Interpolation.Utils.Linear;
      if (k < 0) return fn(v[0], v[1], f);
      if (k > 1) return fn(v[m], v[m - 1], m - f);
      return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    },

    Bezier: function(v, k) {
      var b = 0,
        n = v.length - 1,
        pw = Math.pow,
        bn = Timeline.Interpolation.Utils.Bernstein,
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
        fn = Timeline.Interpolation.Utils.CatmullRom;
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
        var fc = Timeline.Interpolation.Utils.Factorial;
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
  },
});

export default Timeline;
