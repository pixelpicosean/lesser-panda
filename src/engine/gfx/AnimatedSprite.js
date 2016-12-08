const AnimatedSprite = require('./core/sprites/AnimatedSprite');
const CONST = require('./const');
require('./core/sprites/webgl/SpriteRenderer');

/**
 * Factory function for `AnimatedSprite`.
 *
 * @example
 * // Create an instance
 * let anim = AnimatedSprite({
 *   textures: [...],
 *   anims: [
 *     // Each animation as an array
 *     ['idle', [0,1], { loop: true, speed: 5 }],
 *     ['walk', [2,3,4,5], { loop: true, speed: 8 }],
 *     ['jump', [6,7], { loop: false, speed: 4 }],
 *
 *     // Or as a object with named settings
 *     { name: 'fall', frames: [8], settings: { loop: false, speed: 1 } },
 *   ],
 * })
 *
 * @example
 * // Play pre-defined animations, and switch to fall when it's finished
 * anim.play('jump').once('finish', () => {
 *   anim.play('fall');
 * });
 *
 * @param {object} data Data to create AnimatedSprite from
 * @return {AnimatedSprite} AnimatedSprite instance
 */
module.exports = function(data) {
  const inst = new AnimatedSprite(data.textures);
  const anims = data.anims;

  let def, i;
  if (Array.isArray(anims)) {
    for (i = 0; i < anims.length; i++) {
      def = anims[i];
      if (Array.isArray(def)) {
        inst.addAnim(def[0], def[1], def[2]);
      }
      else {
        inst.addAnim(def.name, def.frames, def.settings);
      }
    }
  }

  for (let k in data) {
    switch (k) {
      // Directly set
      // - Node
      case 'alpha':
      case 'width':
      case 'height':
      case 'rotation':
      case 'visible':
      case 'x':
      case 'y':
      case 'interactive':
      // - Sprite
      case 'tint':
        inst[k] = data[k];
        break;

      // Set vector
      // - Node
      case 'pivot':
      case 'position':
      case 'skew':

      // - Sprite
      case 'anchor':
        inst[k].x = data[k].x || 0;
        inst[k].y = data[k].y || 0;
        break;

      // - Node
      case 'scale':
        inst[k].x = data[k].x || 1;
        inst[k].y = data[k].y || 1;
        break;

      // Set blend mode
      case 'blendMode':
        inst.blendMode = CONST.BLEND_MODES[data[k]];
        break;
    }
  }

  return inst;
};
