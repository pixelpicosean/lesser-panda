require('engine/polyfill');

const EventEmitter = require('engine/EventEmitter');
const Vector = require('engine/Vector');
const resize = require('engine/resize');
const device = require('engine/device');
const config = require('game/config');

/**
 * @type {EventEmitter}
 * @private
 */
const core = new EventEmitter();
let nextGameIdx = 1;

// Public properties and methods
Object.assign(core, {
  /**
   * Version text.
   * @memberof module:engine/core
   * @type {string}
   */
  version: 'v1.1',

  /**
   * Set to `false` to disable version info console output.
   * @memberof module:engine/core
   * @type {Boolean}
   */
  sayHello: true,

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
   * Canvas resolution properly choosed based on configs.
   * @memberof module:engine/core
   * @type {Number}
   */
  resolution: 1,

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
   * Map of registered games.
   * @memberof module:engine/core
   * @type {object}
   */
  games: {},
  /**
   * Current activated game.
   * Note: this may be undefined during switching.
   * Will be deprecated in future versions.
   * @memberof module:engine/core
   * @type {Game}
   */
  game: null,

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
   * Switch to a game.
   * @memberof module:engine/core
   * @param {Game} gameCtor               Game class to be set
   * @param {Boolean} [newInstance=false] Whether create new instance for this game.
   * @param {Object} [param={}]           Parameters to pass to the game(to `Game#awake`)
   */
  setGame: function(gameCtor, newInstance = false, param = {}) {
    if (!gameCtor.id) {
      gameCtor.id = nextGameIdx++;
    }

    let pair = core.games[gameCtor.id];

    if (!pair) {
      pair = { ctor: gameCtor, inst: null, param: param };
    }
    pair.param = param;

    if (newInstance) {
      pair.inst = null;
    }

    nextGame = pair;
  },
  /**
   * Main entry.
   * @memberof module:engine/core
   * @param {Game} gameCtor   First game class
   * @param {Game} loaderCtor Asset loader class
   */
  main: function(gameCtor, loaderCtor) {
    core.setGame(loaderCtor, true, { gameClass: gameCtor });

    window.addEventListener('load', boot, false);
    document.addEventListener('DOMContentLoaded', boot, false);
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
   * @param {String} [reason='untitled']  The reason to pause, you have to pass
   *                                      the same reason when resume from this
   *                                      pause.
   */
  pause: function(reason = 'untitled') {
    let i, alreadyPaused = false;

    for (i in core.pauses) {
      if (!core.pauses.hasOwnProperty(i)) {continue;}
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
   * @param {String} [reason='untitled']  Resume from pause tagged with this reason
   * @param {Boolean} [force=false]       Whether force to resume
   */
  resume: function(reason = 'untitled', force = false) {
    let i;

    if (force) {
      // Resume everything
      for (i in core.pauses) {
        if (!core.pauses.hasOwnProperty(i)) {continue;}
        core.pauses[i] = false;
      }
      core.emit('resume');
    }
    else if (typeof(core.pauses[reason]) === 'boolean') {
      core.pauses[reason] = false;
      for (i in core.pauses) {
        if (!core.pauses.hasOwnProperty(i)) {continue;}
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
if (config.gfx && config.gfx.resolution) {
  core.resolution = chooseProperResolution(config.gfx.resolution);
}

// - Private properties and methods
let nextGame = null;
let loopId = 0;
let resizeFunc = _letterBoxResize;
/**
 * @private
 */
function startLoop() {
  loopId = requestAnimationFrame(loop);
}
/**
 * @param {Number} timestamp Timestamp at this frame.
 * @private
 */
function loop(timestamp) {
  loopId = requestAnimationFrame(loop);

  // Do not update anything when paused
  if (!core.paused) {
    // Switch to new game
    if (nextGame) {
      let pair = nextGame;
      nextGame = null;

      // Freeze current game before switching
      if (core.game) {
        core.off('pause', core.game.pause, core.game);
        core.off('resume', core.game.resume, core.game);
        core.off('resize', core.game.resize, core.game);
        core.game.freeze();
      }
      core.game = null;

      // Create instance of game if not exist
      if (!pair.inst) {pair.inst = new pair.ctor();}

      // Awake the game
      core.game = pair.inst;
      core.on('pause', core.game.pause, core.game);
      core.on('resume', core.game.resume, core.game);
      core.on('resize', core.game.resize, core.game);
      core.game.awake(pair.param);

      // Resize container of the game
      resizeFunc();
    }

    // Update current game
    if (core.game) {
      core.game.run(timestamp);
    }

    // Tick
    core.emit('tick');
  }
}
/**
 * @private
 */
core.endLoop = function endLoop() {
  cancelAnimationFrame(loopId);
};
/**
 * @private
 */
function boot() {
  window.removeEventListener('load', boot);
  document.removeEventListener('DOMContentLoaded', boot);

  // Disable scroll
  _noPageScroll();

  core.view = document.getElementById(config.canvas || 'game');
  core.containerView = document.getElementById('container');

  /**
   * Keep focus when mouse/touch event occurs on the canvas.
   * @private
   */
  function focus() { window.focus(); }
  core.view.addEventListener('mousedown', focus);
  core.view.addEventListener('touchstart', focus);

  // Start game loop
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
  const visibleResume = function() {
    if (config.pauseOnHide) {core.resume('visibility');}
  };
  const visiblePause = function() {
    if (config.pauseOnHide) {core.pause('visibility');}
  };

  // Main visibility API function
  const vis = (function() {
    let stateKey, eventKey;
    const keys = {
      hidden: 'visibilitychange',
      mozHidden: 'mozvisibilitychange',
      webkitHidden: 'webkitvisibilitychange',
      msHidden: 'msvisibilitychange',
    };
    for (stateKey in keys) {
      if (stateKey in document) {
        eventKey = keys[stateKey];
        break;
      }
    }
    return function(c) {
      if (c) {document.addEventListener(eventKey, c, false);}
      return !document[stateKey];
    };
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
    window.attachEvent('focus', function() {
      setTimeout(visibleResume, 300);
    });
    window.attachEvent('blur', visiblePause);
  }

  // Create rotate prompt if required
  if (device.mobile && config.showRotatePrompt) {
    const div = document.createElement('div');
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
      const img = new Image();
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
    const isLandscape = (core.width / core.height >= 1);
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
/**
 * @param {Object|Number} res Resolution configs
 * @return {Number} Properly choosed resolution number
 * @private
 */
function chooseProperResolution(res) {
  // Default value
  if (!res) {
    return 1;
  }
  // Numerical value
  else if (Number.isFinite(res)) {
    return res;
  }
  // Calculate based on window size and device pixel ratio
  else {
    res.values.sort(function(a, b) { return a - b; });
    const gameRatio = core.width / core.height;
    const windowRatio = window.innerWidth / window.innerHeight;
    const scale = res.retina ? window.devicePixelRatio : 1;
    let result = res.values[0];
    for (let i = 0; i < res.values.length; i++) {
      result = res.values[i];

      if ((gameRatio >= windowRatio && window.innerWidth * scale <= core.width * result) ||
        (gameRatio < windowRatio && window.innerHeight * scale <= core.height * result)) {
        break;
      }
    }

    return result;
  }
}
/**
 * @private
 */
function resizeRotatePrompt() {
  core.rotatePromptElm.style.width = `${window.innerWidth}px`;
  core.rotatePromptElm.style.height = `${window.innerHeight}px`;
  _alignToWindowCenter(core.rotatePromptElm, window.innerWidth, window.innerHeight);

  const imgRatio = core.rotatePromptImg.width / core.rotatePromptImg.height;
  const windowRatio = window.innerWidth / window.innerHeight;
  let w, h;
  if (imgRatio < windowRatio) {
    w = Math.floor(window.innerHeight * 0.8);
    h = Math.floor(w / imgRatio);
  }
  else {
    h = Math.floor(window.innerWidth * 0.8);
    w = Math.floor(h * imgRatio);
  }
  core.rotatePromptImg.style.height = `${w}px`;
  core.rotatePromptImg.style.width = `${h}px`;
}

// Resize functions
let windowSize = { x: 1, y: 1 };
let scaledWidth, scaledHeight;
let result, container;
/**
 * @private
 */
function _letterBoxResize() {
  // Update sizes
  windowSize.x = window.innerWidth;
  windowSize.y = window.innerHeight;

  // Use inner box scaling function to calculate correct size
  result = resize.outerBoxResize(windowSize, core.viewSize);

  scaledWidth = Math.floor(core.viewSize.x * result.scale);
  scaledHeight = Math.floor(core.viewSize.y * result.scale);

  // Resize the view
  core.view.style.width = `${scaledWidth}px`;
  core.view.style.height = `${scaledHeight}px`;

  // Resize the container
  core.containerView.style.width = `${scaledWidth}px`;
  core.containerView.style.height = `${scaledHeight}px`;
  core.containerView.style.marginTop = `${Math.floor(result.top)}px`;
  core.containerView.style.marginLeft = `${Math.floor(result.left)}px`;

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);

  // Reset scroll for mobile devices
  if (device.mobile) {
    window.scrollTo(0, 1);
  }
}
/**
 * @private
 */
function _cropResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);
  core.view.style.width = core.containerView.style.width = `${window.innerWidth}px`;
  core.view.style.height = core.containerView.style.height = `${window.innerHeight}px`;

  // Broadcast resize events
  core.emit('resize', core.viewSize.x, core.viewSize.y);

  // Reset scroll for mobile devices
  if (device.mobile) {
    window.scrollTo(0, 1);
  }
}
/**
 * @private
 */
function _scaleInnerResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);
  core.view.style.width = core.containerView.style.width = `${window.innerWidth}px`;
  core.view.style.height = core.containerView.style.height = `${window.innerHeight}px`;

  // Resize container of current game
  if (core.game) {
    container = core.game.stage;
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
/**
 * @private
 */
function _scaleOuterResize() {
  // Update sizes
  core.viewSize.set(window.innerWidth, window.innerHeight);
  core.view.style.width = core.containerView.style.width = `${window.innerWidth}px`;
  core.view.style.height = core.containerView.style.height = `${window.innerHeight}px`;

  // Resize container of current game
  if (core.game) {
    container = core.game.stage;
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
/**
 * Alien an element to the center.
 * @param {HTMLElement} el  Element to align
 * @param {Number} w        Width of this element
 * @param {Number} h        Height of this element
 * @private
 */
function _alignToWindowCenter(el, w, h) {
  el.style.marginLeft = `${Math.floor((window.innerWidth - w) / 2)}px`;
  el.style.marginTop = `${Math.floor((window.innerHeight - h) / 2)}px`;
}
/**
 * Prevent mouse scroll
 * @private
 */
function _noPageScroll() {
  document.ontouchmove = function(event) {
    event.preventDefault();
  };
}

/**
 * Engine core that manages game loop and resize functionality.
 * @exports engine/core
 *
 * @requires module:engine/polyfill
 * @requires module:engine/EventEmitter
 * @requires module:engine/Vector
 * @requires module:engine/resize
 * @requires module:engine/device
 */
module.exports = core;
