require('engine/polyfill');

var EventEmitter = require('engine/eventemitter3');
var Scene = require('engine/scene');
var Renderer = require('engine/renderer');
var Timer = require('engine/timer');
var Vector = require('engine/vector');
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

  // Do not update anything when paused
  if (core.paused) return;

  Timer.update(timestamp);

  if (nextScene) {
    var pair = nextScene;
    nextScene = null;

    // Freeze current scene before switching
    core.scene && core.scene._freeze();

    // Create instance of scene if not exist
    if (!pair.inst) {
      pair.inst = new pair.ctor();
    }

    // Awake the scene
    core.scene = pair.inst;
    core.scene._awake();

    // Resize container of the scene
    resizeFunc();
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
    case 'crop':
      resizeFunc = _cropResize;
      break;
    case 'scale-inner':
      resizeFunc = _scaleInnerResize;
      break;
    case 'scale-outer':
      resizeFunc = _scaleOuterResize;
      break;
  }

  // Listen to the resiz and orientation events
  window.addEventListener('resize', resizeFunc, false);
  window.addEventListener('orientationchange', resizeFunc, false);

  // Manually resize for the first time
  resizeFunc(true);

  // Listen to visibilit change events
  var visibilityChange;
  if (typeof document.hidden !== 'undefined') {
    visibilityChange = 'visibilitychange';
  }
  else if (typeof document.mozHidden !== 'undefined') {
    visibilityChange = 'mozvisibilitychange';
  }
  else if (typeof document.msHidden !== 'undefined') {
    visibilityChange = 'msvisibilitychange';
  }
  else if (typeof document.webkitHidden !== 'undefined') {
    visibilityChange = 'webkitvisibilitychange';
  }
  document.addEventListener(visibilityChange, function() {
    if (config.pauseOnHide) {
      var hidden = !!getVendorAttribute(document, 'hidden');
      if (hidden) {
        core.pause();
      }
      else {
        core.resume();
      }
    }
  }, false);
}
function getVendorAttribute(el, attr) {
  var uc = attr.ucfirst();
  return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
}

// Public properties and methods
Object.assign(core, {
  scenes: {},
  scene: null,
  view: null,

  paused: false,

  /* Size of game content */
  size: Vector.create(config.width || 640, config.height || 400),

  /* Size of view (devicePixelRatio independent) */
  viewSize: Vector.create(config.width || 640, config.height || 400),

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

  pause: function pause() {
    if (core.paused) return;
  },
  resume: function resume() {
    if (!core.paused) return;

    Timer.last = performance.now();
  },
});

Object.defineProperty(core, 'width', {
  get: function() {
    return this.size.x;
  },
});
Object.defineProperty(core, 'height', {
  get: function() {
    return this.size.y;
  },
});
Object.defineProperty(core, 'viewWidth', {
  get: function() {
    return this.viewSize.x;
  },
});
Object.defineProperty(core, 'viewHeight', {
  get: function() {
    return this.viewSize.y;
  },
});

// Resize functions
var windowSize = { x: 1, y: 1 };
var result, container;
function _letterBoxResize(first) {
  // Update sizes
  windowSize.x = window.innerWidth;
  windowSize.y = window.innerHeight;

  // Use inner box scaling function to calculate correct size
  result = resize.innerBoxResize(windowSize, core.viewSize);

  // Resize the renderer once
  first && Renderer.resize(core.viewSize.x, core.viewSize.y);

  // Resize the view
  core.view.style.width = (core.viewSize.x * result.scale) + 'px';
  core.view.style.height = (core.viewSize.y * result.scale) + 'px';

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);
}
function _cropResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);

  // Resize the renderer
  Renderer.resize(core.viewSize.x, core.viewSize.y);

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);
}
function _scaleInnerResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);

  // Resize the renderer
  Renderer.resize(core.viewSize.x, core.viewSize.y);

  // Resize container of current scene
  if (core.scene) {
    container = core.scene.container;
    result = resize.innerBoxResize(core.viewSize, core.size);
    container.scale.set(result.scale);
    container.position.set(result.left, result.top);
  }

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);
}
function _scaleOuterResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);

  // Resize the renderer
  Renderer.resize(core.viewSize.x, core.viewSize.y);

  // Resize container of current scene
  if (core.scene) {
    container = core.scene.container;
    result = resize.outerBoxResize(core.viewSize, core.size);
    container.scale.set(result.scale);
    container.position.set(result.left, result.top);
  }

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);
}

module.exports = exports = core;
