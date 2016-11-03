const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * This filter applies a pixelate effect making display objects appear 'blocky'.
 *
 * @class
 * @extends AbstractFilter
 * @memberof filters
 */
function PixelateFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./pixelate.frag'),
        // custom uniforms
    {
      dimensions: { type: '4fv', value: new Float32Array([0, 0, 0, 0]) },
      pixelSize: { type: 'v2', value: { x: 10, y: 10 } },
    }
    );
}

PixelateFilter.prototype = Object.create(AbstractFilter.prototype);
PixelateFilter.prototype.constructor = PixelateFilter;
module.exports = PixelateFilter;

Object.defineProperties(PixelateFilter.prototype, {
    /**
     * This a point that describes the size of the blocks.
     * x is the width of the block and y is the height.
     *
     * @member {Vector}
     * @memberof filters.PixelateFilter#
     */
  size: {
    get: function() {
      return this.uniforms.pixelSize.value;
    },
    set: function(value) {
      this.uniforms.pixelSize.value = value;
    },
  },
});
