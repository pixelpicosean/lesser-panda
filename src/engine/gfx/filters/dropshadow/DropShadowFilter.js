const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');
const BlurXFilter = require('../blur/BlurXFilter');
const BlurYTintFilter = require('./BlurYTintFilter');
const CONST = require('../../const');
const { rgb2hex, hex2rgb } = require('engine/utils/color');

/**
 * The DropShadowFilter applies a Gaussian blur to an object.
 * The strength of the blur can be set for x- and y-axis separately.
 *
 * @class
 * @extends AbstractFilter
 */
function DropShadowFilter() {
  AbstractFilter.call(this);

  this.blurXFilter = new BlurXFilter();
  this.blurYTintFilter = new BlurYTintFilter();

  this.defaultFilter = new AbstractFilter();

  this.padding = 30;

  this._dirtyPosition = true;
  this._angle = 45 * Math.PI / 180;
  this._distance = 10;
  this.alpha = 0.75;
  this.hideObject = false;
  this.blendMode = CONST.BLEND_MODES.MULTIPLY;
}

DropShadowFilter.prototype = Object.create(AbstractFilter.prototype);
DropShadowFilter.prototype.constructor = DropShadowFilter;
module.exports = DropShadowFilter;

DropShadowFilter.prototype.applyFilter = function(renderer, input, output) {
  var renderTarget = renderer.filterManager.getRenderTarget(true);

    // TODO - copyTexSubImage2D could be used here?
  if (this._dirtyPosition) {
    this._dirtyPosition = false;

    this.blurYTintFilter.uniforms.offset.value[0] = Math.sin(this._angle) * this._distance;
    this.blurYTintFilter.uniforms.offset.value[1] = Math.cos(this._angle) * this._distance;
  }

  this.blurXFilter.applyFilter(renderer, input, renderTarget);

  renderer.blendModeManager.setBlendMode(this.blendMode);

  this.blurYTintFilter.applyFilter(renderer, renderTarget, output);

  renderer.blendModeManager.setBlendMode(CONST.BLEND_MODES.NORMAL);

  if (!this.hideObject) {

    this.defaultFilter.applyFilter(renderer, input, output);
  }


  renderer.filterManager.returnRenderTarget(renderTarget);
};

Object.defineProperties(DropShadowFilter.prototype, {
    /**
     * Sets the strength of both the blurX and blurY properties simultaneously
     *
     * @member {number}
     * @memberOf filters.DropShadowFilter#
     * @default 2
     */
  blur: {
    get: function() {
      return this.blurXFilter.blur;
    },
    set: function(value) {
      this.blurXFilter.blur = this.blurYTintFilter.blur = value;
    },
  },

    /**
     * Sets the strength of the blurX property
     *
     * @member {number}
     * @memberOf filters.DropShadowFilter#
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
     * @memberOf filters.DropShadowFilter#
     * @default 2
     */
  blurY: {
    get: function() {
      return this.blurYTintFilter.blur;
    },
    set: function(value) {
      this.blurYTintFilter.blur = value;
    },
  },

    /**
     * Sets the color of the shadow
     *
     * @member {number}
     * @memberOf filters.DropShadowFilter#
     */
  color: {
    get: function() {
      return rgb2hex(this.blurYTintFilter.uniforms.color.value);
    },
    set: function(value) {
      this.blurYTintFilter.uniforms.color.value = hex2rgb(value);
    },
  },

    /**
     * Sets the alpha of the shadow
     *
     * @member {number}
     * @memberOf filters.DropShadowFilter#
     */
  alpha: {
    get: function() {
      return this.blurYTintFilter.uniforms.alpha.value;
    },
    set: function(value) {
      this.blurYTintFilter.uniforms.alpha.value = value;
    },
  },

    /**
     * Sets the distance of the shadow
     *
     * @member {number}
     * @memberOf filters.DropShadowFilter#
     */
  distance: {
    get: function() {
      return this._distance;
    },
    set: function(value) {
      this._dirtyPosition = true;
      this._distance = value;
    },
  },

    /**
     * Sets the angle of the shadow
     *
     * @member {number}
     * @memberOf filters.DropShadowFilter#
     */
  angle: {
    get: function() {
      return this._angle;
    },
    set: function(value) {
      this._dirtyPosition = true;
      this._angle = value;
    },
  },
});
