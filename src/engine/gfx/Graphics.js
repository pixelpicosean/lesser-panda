var Graphics = require('./core/graphics/Graphics');
var Vector = require('engine/vector');
var CONST = require('./core/const');
require('./core/graphics/webgl/GraphicsRenderer');

var DEFAULT_POLYGON_VERTICES = [
  Vector.create(-4, -4),
  Vector.create(+4, -4),
  Vector.create(+4, +4),
  Vector.create(-4, +4),
];

// TODO: add fill/stroke support
module.exports = function(data) {
  var inst = new Graphics();

  inst.beginFill(data.color || 0x000000);
  var shape = data.shape || 'Box';
  if (shape === 'Circle') {
    inst.drawCircle(0, 0, data.radius || 8);
  }
  else if (shape === 'Box') {
    var w = data.width || 8;
    var h = data.height || 8;
    inst.drawRect(-w / 2, -h / 2, w, h);
  }
  else if (shape === 'Polygon') {
    var points = data.points || DEFAULT_POLYGON_VERTICES;
    inst.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      inst.lineTo(points[i].x, points[i].y);
    }
  }
  inst.endFill();

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
      // - Graphics
    case 'boundsPadding':
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
    }
  }

  return inst;
};
