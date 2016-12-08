const TilingSprite = require('./core/sprites/TilingSprite');
const textureFromData = require('./utils').textureFromData;
const CONST = require('./const');

/**
 * Factory function for `TilingSprite`.
 *
 * @param {object} data   Data to create the instance from
 * @return {TilingSprite} TilingSprite instance
 */
module.exports = function(data) {
  const tex = textureFromData(data.texture);
  const inst = new TilingSprite(tex, data.width || tex.width, data.height || tex.height);

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

      // - TilingSprite
      case 'tilePosition':
      case 'tileScale':
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
