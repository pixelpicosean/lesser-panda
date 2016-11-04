const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');
const BlurXFilter = require('../blur/BlurXFilter');
const BlurYFilter = require('../blur/BlurYFilter');
const CONST = require('../../const');

/**
 * The BloomFilter applies a Gaussian blur to an object.
 * The strength of the blur can be set for x- and y-axis separately.
 *
 * @class
 * @extends AbstractFilter
 */
function BloomFilter() {
  AbstractFilter.call(this);

  this.blurXFilter = new BlurXFilter();
  this.blurYFilter = new BlurYFilter();

  this.defaultFilter = new AbstractFilter();
}

BloomFilter.prototype = Object.create(AbstractFilter.prototype);
BloomFilter.prototype.constructor = BloomFilter;
module.exports = BloomFilter;

BloomFilter.prototype.applyFilter = function(renderer, input, output) {
  var renderTarget = renderer.filterManager.getRenderTarget(true);

    // TODO - copyTexSubImage2D could be used here?
  this.defaultFilter.applyFilter(renderer, input, output);

  this.blurXFilter.applyFilter(renderer, input, renderTarget);

  renderer.blendModeManager.setBlendMode(CONST.BLEND_MODES.SCREEN);

  this.blurYFilter.applyFilter(renderer, renderTarget, output);

  renderer.blendModeManager.setBlendMode(CONST.BLEND_MODES.NORMAL);

  renderer.filterManager.returnRenderTarget(renderTarget);
};

Object.defineProperties(BloomFilter.prototype, {
    /**
     * Sets the strength of both the blurX and blurY properties simultaneously
     *
     * @member {number}
     * @memberOf filters.BloomFilter#
     * @default 2
     */
  blur: {
    get: function() {
      return this.blurXFilter.blur;
    },
    set: function(value) {
      this.blurXFilter.blur = this.blurYFilter.blur = value;
    },
  },

    /**
     * Sets the strength of the blurX property
     *
     * @member {number}
     * @memberOf filters.BloomFilter#
     * @default 2
     */
  blurX: {
    get: function() {
      return this.blurXFilter.blur;
    },
    set: function(value) {
      this.blurXFilter.blur = value;
    },
  },

    /**
     * Sets the strength of the blurY property
     *
     * @member {number}
     * @memberOf filters.BloomFilter#
     * @default 2
     */
  blurY: {
    get: function() {
      return this.blurYFilter.blur;
    },
    set: function(value) {
      this.blurYFilter.blur = value;
    },
  },
});
