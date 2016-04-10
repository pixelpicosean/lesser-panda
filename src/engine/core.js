require('engine/polyfill');

var EventEmitter = require('engine/eventemitter3');
var Renderer = require('engine/renderer');
var Timer = require('engine/timer');
var Vector = require('engine/vector');
var resize = require('engine/resize');
var device = require('engine/device');
var config = require('game/config').default;

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
  if (!core.paused) {
    tickAndRender(core.scene, timestamp);
  }
}
function endLoop() {
  cancelAnimationFrame(loopId);
}
function boot() {
  window.removeEventListener('load', boot);
  document.removeEventListener('DOMContentLoaded', boot);

  // Disable scroll
  _noPageScroll();

  var rendererConfig = Object.assign({
    canvasId: 'game',
  }, config.renderer);

  core.view = document.getElementById(rendererConfig.canvasId);

  // Keep focus when mouse/touch event occurs on the canvas
  function focus() { window.focus() }
  core.view.addEventListener('mousedown', focus);
  core.view.addEventListener('touchstart', focus);

  // Config and create renderer
  core.resolution = Renderer.resolution = rendererConfig.resolution =
    chooseProperResolution(rendererConfig.resolution);

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
    case 'never':
      resizeFunc = _neverResize;
      break;
    default:
      resizeFunc = _letterBoxResize;
  }
  core.resizeFunc = resizeFunc;

  // Listen to the resize and orientation events
  window.addEventListener('resize', resizeFunc, false);
  window.addEventListener('orientationchange', resizeFunc, false);

  // Manually resize for the first time
  resizeFunc(true);

  // Setup visibility change API
  var visibleResume = function() {
    config.pauseOnHide && core.resume('visibility');
  };
  var visiblePause = function() {
    config.pauseOnHide && core.pause('visibility');
  };

  // Main visibility API function
  var vis = (function() {
    var stateKey, eventKey;
    var keys = {
      hidden: "visibilitychange",
      webkitHidden: "webkitvisibilitychange",
      mozHidden: "mozvisibilitychange",
      msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
      if (stateKey in document) {
        eventKey = keys[stateKey];
        break;
      }
    }
    return function(c) {
      if (c) document.addEventListener(eventKey, c);
      return !document[stateKey];
    }
  })();

  // Check if current tab is active or not
  vis(function() {
    if (vis()) {
      // The setTimeout() is used due to a delay
      // before the tab gains focus again, very important!
      setTimeout(visibleResume, 300);
    }
    else {
      visiblePause();
    }
  });

  // Check if browser window has focus
  if (window.addEventListener) {
    window.addEventListener('focus', function() {
      setTimeout(visibleResume, 300);
    }, false);
    window.addEventListener('blur', visiblePause, false);
  }
  else {
    window.attachEvent("focus", function() {
      setTimeout(visibleResume, 300);
    });
    window.attachEvent('blur', visiblePause);
  }

  // Create rotate prompt if required
  if (device.mobile && config.showRotatePrompt) {
    var div = document.createElement('div');
    div.innerHTML = config.rotatePromptImg ? '' : config.rotatePromptMsg;
    div.style.position = 'absolute';
    div.style.height = '12px';
    div.style.textAlign = 'center';
    div.style.left = 0;
    div.style.right = 0;
    div.style.top = 0;
    div.style.bottom = 0;
    div.style.margin = 'auto';
    div.style.display = 'none';
    div.style.color = config.rotatePromptFontColor || 'black';
    div.id = 'lp-rotate';
    core.rotatePromptElm = div;
    document.body.appendChild(div);

    if (config.rotatePromptImg) {
      var img = new Image();
      var me = this;
      img.onload = function() {
        div.image = img;
        div.style.height = img.height + 'px';
        div.appendChild(img);
        resizeRotatePrompt();
      };
      img.src = config.rotatePromptImg;
      img.style.position = 'relative';
      img.style.maxWidth = '100%';
    }

    // Check orientation and display the rotate prompt if required
    var isLandscape = (core.width / core.height >= 1);
    core.on('resize', function() {
      if (window.innerWidth < window.innerHeight && isLandscape) {
        core.rotatePromptVisible = true;
      }
      else if (window.innerWidth > window.innerHeight && !isLandscape) {
        core.rotatePromptVisible = true;
      }
      else {
        core.rotatePromptVisible = false;
      }

      // Hide game view
      core.view.style.display = core.rotatePromptVisible ? 'none' : 'block';
      // Show rotate view
      core.rotatePromptElm.style.backgroundColor = config.rotatePromptBGColor || 'black';
      core.rotatePromptElm.style.display = core.rotatePromptVisible ? '-webkit-box' : 'none';
      core.rotatePromptElm.style.display = core.rotatePromptVisible ? '-webkit-flex' : 'none';
      core.rotatePromptElm.style.display = core.rotatePromptVisible ? '-ms-flexbox' : 'none';
      core.rotatePromptElm.style.display = core.rotatePromptVisible ? 'flex' : 'none';
      resizeRotatePrompt();

      // Pause the game if orientation is not correct
      if (core.rotatePromptVisible) {
        core.pause('rotate');
      }
      else {
        core.resume('rotate');
      }
    });
  }

  core.emit('boot');
  core.emit('booted');
}
function getVendorAttribute(el, attr) {
  var uc = attr.ucfirst();
  return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
}
function chooseProperResolution(res) {
  // Default value
  if (!res) {
    return 1;
  }
  // Numerical value
  else if (typeof(res) === 'number') {
    return res;
  }
  // Calculate based on window size and device pixel ratio
  else {
    res.values.sort(function(a, b) { return a - b });
    var gameRatio = core.width / core.height;
    var windowRatio = window.innerWidth / window.innerHeight;
    var scale = res.retina ? window.devicePixelRatio : 1;
    var result = res.values[0];
    for (var i = 0; i < res.values.length; i++) {
      result = res.values[i];

      if ((gameRatio >= windowRatio && window.innerWidth * scale <= core.width * result) ||
        (gameRatio < windowRatio && window.innerHeight * scale <= core.height * result)) {
        break;
      }
    }

    return result;
  }
}
function resizeRotatePrompt() {
  _fullWindowStyle(core.rotatePromptElm);
  _alignToWindowCenter(core.rotatePromptElm, window.innerWidth, window.innerHeight);

  // if (core.rotatePromptElm.image) {
  //   if (window.innerHeight < core.rotatePromptElm.image.height) {
  //     core.rotatePromptElm.image.style.height = window.innerHeight + 'px';
  //     core.rotatePromptElm.image.style.width = 'auto';
  //     core.rotatePromptElm.style.height = window.innerHeight + 'px';
  //     core.rotatePromptElm.style.bottom = 'auto';
  //   }
  // }
}

