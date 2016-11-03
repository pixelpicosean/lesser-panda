const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * This greyscales the palette of your Display Objects.
 *
 * @class
 * @extends AbstractFilter
 */
function GrayFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./gray.frag'),
        // set the uniforms
    {
      gray: { type: '1f', value: 1 },
    }
    );
}

GrayFilter.prototype = Object.create(AbstractFilter.prototype);
GrayFilter.prototype.constructor = GrayFilter;
module.exports = GrayFilter;

Object.defineProperties(GrayFilter.prototype, {
    /**
     * The strength of the gray. 1 will make the object black and white, 0 will make the object its normal color.
     *
     * @member {number}
     * @memberof filters.GrayFilter#
     */
  gray: {
    get: function() {
      return this.uniforms.gray.value;
    },
    set: function(value) {
      this.uniforms.gray.value = value;
    },
  },
});
