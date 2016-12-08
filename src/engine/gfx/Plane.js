const Mesh = require('./mesh/Mesh');
const Plane = require('./mesh/Plane');
const CONST = require('./const');
const textureFromData = require('./utils').textureFromData;
require('./mesh/webgl/MeshRenderer');
require('./mesh/webgl/MeshShader');

/**
 * Factory function for `Plane`.
 *
 * @param {object} data   Data to create the instance from
 * @return {Plane}        Plane instance
 */
module.exports = function(data) {
  const tex = textureFromData(data.texture);
  const inst = new Plane(tex, data.segmentsX, data.segmentsY);

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
    // - Mesh
      case 'canvasPadding':
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
        inst.blendMode = CONST.BLEND_MODES[data[k]];
        break;

    // Set draw mode
      case 'drawMode':
        inst.drawMode = Mesh.DRAW_MODES[data[k]];
        break;
    }
  }

  return inst;
};
