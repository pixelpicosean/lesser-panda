// - parse any spritesheet data into multiple textures
// var bitmapFontParser = require('./loaders/bitmapFontParser');
// loader.use(bitmapFontParser());
// Resource.setExtensionXhrType('fnt', Resource.XHR_RESPONSE_TYPE.DOCUMENT);

// Export classes
// var core = require('./core');
// core.extras         = require('./extras');
// core.interaction    = require('./interaction');
// core.filters        = require('./filters');
// core.mesh           = require('./mesh');

// Register PIXI as the renderer of choice
// var Renderer = require('engine/renderer');
// var config = require('game/config').default;

// Renderer.init = function(width, height, settings) {
//   settings.view = document.getElementById(settings.canvasId);

//   if (settings.webGL) {
//     this.instance = core.autoDetectRenderer(width, height, settings);
//   }
//   else {
//     this.instance = new core.CanvasRenderer(width, height, settings);
//   }
// };
// Renderer.resize = function(w, h) {
//   this.instance.resize(w, h);
// };
// Renderer.render = function(scene) {
//   this.instance.render(scene.stage);
// };
// Renderer.createLayer = function(scene, name, parent) {
//   var parentKey = parent || 'stage';
//   scene[name] = new core.Container().addTo(scene[parentKey]);
// };

// Inject as sub-system of scene
// var Scene = require('engine/scene');

// Scene.registerSystem('Renderer', {
//   init: function init(scene) {
//     scene.stage = new core.Container();
//     scene.displayObjects = [];

//     activeScene = scene;
//   },
//   awake: function awake(scene) {
//     if (typeof scene._backgroundColor === 'undefined') {
//       scene._backgroundColor = 0x220033;
//     }
//     Renderer.instance.backgroundColor = scene._backgroundColor;

//     activeScene = scene;
//   },
//   update: function update(scene, _, dt) {
//     for (var i = 0; i < scene.displayObjects.length; i++) {
//       scene.displayObjects[i].update(dt);
//     }
//   },
// });

// Object.defineProperty(Scene.prototype, 'backgroundColor', {
//   get: function() {
//     return this._backgroundColor;
//   },
//   set: function(color) {
//     Renderer.instance.backgroundColor = this._backgroundColor = color;
//   },
// });


const core = require('engine/core');
const System = require('engine/system');
const WebGLRenderer = require('./core/renderers/webgl/WebGLRenderer');
const CanvasRenderer = require('./core/renderers/canvas/CanvasRenderer');
const utils = require('./core/utils');
const container = require('./container');
const config = require('game/config');

let sharedRenderer = null;

class SystemGfx extends System {
  constructor(settings) {
    super();

    /**
     * Name of this system.
     * @memberof SystemGfx#
     * @type {String}
     */
    this.name = 'sGfx';

    if (!sharedRenderer) {
      let options = {
        view: core.view,
        transparent: config.gfx.transparent,
        antialias: config.gfx.antialias,
        preserveDrawingBuffer: config.gfx.preserveDrawingBuffer,
        resolution: core.resolution,
      };

      if (config.gfx.webgl && utils.isWebGLSupported()) {
        sharedRenderer = new WebGLRenderer(config.width || 320, config.height || 200, options);
      }
      else {
        sharedRenderer = new CanvasRenderer(config.width || 320, config.height || 200, options);
      }
    }

    /**
     * Shared renderer instance.
     * @memberof SystemGfx#
     * @type {Renderer}
     */
    this.renderer = sharedRenderer;

    /**
     * Root drawing element
     * @memberof SystemGfx#
     * @type {Container}
     */
    this.root = container();
  }

  set backgroundColor(c) {
    this.renderer.backgroundColor = c;
  }
  get backgroundColor() {
    return this.renderer.backgroundColor;
  }

  awake() {}
  update() {
    this.renderer.render(this.root);
  }
  fixedUpdate() {}
  freeze() {}

  onEntitySpawn() {}
  onEntityRemove() {}

  onPause() {}
  onResume() {}
}

module.exports = SystemGfx;
