require('engine/polyfill');

var core = module.exports = require('./core');

// Uncomment to import any plugins you want to use
core.extras         = require('./extras');
core.interaction    = require('./interaction');
// core.filters        = require('./filters');
// core.mesh           = require('./mesh');

// Extend core objects
Object.assign(core.DisplayObject.prototype, {
  remove: function remove() {
    if (this.parent) this.parent.removeChild(this);
  },
  addTo: function addTo(container) {
    container.addChild(this);
    return this;
  },
});

// Extend loader
var loader = require('engine/loader');

var pixiMiddlewares = require('./loaders');
// - parse any blob into more usable objects (e.g. Image)
loader.addMiddleware(loader.ResourceLoader.middleware.parsing.blob);
// - parse any Image objects into textures
loader.addMiddleware(pixiMiddlewares.textureParser);
// - parse any spritesheet data into multiple textures
loader.addMiddleware(pixiMiddlewares.spritesheetParser);
// - parse any spritesheet data into multiple textures
loader.addMiddleware(pixiMiddlewares.bitmapFontParser);

var Resource = loader.ResourceLoader.Resource;
Resource.setExtensionXhrType('fnt', Resource.XHR_RESPONSE_TYPE.DOCUMENT);

Object.assign(core.Texture, {
  fromAsset: function fromAsset(key) {
    var t = loader.resources[key];
    t = (t ? t.texture : null);
    t = (t ? t : core.Texture.fromFrame(key));
    if (!t) {
      throw 'Texture with key [' + key + '] is not found!';
    }
    return t;
  },
});

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
  _backgroundColor: 0x220033,
  _initRenderer: function _initRenderer() {
    this.container = new core.Container();
  },
  _awakeRenderer: function _awakeRenderer() {
    Renderer.core.backgroundColor = this._backgroundColor;
  },
  _updateRenderer: function _updateRenderer() {
    Renderer.core.render(this.container);
  }
});

Object.defineProperty(Scene.prototype, 'backgroundColor', {
  get: function() {
    return this._backgroundColor;
  },
  set: function(color) {
    Renderer.core.backgroundColor = this._backgroundColor = color;
  },
});

if (Scene.systems.indexOf('Renderer') === -1) {
  Scene.systems.push('Renderer');
}
