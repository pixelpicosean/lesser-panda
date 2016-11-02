var Sprite = require('./core/sprites/Sprite');
var textureFromData = require('./utils').textureFromData;
var CONST = require('./const');
require('./core/sprites/webgl/SpriteRenderer');

module.exports = function(data) {
  var tex = textureFromData(data.texture);
  var inst = new Sprite(tex);

  var k;
  for (k in data) {
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
