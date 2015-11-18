var core = require('../../core');


// TODO (cengler) - The Y is flipped in this shader for some reason.

/**
 * @author Vico @vicocotea
 * original shader : https://www.shadertoy.com/view/lssGDj by @movAX13h
 */

/**
 * An ASCII filter.
 *
 * @class
 * @extends PIXI.AbstractFilter
 * @memberof PIXI.filters
 */
function AsciiFilter()
{
    core.AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./ascii.frag'),
        // custom uniforms
        {
            dimensions: { type: '4fv', value: new Float32Array([0, 0, 0, 0]) },
            pixelSize:  { type: '1f', value: 8 }
        }
    );
}

AsciiFilter.prototype = Object.create(core.AbstractFilter.prototype);
AsciiFilter.prototype.constructor = AsciiFilter;
module.exports = AsciiFilter;

Object.defineProperties(AsciiFilter.prototype, {
    /**
     * The pixel size used by the filter.
     *
     * @member {number}
     * @memberof PIXI.filters.AsciiFilter#
     */
    size: {
        get: function ()
        {
            return this.uniforms.pixelSize.value;
        },
        set: function (value)
        {
            this.uniforms.pixelSize.value = value;
        }
    }
});
