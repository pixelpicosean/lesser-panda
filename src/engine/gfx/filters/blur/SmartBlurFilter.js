const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * A Smart Blur Filter.
 *
 * @class
 * @extends AbstractFilter
 */
function SmartBlurFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./smartBlur.frag'),
        // uniforms
    {
      delta: { type: 'v2', value: { x: 0.1, y: 0.0 } },
    }
    );
}

SmartBlurFilter.prototype = Object.create(AbstractFilter.prototype);
SmartBlurFilter.prototype.constructor = SmartBlurFilter;
module.exports = SmartBlurFilter;
