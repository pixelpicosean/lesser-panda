const Text = require('./core/text/Text');
const CONST = require('./const');
require('./core/sprites/webgl/SpriteRenderer');

/**
 * Factory function for `Text`.
 *
 * @param {object} data   Data to create the instance from
 * @return {Text}         Text instance
 */
module.exports = function(data) {
  const inst = new Text(data.text, data, data.resolution || 1);

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