// Update (fixed update implementation from Phaser by @photonstorm)
var spiraling = 0;
var last = -1;
var realDelta = 0;
var deltaTime = 0;
var desiredFPS = 30;
var currentUpdateID = 0;
var lastCount = 0;
var step = 0;
var slowStep = 0;
var count = 0;
/**
 * Update and render a scene
 * @param  {Scene} scene      Scene to be updated
 * @param  {Number} timestamp Current time stamp
 */
function tickAndRender(scene, timestamp) {
  if (last > 0) {
    realDelta = timestamp - last;
  }
  last = timestamp;

  // If the logic time is spiraling upwards, skip a frame entirely
  if (spiraling > 1) {
    // Reset the deltaTime accumulator which will cause all pending dropped frames to be permanently skipped
    deltaTime = 0;
    spiraling = 0;

    renderScene(scene);
  }
  else {
    desiredFPS = scene ? scene.desiredFPS : 30;

    // Step size
    step = 1000.0 / desiredFPS;
    slowStep = step * core.speed;

    // Accumulate time until the step threshold is met or exceeded... up to a limit of 3 catch-up frames at step intervals
    deltaTime += Math.max(Math.min(step * 3, realDelta), 0);

    // Call the game update logic multiple times if necessary to "catch up" with dropped frames
    // unless forceSingleUpdate is true
    count = 0;

    while (deltaTime >= step) {
      deltaTime -= step;
      currentUpdateID = count;

      // Fixed update with the timestep
      core.delta = step;
      Timer.update(slowStep);
      updateScene(scene);

      count += 1;
    }

    // Detect spiraling (if the catch-up loop isn't fast enough, the number of iterations will increase constantly)
    if (count > lastCount) {
      spiraling += 1;
    }
    else if (count < lastCount) {
      // Looks like it caught up successfully, reset the spiral alert counter
      spiraling = 0;
    }

    lastCount = count;

    renderScene(scene);
  }
}
function updateScene(scene) {
  // Switch to new scene
  if (nextScene) {
    var pair = nextScene;
    nextScene = null;

    // Freeze current scene before switching
    core.scene && core.scene._freeze();
    core.scene = null;

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

  // Update current scene
  if (scene) {
    scene._update(slowStep, slowStep * 0.001);
  }
}
var skipFrameCounter = 0;
function renderScene(scene) {
  skipFrameCounter -= 1;
  if (skipFrameCounter < 0) {
    skipFrameCounter = (config.skipFrame || 0);

    if (scene) {
      Renderer.render(scene);
    }
  }
}

// Public properties and methods
Object.assign(core, {
  /**
   * Main Canvas element
   */
  view: null,

  /**
   * Size of game content
   * @type {Number}
   */
  size: Vector.create(config.width || 640, config.height || 400),
  /**
   * Size of view (devicePixelRatio independent)
   * @type {Number}
   */
  viewSize: Vector.create(config.width || 640, config.height || 400),
  resizeFunc: null,

  /**
   * Map of registered scenes
   * @type {Object}
   */
  scenes: {},
  /**
   * Current activated scene.
   * Note: this can be undefined during switching
   * @type {Scene}
   */
  scene: null,

  /**
   * Hash that contains pause state of all kinds of reasons
   * @type {Object}
   */
  pauses: {},

  /**
   * Speed
   * @type {Number}
   */
  speed: 1,
  /**
   * Delta time since last **update**
   * This can be useful for time based updating
   * @type {Number}
   */
  delta: 0,

  /**
   * Rotate prompt element for mobile devices
   * @type {HTMLElement}
   */
  rotatePromptElm: null,
  /**
   * Whether the rotate prompt is visible
   * @type {Boolean}
   */
  rotatePromptVisible: false,

  /**
   * Register a scene
   * @param {String}    name  Name of this scene
   * @param {Function}  ctor  Constructor of the scene
   */
  addScene: function addScene(name, ctor) {
    if (core.scenes[name]) {
      console.log('Scene [' + name + '] is already defined!');
      return;
    }

    var pair = { ctor: ctor, inst: null };
    core.scenes[name] = pair;
  },
  /**
   * Switch to a scene by its name
   * @param {String} name Name of the target scene
   */
  setScene: function setScene(name) {
    var pair = core.scenes[name];

    if (!pair) {
      console.log('Scene [' + name + '] is not defined!');
      return;
    }

    nextScene = pair;
  },
  /**
   * Entrance of the game, set the first scene to boot with
   * @param  {String} sceneName Name of the start scene
   */
  startWithScene: function startWithScene(sceneName) {
    core.setScene(sceneName);

    window.addEventListener('load', boot, false);
    document.addEventListener('DOMContentLoaded', boot, false);
  },

  /**
   * Pause the engine
   * @param {String} reasonP The reason to pause, you have to pass
   *                         the same reason when resume from this
   *                         pause.
   */
  pause: function pause(reasonP) {
    var i,
      reason = reasonP || 'untitled',
      alreadyPaused = false;

    for (i in core.pauses) {
      if (!core.pauses.hasOwnProperty(i)) continue;
      // Do not pause again if game is paused by other reasons
      if (core.pauses[i]) {
        alreadyPaused = true;
        break;
      }
    }

    core.pauses[reason] = true;

    if (!alreadyPaused) {
      core.emit('pause', reason);
    }
  },
  /**
   * Unpause the engine
   * @param {String} reasonP Resume from pause tagged with this reason
   * @param {Boolean} force Whether force to resume
   */
  resume: function resume(reasonP, force) {
    var i, reason = reasonP || 'untitled';

    if (force) {
      // Resume everything
      for (i in core.pauses) {
        if (!core.pauses.hasOwnProperty(i)) continue;
        core.pauses[i] = false;
      }
      core.emit('resume');
    }
    else if (typeof(core.pauses[reason]) === 'boolean') {
      core.pauses[reason] = false;
      for (i in core.pauses) {
        if (!core.pauses.hasOwnProperty(i)) continue;
        // Do not resume if game is still paused by other reasons
        if (core.pauses[i]) {
          return;
        }
      }

      core.emit('resume', reason);
    }
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
Object.defineProperty(core, 'paused', {
  get: function() {
    // Paused by any reason?
    for (var i in core.pauses) {
      if (core.pauses[i]) {
        return true;
      }
    }

    // Totally unpaused
    return false;
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

  _alignToWindowCenter(core.view, core.viewSize.x * result.scale, core.viewSize.y * result.scale);

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);
}
function _cropResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);

  // Resize the renderer
  Renderer.resize(core.viewSize.x, core.viewSize.y);

  _fullWindowStyle(core.view);

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
    container = core.scene.stage;
    result = resize.innerBoxResize(core.viewSize, core.size);
    container.scale.set(result.scale);
    container.position.set(result.left, result.top);
  }

  _fullWindowStyle(core.view);

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
    container = core.scene.stage;
    result = resize.outerBoxResize(core.viewSize, core.size);
    container.scale.set(result.scale);
    container.position.set(result.left, result.top);
  }

  _fullWindowStyle(core.view);

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);
}
function _neverResize() {}

// CSS helpers
function _alignToWindowCenter(el, w, h) {
  el.style.position = 'absolute';
  el.style.left = '50%';
  el.style.top = '50%';
  el.style.margin = '-' + Math.floor(h / 2) + 'px 0 0 -' + Math.floor(w / 2) + 'px';
}
function _fullWindowStyle(el) {
  el.style.position = 'absolute';
  el.style.left = '0';
  el.style.top = '0';
  el.style.right = '0';
  el.style.bottom = '0';
  el.style.width = '100%';
  el.style.height = '100%';
}
function _noPageScroll() {
  document.ontouchmove = function(event) {
    event.preventDefault();
  }
}

module.exports = exports = core;
