const Mesh = require('./mesh/Mesh');
const Rope = require('./mesh/Rope');
const CONST = require('./const');
const textureFromData = require('./utils').textureFromData;
require('./mesh/webgl/MeshRenderer');
require('./mesh/webgl/MeshShader');

module.exports = function(data) {
  var tex = textureFromData(data.texture);
  var inst = new Rope(tex, data.points);

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
    // - Mesh
    case 'canvasPadding':
      inst[k] = data[k];
      break;

    // Set vector
    // - Container
    case 'pivot':
    case 'position':
    case 'skew':
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

    // Set draw mode
    case 'drawMode':
      inst.drawMode = Mesh.DRAW_MODES[data[k]];
      break;
    }
  }

  return inst;
};
