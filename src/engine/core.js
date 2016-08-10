require('engine/polyfill');

var EventEmitter = require('engine/eventemitter3');
var Renderer = require('engine/renderer');
var Timer = require('engine/timer');
var Vector = require('engine/vector');
var resize = require('engine/resize');
var device = require('engine/device');
var config = require('game/config').default;

/**
 * @type {EventEmitter}
 * @private
 */
var core = new EventEmitter();

// Public properties and methods
Object.assign(core, {
  /**
   * Version text.
   * @memberof module:engine/core
   * @type {string}
   */
  version: 'v0.4.1-dev',

  /**
   * Main Canvas element.
   * @memberof module:engine/core
   * @type {HTMLCanvasElement}
   */
  view: null,

  /**
   * Div that contains game canvas.
   * @memberof module:engine/core
   * @type {HTMLCanvasElement}
   */
  containerView: null,

  /**
   * Size of game content.
   * @memberof module:engine/core
   * @type {Vector}
   * @default (640, 400)
   */
  size: Vector.create(config.width || 640, config.height || 400),
  /**
   * Size of view (devicePixelRatio independent).
   * @memberof module:engine/core
   * @type {Vector}
   */
  viewSize: Vector.create(config.width || 640, config.height || 400),
  /**
   * Current resize function.
   * @memberof module:engine/core
   * @type {function}
   */
  resizeFunc: null,

  /**
   * Map of registered scenes.
   * @memberof module:engine/core
   * @type {object}
   */
  scenes: {},
  /**
   * Current activated scene.
   * Note: this may be undefined during switching.
   * Will be deprecated in future versions.
   * @memberof module:engine/core
   * @type {Scene}
   */
  scene: null,

  /**
   * Map that contains pause state of all kinds of reasons.
   * See {@link core.pause} for more information.
   * @memberof module:engine/core
   * @type {object}
   */
  pauses: {},

  /**
   * Global time speed, whose value is between 0 and 1.
   * @memberof module:engine/core
   * @type {number}
   * @default 1
   */
  speed: 1,
  /**
   * Delta time since last **update** (in milliseconds).
   * This can be useful for time based updating.
   * @memberof module:engine/core
   * @type {number}
   */
  delta: 0,

  /**
   * Rotate prompt element for mobile devices.
   * @memberof module:engine/core
   * @type {HTMLElement}
   */
  rotatePromptElm: null,
  /**
   * Whether the rotate prompt is visible.
   * @memberof module:engine/core
   * @type {boolean}
   */
  rotatePromptVisible: false,

  /**
   * Register a new scene class.
   * @memberof module:engine/core
   *
   * @example
   * import core from 'engine/core';
   * class MyScene extends Scene {}
   * core.addScene('MyScene', MyScene);
   *
   * @param {string}    name  Name of this scene.
   * @param {function}  ctor  Constructor of the scene.
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
   * Switch to a scene.
   * @memberof module:engine/core
   * @param {string} name Name of the target scene.
   * @param {boolean} newInstance Whether create new instance for this scene.
   */
  setScene: function setScene(name, newInstance) {
    var pair = core.scenes[name];

    if (!pair) {
      console.log('Scene [' + name + '] is not defined!');
      return;
    }

    if (!!newInstance) {
      pair.inst = null;
    }

    nextScene = pair;
  },
  /**
   * Entrance of the game, set the first scene to boot with.
   * Note: it's recommend to set the first scene to `Loading` or
   * your customized loading scene, otherwise the assets won't get load.
   *
   * Simply use `core.start` instead if you don't want to start
   * from a custom loading scene.
   *
   * @example
   * // In the `game/main` module
   * import core from 'engine/core';
   * core.startWithScene('MyCustomLoading');
   * // or simply use the default loading scene
   * core.start();
   *
   * @memberof module:engine/core
   * @param  {string} sceneName Name of the start scene
   */
  startWithScene: function startWithScene(sceneName) {
    core.setScene(sceneName);

    window.addEventListener('load', boot, false);
    document.addEventListener('DOMContentLoaded', boot, false);
  },
  /**
   * Start with `Loading` scene.
   * @memberof module:engine/core
   */
  start: function start() {
    core.startWithScene('Loading');
  },

  /**
   * Pause the engine with a reason.
   * @memberof module:engine/core
   *
   * @example
   * import core from 'engine/core';
   * // Pause when ad is playing
   * core.pause('ad');
   * // And resume after the ad finished
   * core.resume('ad');
   *
   * @param {string} reason  The reason to pause, you have to pass
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
   * Unpause the engine.
   * @memberof module:engine/core
   * @param {string} reasonP Resume from pause tagged with this reason
   * @param {boolean} force Whether force to resume
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

/**
 * Width of the game.
 * Should keep the same to `config` settings.
 * @memberof module:engine/core
 * @type {number}
 * @readonly
 */
Object.defineProperty(core, 'width', {
  get: function() {
    return this.size.x;
  },
});
/**
 * Height of the game.
 * Should keep the same to `config` settings.
 * @memberof module:engine/core
 * @type {number}
 * @readonly
 */
Object.defineProperty(core, 'height', {
  get: function() {
    return this.size.y;
  },
});
/**
 * Width of the game view, `devicePixelRatio` is not take into account.
 * @memberof module:engine/core
 * @type {number}
 * @readonly
 */
Object.defineProperty(core, 'viewWidth', {
  get: function() {
    return this.viewSize.x;
  },
});
/**
 * Height of the game view, `devicePixelRatio` is not take into account.
 * @memberof module:engine/core
 * @type {number}
 * @readonly
 */
Object.defineProperty(core, 'viewHeight', {
  get: function() {
    return this.viewSize.y;
  },
});
/**
 * Whether the game is currently paused by any reason.
 * @memberof module:engine/core
 * @type {boolean}
 * @readonly
 */
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

// Fetch device info and setup
if (config.renderer && config.renderer.resolution) {
  core.resolution = chooseProperResolution(config.renderer.resolution);
}
else {
  core.resolution = 1;
}

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
  core.containerView = document.getElementById('container');

  // Keep focus when mouse/touch event occurs on the canvas
  function focus() { window.focus() }
  core.view.addEventListener('mousedown', focus);
  core.view.addEventListener('touchstart', focus);

  // Config and create renderer
  Renderer.resolution = rendererConfig.resolution = core.resolution;

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
    if (config.pauseOnHide) core.resume('visibility');
  };
  var visiblePause = function() {
    if (config.pauseOnHide) core.pause('visibility');
  };

  // Main visibility API function
  var vis = (function() {
    var stateKey, eventKey;
    var keys = {
      hidden: "visibilitychange",
      mozHidden: "mozvisibilitychange",
      webkitHidden: "webkitvisibilitychange",
      msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
      if (stateKey in document) {
        eventKey = keys[stateKey];
        break;
      }
    }
    return function(c) {
      if (c) document.addEventListener(eventKey, c, false);
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
    core.rotatePromptElm = div;
    document.body.appendChild(div);

    if (config.rotatePromptImg) {
      var img = new Image();
      img.onload = function() {
        div.image = img;
        div.appendChild(img);
        resizeRotatePrompt();
      };
      img.src = config.rotatePromptImg;
      img.className = 'center';
      core.rotatePromptImg = img;
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
  core.rotatePromptElm.style.width = window.innerWidth + 'px';
  core.rotatePromptElm.style.height = window.innerHeight + 'px';
  _alignToWindowCenter(core.rotatePromptElm, window.innerWidth, window.innerHeight);

  var imgRatio = core.rotatePromptImg.width / core.rotatePromptImg.height;
  var windowRatio = window.innerWidth / window.innerHeight;
  var w, h;
  if (imgRatio < windowRatio) {
    w = Math.floor(window.innerHeight * 0.8);
    h = Math.floor(w / imgRatio);
  }
  else {
    h = Math.floor(window.innerWidth * 0.8);
    w = Math.floor(h * imgRatio);
  }
  core.rotatePromptImg.style.height = w + 'px';
  core.rotatePromptImg.style.width = h + 'px';
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
 * @private
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

// Resize functions
var windowSize = { x: 1, y: 1 };
var scaledWidth, scaledHeight;
var result, container;
function _letterBoxResize(first) {
  // Update sizes
  windowSize.x = window.innerWidth;
  windowSize.y = window.innerHeight;

  // Use inner box scaling function to calculate correct size
  result = resize.outerBoxResize(windowSize, core.viewSize);

  // Resize the renderer once
  if (first) Renderer.resize(core.viewSize.x, core.viewSize.y);

  scaledWidth = Math.floor(core.viewSize.x * result.scale);
  scaledHeight = Math.floor(core.viewSize.y * result.scale);

  // Resize the view
  core.view.style.width = scaledWidth + 'px';
  core.view.style.height = scaledHeight + 'px';

  // Resize the container
  core.containerView.style.width = scaledWidth + 'px';
  core.containerView.style.height = scaledHeight + 'px';
  core.containerView.style.marginTop = Math.floor(result.top) + 'px';
  core.containerView.style.marginLeft = Math.floor(result.left) + 'px';

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);

  // Reset scroll for mobile devices
  if (device.mobile) {
    window.scrollTo(0, 1);
  }
}
function _cropResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);
  core.view.style.width = core.containerView.style.width = window.innerWidth + 'px';
  core.view.style.height = core.containerView.style.height = window.innerHeight + 'px';

  // Resize the renderer
  Renderer.resize(core.viewSize.x, core.viewSize.y);

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);

  // Reset scroll for mobile devices
  if (device.mobile) {
    window.scrollTo(0, 1);
  }
}
function _scaleInnerResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);
  core.view.style.width = core.containerView.style.width = window.innerWidth + 'px';
  core.view.style.height = core.containerView.style.height = window.innerHeight + 'px';

  // Resize the renderer
  Renderer.resize(core.viewSize.x, core.viewSize.y);

  // Resize container of current scene
  if (core.scene) {
    container = core.scene.stage;
    result = resize.innerBoxResize(core.viewSize, core.size);
    container.scale.set(result.scale);
    container.position.set(result.left, result.top);
  }

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);

  // Reset scroll for mobile devices
  if (device.mobile) {
    window.scrollTo(0, 1);
  }
}
function _scaleOuterResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);
  core.view.style.width = core.containerView.style.width = window.innerWidth + 'px';
  core.view.style.height = core.containerView.style.height = window.innerHeight + 'px';

  // Resize the renderer
  Renderer.resize(core.viewSize.x, core.viewSize.y);

  // Resize container of current scene
  if (core.scene) {
    container = core.scene.stage;
    result = resize.outerBoxResize(core.viewSize, core.size);
    container.scale.set(result.scale);
    container.position.set(result.left, result.top);
  }

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);

  // Reset scroll for mobile devices
  if (device.mobile) {
    window.scrollTo(0, 1);
  }
}

// CSS helpers
function _alignToWindowCenter(el, w, h) {
  el.style.marginLeft = Math.floor((window.innerWidth - w) / 2) + 'px';
  el.style.marginTop = Math.floor((window.innerHeight - h) / 2) + 'px';
}
function _noPageScroll() {
  document.ontouchmove = function(event) {
    event.preventDefault();
  }
}

/**
 * Engine core that manages game loop and resize functionality.
 * @exports engine/core
 *
 * @requires module:engine/polyfill
 * @requires module:engine/eventemitter3
 * @requires module:engine/renderer
 * @requires module:engine/timer
 * @requires module:engine/vector
 * @requires module:engine/resize
 * @requires module:engine/device
 */
module.exports = core;
