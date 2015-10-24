import Scene from 'engine/scene';

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

Object.assign(Timer, {
  /**
    Current time.
    @attribute {Number} time
  **/
  time: 0,
  /**
    Main timer's speed factor.
    @attribute {Number} speed
    @default 1
  **/
  speed: 1,
  /**
    Main timer's minimum fps.
    @attribute {Number} minFPS
    @default 20
  **/
  minFPS: 20,
  /**
    Main timer's delta (ms).
    @attribute {Number} delta
  **/
  delta: 0,
  /**
    @attribute {Number} _last
    @private
  **/
  _last: 0,
  /**
    @attribute {Number} _realDelta
    @private
  **/
  _realDelta: 0,
  /**
    Update main timer.
    @attribute {Function} update
  **/
  update: function(timestamp) {
    var now = timestamp ? timestamp : Date.now();
    if (!this._last) this._last = now;
    this._realDelta = now - this._last;
    this.delta = Math.min(this._realDelta, 1000 / this.minFPS) * this.speed;
    this.time += this.delta;
    this._last = now;
  },
});

Object.assign(Scene.prototype, {
  /**
    Add timer to game scene.
    @method addTimer
    @param {Number} time Time in milliseconds
    @param {Function} callback Callback function to run, when timer ends.
    @param {Boolean} repeat
    @return {Timer}
  **/
  addTimer: function addTimer(time, callback, repeat) {
    var timer = new Timer(time);

    timer.repeat = !!repeat;
    timer.callback = callback;
    this.timers.push(timer);
    return timer;
  },

  /**
    Remove timer from scene.
    @method removeTimer
    @param {Timer} timer
  **/
  removeTimer: function removeTimer(timer) {
    if (!timer) return;
    timer.callback = null;
    timer.repeat = false;
    timer.set(0);
  },

  _initTimers: function _initTimers() {
    this.timers = [];
  },
  _updateTimers: function _updateTimers() {
    var timer;
    for (var i = this.timers.length - 1; i >= 0; i--) {
      timer = this.timers[i];
      if (timer.time() >= 0) {
        if (typeof timer.callback === 'function') {
          timer.callback();
        }

        if (timer.repeat) {
          timer.reset();
        } else {
          this.timers.splice(i, 1);
        }
      }
    }
  },
  _freezeTimers: function _freezeTimers() {
    this.timers.length = 0;
  },
});

Scene.systems.push('Timer');

export default Timer;
