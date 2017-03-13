import Sprite from './core/sprites/Sprite';
import { textureFromData } from './utils';
import { BLEND_MODES } from './const';
import './core/sprites/webgl/SpriteRenderer';

/**
 * Factory function for `Sprite`.
 *
 * @param {object} data   Data to create the instance from
 * @return {Sprite}       Sprite instance
 */
export default function(data) {
  const tex = textureFromData(data.texture);
  const inst = new Sprite(tex);

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
        inst.blendMode = BLEND_MODES[data[k]];
        break;
    }
  }

  return inst;
};
