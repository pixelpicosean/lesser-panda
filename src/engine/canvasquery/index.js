import Renderer from 'engine/renderer';
import Scene from 'engine/scene';

import cq from './canvasquery';

Renderer.init = function init(width, height, settings) {
  let canvas = document.getElementById(settings.canvasId);
  canvas.width = width;
  canvas.height = height;

  this.layer = cq(canvas);
};

Object.assign(Scene.prototype, {
  draw: function draw() {},

  _initRenderer: function _initRenderer() {
    this.layer = Renderer.layer;
  },
  _updateRenderer: function _updateRenderer() {
    this.emit('draw');
    this.draw();
  },
});

if (Scene.systems.indexOf('Renderer') === -1) {
  Scene.systems.push('Renderer');
}
