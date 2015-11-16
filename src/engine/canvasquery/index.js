var Renderer = require('engine/renderer');
var Scene = require('engine/scene');

var cq = require('./canvasquery');

Renderer.init = function init(width, height, settings) {
  var canvas = document.getElementById(settings.canvasId);
  canvas.width = width;
  canvas.height = height;

  this.layer = cq(canvas);
};

// TODO: override resize method

Object.assign(Scene.prototype, {
  draw: function draw() {},

  _initRenderer: function _initRenderer() {
    this.layer = Renderer.layer;
  },
  _updateRenderer: function _updateRenderer() {
    this.emit('draw');
    this.draw(this.layer);
  },
});

if (Scene.systems.indexOf('Renderer') === -1) {
  Scene.systems.push('Renderer');
}

module.exports = cq;
