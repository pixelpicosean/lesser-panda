const TilingSprite = require('./core/sprites/TilingSprite');
const textureFromData = require('./utils').textureFromData;
const CONST = require('./const');

module.exports = function(data) {
  const tex = textureFromData(data.texture);
  const inst = new TilingSprite(tex, data.width || tex.width, data.height || tex.height);

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

      // - TilingSprite
      case 'tilePosition':
      case 'tileScale':
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
