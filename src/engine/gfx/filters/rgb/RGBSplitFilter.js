const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * An RGB Split Filter.
 *
 * @class
 * @extends AbstractFilter
 */
function RGBSplitFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./rgbSplit.frag'),
        // custom uniforms
    {
      red: { type: 'v2', value: { x: 20, y: 20 } },
      green: { type: 'v2', value: { x: -20, y: 20 } },
      blue: { type: 'v2', value: { x: 20, y: -20 } },
      dimensions: { type: '4fv', value: [0, 0, 0, 0] },
    }
    );
}

RGBSplitFilter.prototype = Object.create(AbstractFilter.prototype);
RGBSplitFilter.prototype.constructor = RGBSplitFilter;
module.exports = RGBSplitFilter;

Object.defineProperties(RGBSplitFilter.prototype, {
    /**
     * Red channel offset.
     *
     * @member {Vector}
     * @memberof filters.RGBSplitFilter#
     */
  red: {
    get: function() {
      return this.uniforms.red.value;
    },
    set: function(value) {
      this.uniforms.red.value = value;
    },
  },

    /**
     * Green channel offset.
     *
     * @member {Vector}
     * @memberof filters.RGBSplitFilter#
     */
  green: {
    get: function() {
      return this.uniforms.green.value;
    },
    set: function(value) {
      this.uniforms.green.value = value;
    },
  },

    /**
     * Blue offset.
     *
     * @member {Vector}
     * @memberof filters.RGBSplitFilter#
     */
  blue: {
    get: function() {
      return this.uniforms.blue.value;
    },
    set: function(value) {
      this.uniforms.blue.value = value;
    },
  },
});
