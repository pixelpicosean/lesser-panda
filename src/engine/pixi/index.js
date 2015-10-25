require('engine/polyfill');

var core = module.exports = require('./core');

// Uncomment to import any plugins you want to use
core.extras         = require('./extras');
core.interaction    = require('./interaction');
// core.filters        = require('./filters');
// core.mesh           = require('./mesh');

// Extend loader
var loader = require('engine/loader');

var pixiMiddlewares = require('./loaders');
loader.addMiddleware(pixiMiddlewares.textureParser);
loader.addMiddleware(pixiMiddlewares.spritesheetParser);
loader.addMiddleware(pixiMiddlewares.bitmapFontParser);

var Resource = loader.ResourceLoader.Resource;
Resource.setExtensionXhrType('fnt', Resource.XHR_RESPONSE_TYPE.DOCUMENT);

// Register PIXI as the renderer of choice
var Renderer = require('engine/renderer');

Renderer.init = function init(width, height, settings) {
  var canvas = document.getElementById(settings.canvasId);
  settings.view = canvas;

  if (settings.webGL) {
    this.core = core.autoDetectRenderer(width, height, settings);
  }
  else {
    this.core = new core.CanvasRenderer(width, height, settings);
  }
};

// Inject as sub-system of scene
var Scene = require('engine/scene');

Object.assign(Scene.prototype, {
  _initRenderer: function _initRenderer() {
    this.container = new core.Container();
  },
  _updateRenderer: function _updateRenderer() {
    Renderer.core.render(this.container);
  }
});

if (Scene.systems.indexOf('Renderer') === -1) {
  Scene.systems.push('Renderer');
}
