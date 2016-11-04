const AbstractFilter = require('../../core/renderers/webgl/filters/AbstractFilter');

/**
 * A Cross Hatch effect filter.
 *
 * @class
 * @extends AbstractFilter
 */
function CrossHatchFilter() {
  AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./crosshatch.frag')
    );
}

CrossHatchFilter.prototype = Object.create(AbstractFilter.prototype);
CrossHatchFilter.prototype.constructor = CrossHatchFilter;
module.exports = CrossHatchFilter;
