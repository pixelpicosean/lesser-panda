import Node from './core/Node';
import { BLEND_MODES } from './const';

/**
 * Factory function for `Node`.
 *
 * @param {object} data   Data to create the instance from
 * @return {Node}         Node instance
 */
export default function(data) {
  const inst = new Node();

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
        inst[k] = data[k];
        break;

      // Set vector
      // - Node
      case 'pivot':
      case 'position':
      case 'skew':
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
