const AnimatedSprite = require('./core/sprites/AnimatedSprite');
const CONST = require('./const');
require('./core/sprites/webgl/SpriteRenderer');

/**
 * Factory function for `AnimatedSprite`.
 *
 * @param {object} data
 * @return {AnimatedSprite}
 */
module.exports = function(data) {
  const inst = new AnimatedSprite(data.textures);

  const anims = data.anims;
  if (Array.isArray(anims)) {
    for (let i = 0; i < anims.length; i++) {
      inst.addAnim(anims[i].name, anims[i].frames, anims[i].settings);
    }
  }

  for (let k in data) {
    switch (k) {
      // Directly set
      // - Container
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
      // - Container
      case 'pivot':
      case 'position':
      case 'skew':

      // - Sprite
      case 'anchor':
        inst[k].x = data[k].x || 0;
        inst[k].y = data[k].y || 0;
        break;

      // - Container
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
