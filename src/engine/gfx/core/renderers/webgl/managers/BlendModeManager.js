import WebGLManager from './WebGLManager';

/**
 * @class
 * @extends WebGlManager
 * @param renderer {WebGLRenderer} The renderer this manager works for.
 */
export default function BlendModeManager(renderer) {
  WebGLManager.call(this, renderer);

  /**
   * @member {number}
   */
  this.currentBlendMode = 99999;
}

BlendModeManager.prototype = Object.create(WebGLManager.prototype);
BlendModeManager.prototype.constructor = BlendModeManager;

/**
 * Sets-up the given blendMode from WebGL's point of view.
 *
 * @param blendMode {number} the blendMode, should be a Pixi const, such as `PIXI.BLEND_MODES.ADD`. See
 *  {@link BLEND_MODES} for possible values.
 */
BlendModeManager.prototype.setBlendMode = function(blendMode) {
  if (this.currentBlendMode === blendMode) {
    return false;
  }

  this.currentBlendMode = blendMode;

  var mode = this.renderer.blendModes[this.currentBlendMode];
  this.renderer.gl.blendFunc(mode[0], mode[1]);

  return true;
};
