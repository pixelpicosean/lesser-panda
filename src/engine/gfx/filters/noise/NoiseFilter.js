const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * @author Vico @vicocotea
 * original filter: https://github.com/evanw/glfx.js/blob/master/src/filters/adjust/noise.js
 */

/**
 * A Noise effect filter.
 *
 * @class
 * @extends AbstractFilter
 */
function NoiseFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./noise.frag'),
        // custom uniforms
    {
      noise: { type: '1f', value: 0.5 },
    }
    );
}

NoiseFilter.prototype = Object.create(AbstractFilter.prototype);
NoiseFilter.prototype.constructor = NoiseFilter;
module.exports = NoiseFilter;

Object.defineProperties(NoiseFilter.prototype, {
    /**
     * The amount of noise to apply.
     *
     * @member {number}
     * @memberof filters.NoiseFilter#
     * @default 0.5
     */
  noise: {
    get: function() {
      return this.uniforms.noise.value;
    },
    set: function(value) {
      this.uniforms.noise.value = value;
    },
  },
});
