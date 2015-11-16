require('engine/polyfill');

var EventEmitter = require('engine/eventemitter3');
var Scene = require('engine/scene');
var Renderer = require('engine/renderer');
var Timer = require('engine/timer');
var config = require('game/config');

// Math extensions
Object.assign(Math, {
  /**
   * Force a value within the boundaries by clamping `x` to the range `[a, b]`.
   *
   * @method Math.clamp
   * @param {number} x
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  clamp: function (x, a, b) {
    return (x < a) ? a : ((x > b) ? b : x);
  },
});

// Engine core
var core = new EventEmitter();
Object.assign(core, {
  scenes: {},
  scene: null,

  /* Size of game content */
  width: config.width || 640,
  height: config.height || 400,

  /* Size of view (devicePixelRatio independent) */
  viewWidth: config.width || 640,
  viewHeight: config.height || 400,

  _nextScene: null,
  _loopId: 0,

  addScene: function addScene(name, ctor) {
    if (core.scenes[name]) {
      console.log('Scene [' + name + '] is already defined!');
      return;
    }

    var pair = { ctor: ctor, inst: null };
    core.scenes[name] = pair;
  },
  setScene: function setScene(name) {
    var pair = core.scenes[name];

    if (!pair) {
      console.log('Scene [' + name + '] is not defined!');
      return;
    }

    core._nextScene = pair;
  },

  startWithScene: function startWithScene(sceneName) {
    core.setScene(sceneName);

    window.addEventListener('load', core.boot, false);
    document.addEventListener('DOMContentLoaded', core.boot, false);
  },

  startLoop: function startLoop() {
    core._loopId = requestAnimationFrame(core.loop);
  },
  loop: function loop(timestamp) {
    core._loopId = requestAnimationFrame(core.loop);

    Timer.update(timestamp);

    if (core._nextScene) {
      var pair = core._nextScene;
      core._nextScene = null;

      core.scene && core.scene._freeze();

      if (!pair.inst) {
        pair.inst = new pair.ctor();
      }

      core.scene = pair.inst;
      core.scene._awake();
    }

    core.scene && core.scene.tickAndRun();
  },
  endLoop: function endLoop() {
    cancelAnimationFrame(core._loopId);
  },

  boot: function boot() {
    window.removeEventListener('load', core.boot);
    document.removeEventListener('DOMContentLoaded', core.boot);

    Renderer.init(core.width, core.height, Object.assign({
      canvasId: 'game',
    }, config.renderer));
    core.startLoop();

    // Listen to the resizing event
    window.addEventListener('resize', core.resize, false);

    // Manually resize for the first time
    core.resize();
  },
  resize: function resize() {
    Renderer.resize(window.innerWidth, window.innerHeight);

    core.viewWidth = window.innerWidth;
    core.viewHeight = window.innerHeight;

    core.emit('resize', core.viewWidth, core.viewHeight);
  },
});

module.exports = exports = core;
