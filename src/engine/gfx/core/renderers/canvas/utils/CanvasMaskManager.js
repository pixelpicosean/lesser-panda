const CanvasGraphics = require('./CanvasGraphics');

/**
 * A set of functions used to handle masking.
 *
 * @class
 */
class CanvasMaskManager {
  constructor() {}

  /**
   * This method adds it to the current stack of masks.
   *
   * @param maskData {object} the maskData that will be pushed
   * @param renderer {PIXI.WebGLRenderer|PIXI.CanvasRenderer} The renderer context to use.
   */
  pushMask(maskData, renderer) {

    renderer.context.save();

    let cacheAlpha = maskData.alpha;
    let transform = maskData.worldTransform;
    let resolution = renderer.resolution;

    renderer.context.setTransform(
          transform.a * resolution,
          transform.b * resolution,
          transform.c * resolution,
          transform.d * resolution,
          transform.tx * resolution,
          transform.ty * resolution
      );

      // TODO suport sprite alpha masks??
      // lots of effort required. If demand is great enough..
    if (!maskData.texture) {
      CanvasGraphics.renderGraphicsMask(maskData, renderer.context);
      renderer.context.clip();
    }

    maskData.worldAlpha = cacheAlpha;
  }

  /**
   * Restores the current drawing context to the state it was before the mask was applied.
   *
   * @param renderer {PIXI.WebGLRenderer|PIXI.CanvasRenderer} The renderer context to use.
   */
  popMask(renderer) {
    renderer.context.restore();
  }

  destroy() {}
}

module.exports = CanvasMaskManager;
