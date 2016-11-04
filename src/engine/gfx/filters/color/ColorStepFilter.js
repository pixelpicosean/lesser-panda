const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * This lowers the color depth of your image by the given amount, producing an image with a smaller palette.
 *
 * @class
 * @extends AbstractFilter
 */
function ColorStepFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./colorStep.frag'),
        // custom uniforms
    {
      step: { type: '1f', value: 5 },
    }
    );
}

ColorStepFilter.prototype = Object.create(AbstractFilter.prototype);
ColorStepFilter.prototype.constructor = ColorStepFilter;
module.exports = ColorStepFilter;

Object.defineProperties(ColorStepFilter.prototype, {
    /**
     * The number of steps to reduce the palette by.
     *
     * @member {number}
     * @memberof filters.ColorStepFilter#
     */
  step: {
    get: function() {
      return this.uniforms.step.value;
    },
    set: function(value) {
      this.uniforms.step.value = value;
    },
  },
});
