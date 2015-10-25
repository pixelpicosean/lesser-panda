// run the polyfills
require('engine/polyfill');

var core = module.exports = require('./core');

// add core plugins.
core.extras         = require('./extras');
// core.filters        = require('./filters');
core.interaction    = require('./interaction');
core.loaders        = require('./loaders');
// core.mesh           = require('./mesh');

// export a premade loader instance
/**
 * A premade instance of the loader that can be used to loader resources.
 *
 * @name loader
 * @memberof PIXI
 * @property {PIXI.loaders.Loader}
 */
core.loader = require('engine/loader').resourceLoader;

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
    Renderer.core.render(scene.container);
  }
});

if (Scene.systems.indexOf('Renderer') === -1) {
  Scene.systems.push('Renderer');
}
