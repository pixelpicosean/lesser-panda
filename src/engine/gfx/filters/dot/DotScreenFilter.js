const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 * original filter: https://github.com/evanw/glfx.js/blob/master/src/filters/fun/dotscreen.js
 */

/**
 * This filter applies a dotscreen effect making display objects appear to be made out of
 * black and white halftone dots like an old printer.
 *
 * @class
 * @extends AbstractFilter
 */
function DotScreenFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./dotScreen.frag'),
        // custom uniforms
    {
      scale: { type: '1f', value: 1 },
      angle: { type: '1f', value: 5 },
      dimensions: { type: '4fv', value: [0, 0, 0, 0] },
    }
    );
}

DotScreenFilter.prototype = Object.create(AbstractFilter.prototype);
DotScreenFilter.prototype.constructor = DotScreenFilter;
module.exports = DotScreenFilter;

Object.defineProperties(DotScreenFilter.prototype, {
    /**
     * The scale of the effect.
     * @member {number}
     * @memberof filters.DotScreenFilter#
     */
  scale: {
    get: function() {
      return this.uniforms.scale.value;
    },
    set: function(value) {
      this.uniforms.scale.value = value;
    },
  },

    /**
     * The radius of the effect.
     * @member {number}
     * @memberof filters.DotScreenFilter#
     */
  angle: {
    get: function() {
      return this.uniforms.angle.value;
    },
    set: function(value) {
      this.uniforms.angle.value = value;
    },
  },
});
