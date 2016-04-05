var PIXI = require('engine/pixi');
var physics = require('engine/physics');

var Actor = require('./actor');

function SpriteActor(texture, shape) {
  var sprite = function() {
    return new PIXI.Sprite(texture);
  };
  var body = function() {
    var shape = (shape === 'Circle') ? 'Circle' : 'Box';

    if (shape === 'Circle') {
      return new physics.Body({
        shape: new physics.Circle(texture.width * 0.5),
      });
    }
    else {
      return new physics.Body({
        shape: new physics.Box(texture.width, texture.height),
      });
    }
  };

  Actor.call(sprite, body);
}
SpriteActor.prototype = Object.create(Actor.prototype);
SpriteActor.prototype.constructor = SpriteActor;

module.exports = exports = SpriteActor;
