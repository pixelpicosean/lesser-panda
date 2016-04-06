var PIXI = require('engine/pixi');
var physics = require('engine/physics');

var Actor = require('./actor');

function validation(shape, param) {
  if (shape === 'Circle') {
    if (!Number.isFinite(param)) {
      throw 'Circle "PrimitiveActor" requires positive radius for construction!';
    }
  }
  else if (shape === 'Box') {
    if (typeof(param) === 'number') {
      if (param <= 0) {
        throw 'Box "PrimitiveActor" requires positive width and/or height for construction!';
      }
    }
    else {
      if (param.x <= 0 || param.y <= 0) {
        throw 'Box "PrimitiveActor" requires positive width and/or height for construction!';
      }
    }
  }
  else if (shape === 'Polygon') {
    if (!Array.isArray(param) || param.length === 0) {
      throw 'Polygon "PrimitiveActor" requires points for construction!';
    }
  }
}

/**
 * PrimitiveActor ctor
 * @param {String} shape_             'Circle', 'Box' or 'Polygon'
 * @param {Number} color_             Fill color
 * @param {Number|Object|Array} param Data to construct shapes
 */
function PrimitiveActor(shape_, color_, param) {
  var shape = shape_ || 'Box';
  var color = color_ || 0x000000;

  validation(shape, param);

  var sprite = new PIXI.Graphics();
  sprite.beginFill(color);
  if (shape === 'Circle') {
    sprite.drawCircle(0, 0, param);
  }
  else if (shape === 'Box') {
    if (typeof(param) === 'number') {
      sprite.drawRect(-param * 0.5, -param * 0.5, param, param);
    }
    else {
      sprite.drawRect(-param.x * 0.5, -param.y * 0.5, param.x, param.y);
    }
  }
  else if (shape === 'Polygon') {
    sprite.moveTo(param[0].x, param[0].y);
    for (var i = 1; i < param.length; i++) {
      sprite.lineTo(param[i].x, param[i].y);
    }
  }
  spr.endFill();

  var body;
  if (shape === 'Circle') {
    body = new physics.Body({
      shape: new physics.Circle(texture.width * 0.5),
    });
  }
  else if (shape === 'Box') {
    body = new physics.Body({
      shape: new physics.Box(texture.width, texture.height),
    });
  }
  else if (shape === 'Polygon') {
    body = new physics.Body({
      shape: new physics.Polygon(param),
    });
  }

  Actor.call(this, sprite, body);
}
PrimitiveActor.prototype = Object.create(Actor.prototype);
PrimitiveActor.prototype.constructor = PrimitiveActor;

module.exports = exports = PrimitiveActor;
