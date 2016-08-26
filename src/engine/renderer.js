'use strict';

/**
 * Renderer interface.
 *
 * Config:
 * - webGL: use WebGL or not
 * - resolution: see `game/config` for more details.
 *
 * @interface
 * @exports engine/renderer
 */
var Renderer = {
  /**
   * Real renderer instance.
   * @type {*}
   */
  instance: undefined,
  /**
   * Resolution of the renderer.
   * @type {number}
   * @default 1
   */
  resolution: 1,
  /**
   * Init function should create a renderer instance with settings.
   * @abstract
   * @param  {number} width    Width of the game view
   * @param  {number} height   Height of the game view
   * @param  {object} settings Renderer config from `game/config`.
   */
  init: function init(width, height, settings) {
    console.log('[Warning]: No working renderer!');
  },
  /**
   * Resize the renderer.
   * @abstract
   * @param  {number} w New width
   * @param  {number} h New height
   */
  resize: function resize(w, h) {
    console.log('[Warning]: Renderer can not be resized!');
  },
  /**
   * Render a scene instance.
   * @abstract
   * @param  {Scene} scene Scene to render.
   */
  render: function render(scene) {
    console.log('[Warning]: Renderer does not render!');
  },
  /**
   * Add a layer to a scene
   * @abstract
   * @param  {Scene} scene      Target scene to add layer to.
   * @param  {string} name      Name of this layer
   * @param  {string} [parent]  Key of parent layer, default is `stage`.
   */
  createLayer: function createLayer(scene, name, parent) {
    console.log('[Warning]: Renderer cannot create layer!');
  },
};

module.exports = Renderer;
