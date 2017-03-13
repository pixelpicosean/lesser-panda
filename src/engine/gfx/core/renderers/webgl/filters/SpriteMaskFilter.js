import AbstractFilter from './AbstractFilter';
import math from '../../../math';

/**
 * The SpriteMaskFilter class
 *
 * @class
 * @extends AbstractFilter
 * @param sprite {Sprite} the target sprite
 */
export default function SpriteMaskFilter(sprite) {
  var maskMatrix = new math.Matrix();

  AbstractFilter.call(this,
        require('./spriteMaskFilter.vert'),
        require('./spriteMaskFilter.frag'),
    {
      mask: { type: 'sampler2D', value: sprite._texture },
      alpha: { type: 'f', value: 1 },
      otherMatrix: { type: 'mat3', value: maskMatrix.toArray(true) },
    }
    );

  this.maskSprite = sprite;
  this.maskMatrix = maskMatrix;
}

SpriteMaskFilter.prototype = Object.create(AbstractFilter.prototype);
SpriteMaskFilter.prototype.constructor = SpriteMaskFilter;

/**
 * Applies the filter
 *
 * @param renderer {WebGLRenderer} The renderer to retrieve the filter from
 * @param input {RenderTarget}
 * @param output {RenderTarget}
 */
SpriteMaskFilter.prototype.applyFilter = function(renderer, input, output) {
  var filterManager = renderer.filterManager;

  this.uniforms.mask.value = this.maskSprite._texture;

  filterManager.calculateMappedMatrix(input.frame, this.maskSprite, this.maskMatrix);

  this.uniforms.otherMatrix.value = this.maskMatrix.toArray(true);
  this.uniforms.alpha.value = this.maskSprite.worldAlpha;

  var shader = this.getShader(renderer);
   // draw the filter...
  filterManager.applyFilter(shader, input, output);
};


Object.defineProperties(SpriteMaskFilter.prototype, {
    /**
     * The texture used for the displacement map. Must be power of 2 sized texture.
     *
     * @member {Texture}
     * @memberof SpriteMaskFilter#
     */
  map: {
    get: function() {
      return this.uniforms.mask.value;
    },
    set: function(value) {
      this.uniforms.mask.value = value;
    },
  },

    /**
     * The offset used to move the displacement map.
     *
     * @member {Point}
     * @memberof SpriteMaskFilter#
     */
  offset: {
    get: function() {
      return this.uniforms.offset.value;
    },
    set: function(value) {
      this.uniforms.offset.value = value;
    },
  },
});
