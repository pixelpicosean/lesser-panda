var Graphics = require('./core/graphics/Graphics');
var Vector = require('engine/Vector');
var CONST = require('./const');
require('./core/graphics/webgl/GraphicsRenderer');

const DEFAULT_POLYGON_VERTICES = [
  Vector.create(-4, -4),
  Vector.create(+4, -4),
  Vector.create(+4, +4),
  Vector.create(-4, +4),
];

/**
 * Factory function for `Graphics`.
 *
 * @param {object} data   Data to create the instance from
 * @return {Graphics}     Graphics instance
 */
module.exports = function(data) {
  let inst = new Graphics();

  // TODO: add fill/stroke support
  inst.beginFill(data.color || 0x000000);
  let shape = data.shape || 'Box';
  if (shape.toLowerCase() === 'circle') {
    inst.drawCircle(0, 0, data.radius || 8);
  }
  else if (shape.toLowerCase() === 'box') {
    let w = data.width || 8;
    let h = data.height || 8;

    let anchor = 'center';
    if (typeof(data.anchor) === 'string') {
      anchor = data.anchor.toLowerCase();
    }

    switch (anchor.toLowerCase()) {
      case 'center':
        inst.drawRect(-w / 2, -h / 2, w, h);
        break;

      case 'left':
        inst.drawRect(0, -h / 2, w, h);
        break;
      case 'right':
        inst.drawRect(-w, -h / 2, w, h);
        break;
      case 'top':
        inst.drawRect(-w / 2, 0, w, h);
        break;
      case 'bottom':
        inst.drawRect(-w / 2, -h, w, h);
        break;

      case 'topleft':
        inst.drawRect(0, 0, w, h);
        break;
      case 'topright':
        inst.drawRect(-w, 0, w, h);
        break;
      case 'bottomleft':
        inst.drawRect(0, -h, w, h);
        break;
      case 'bottomright':
        inst.drawRect(-w, -h, w, h);
        break;
    }
  }
  else if (shape.toLowerCase() === 'polygon') {
    let points = data.points || DEFAULT_POLYGON_VERTICES;
    inst.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      inst.lineTo(points[i].x, points[i].y);
    }
  }
  inst.endFill();

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
      // - Graphics
      case 'boundsPadding':
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
    }
  }

  return inst;
};
