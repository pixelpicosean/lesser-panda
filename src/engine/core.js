require('engine/polyfill');

var EventEmitter = require('engine/eventemitter3');
var Scene = require('engine/scene');
var Renderer = require('engine/renderer');
var Timer = require('engine/timer');
var resize = require('engine/resize');
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

// - Private properties and methods
var nextScene = null;
var loopId = 0;
var resizeFunc = _letterBoxResize;
function startLoop() {
  loopId = requestAnimationFrame(loop);
}
function loop(timestamp) {
  loopId = requestAnimationFrame(loop);

  Timer.update(timestamp);

  if (nextScene) {
    var pair = nextScene;
    nextScene = null;

    core.scene && core.scene._freeze();

    if (!pair.inst) {
      pair.inst = new pair.ctor();
    }

    core.scene = pair.inst;
    core.scene._awake();
  }

  core.scene && core.scene.tickAndRun();
}
function endLoop() {
  cancelAnimationFrame(loopId);
}
function boot() {
  window.removeEventListener('load', boot);
  document.removeEventListener('DOMContentLoaded', boot);

  var rendererConfig = Object.assign({
    canvasId: 'game',
  }, config.renderer);

  core.view = document.getElementById(rendererConfig.canvasId);

  Renderer.init(core.width, core.height, rendererConfig);
  startLoop();

  // Pick a resize function
  switch (config.resizeMode) {
    case 'letter-box':
      resizeFunc = _letterBoxResize;
      break;
    case 'fill':
      resizeFunc = _fillResize;
      break;
  }

  // Listen to the resiz and orientation events
  window.addEventListener('resize', resizeFunc, false);
  window.addEventListener('orientationchange', resizeFunc, false);

  // Manually resize for the first time
  resizeFunc(true);
}

// Public properties and methods
Object.assign(core, {
  scenes: {},
  scene: null,
  view: null,

  /* Size of game content */
  width: config.width || 640,
  height: config.height || 400,

  /* Size of view (devicePixelRatio independent) */
  viewWidth: config.width || 640,
  viewHeight: config.height || 400,

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

    nextScene = pair;
  },
  startWithScene: function startWithScene(sceneName) {
    core.setScene(sceneName);

    window.addEventListener('load', boot, false);
    document.addEventListener('DOMContentLoaded', boot, false);
  },
});

// Resize functions
var windowSize = { x: 1, y: 1 };
var viewSize = { x: 1, y: 1 };
var result;
function _letterBoxResize(first) {
  // Update sizes
  windowSize.x = window.innerWidth;
  windowSize.y = window.innerHeight;

  viewSize.x = core.width;
  viewSize.y = core.height;

  // Use inner box scaling function to calculate correct size
  result = resize.innerBoxResize(windowSize, viewSize);

  // Resize the renderer once
  first && Renderer.resize(viewSize.x, viewSize.y);

  // Resize the view
  core.view.style.width = (viewSize.x * result.scale) + 'px';
  core.view.style.height = (viewSize.y * result.scale) + 'px';

  // Broadcast resize events
  core.emit('resize', core.viewWidth, core.viewHeight);
}
function _fillResize() {
  // Update sizes
  core.viewWidth = window.innerWidth;
  core.viewHeight = window.innerHeight;

  // Resize the renderer
  Renderer.resize(window.innerWidth, window.innerHeight);

  // Broadcast resize events
  core.emit('resize', core.viewWidth, core.viewHeight);
}

module.exports = exports = core;
