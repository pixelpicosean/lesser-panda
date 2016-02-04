require('engine/polyfill');
var utils = require('engine/utils');

var core = module.exports = require('./core');

// Uncomment to import any plugins you want to use
core.extras         = require('./extras');
core.interaction    = require('./interaction');
// core.filters        = require('./filters');
// core.mesh           = require('./mesh');

// Add some helpers
var activeScene = null;
core.addObject = function addObject(obj) {
  if (activeScene && activeScene.displayObjects.indexOf(obj) < 0) {
    activeScene.displayObjects.push(obj);
  }
};
core.removeObject = function removeObject(obj) {
  if (activeScene) {
    utils.removeItems(activeScene.displayObjects, activeScene.displayObjects.indexOf(obj), 1)
  }
};

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
var config = require('game/config');

Renderer.init = function(width, height, settings) {
  settings.view = document.getElementById(settings.canvasId);
  settings.autoResize = (config.resizeMode === 'never' || config.resizeMode === 'dom') ? false : true;
  settings.resolution = window.devicePixelRatio;

  if (settings.webGL) {
    this.instance = core.autoDetectRenderer(width, height, settings);
  }
  else {
    this.instance = new core.CanvasRenderer(width, height, settings);
  }
};
Renderer.resize = function(w, h) {
  this.instance.resize(w, h);
};
Renderer.render = function(scene) {
  this.instance.render(scene.stage);
};

// Inject as sub-system of scene
var Scene = require('engine/scene');

Scene.registerSystem('Renderer', {
  init: function init(scene) {
    scene.stage = new core.Container();
    scene.displayObjects = [];

    activeScene = scene;
  },
  awake: function awake(scene) {
    if (typeof scene._backgroundColor === 'undefined') {
      scene._backgroundColor = 0x220033;
    }
    Renderer.instance.backgroundColor = scene._backgroundColor;

    activeScene = scene;
  },
  update: function update(scene, dt) {
    for (var i = 0; i < scene.displayObjects.length; i++) {
      scene.displayObjects[i].update(dt);
    }
  },
});

Object.defineProperty(Scene.prototype, 'backgroundColor', {
  get: function() {
    return this._backgroundColor;
  },
  set: function(color) {
    Renderer.instance.backgroundColor = this._backgroundColor = color;
  },
});
