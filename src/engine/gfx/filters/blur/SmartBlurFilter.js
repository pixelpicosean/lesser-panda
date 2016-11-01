var core = require('../../core');


/**
 * A Smart Blur Filter.
 *
 * @class
 * @extends PIXI.AbstractFilter
 * @memberof PIXI.filters
 */
function SmartBlurFilter()
{
    core.AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./smartBlur.frag'),
        // uniforms
        {
          delta: { type: 'v2', value: { x: 0.1, y: 0.0 } }
        }
    );
}

SmartBlurFilter.prototype = Object.create(core.AbstractFilter.prototype);
SmartBlurFilter.prototype.constructor = SmartBlurFilter;
module.exports = SmartBlurFilter;
