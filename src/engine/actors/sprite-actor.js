var PIXI = require('engine/pixi');
var physics = require('engine/physics');

var Actor = require('./actor');

function SpriteActor(texture, shape_) {
  var sprite = new PIXI.Sprite(texture);

  var body, shape = (shape_ === 'Circle') ? 'Circle' : 'Box';
  if (shape === 'Circle') {
    body = new physics.Body({
      shape: new physics.Circle(texture.width * 0.5),
    });
  }
  else {
    body = new physics.Body({
      shape: new physics.Box(texture.width, texture.height),
    });
  }

  Actor.call(this, sprite, body);
}
SpriteActor.prototype = Object.create(Actor.prototype);
SpriteActor.prototype.constructor = SpriteActor;

module.exports = exports = SpriteActor;
