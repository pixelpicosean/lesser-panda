var PIXI = require('engine/pixi');
var physics = require('engine/physics');

var Actor = require('./actor');

function SpriteActor(textures, shape_) {
  var sprite = new PIXI.extras.AnimatedSprite(textures);

  var body, shape = (shape_ === 'Circle') ? 'Circle' : 'Box';
  if (shape === 'Circle') {
    body = new physics.Body({
      shape: new physics.Circle(sprite.width * 0.5),
    });
  }
  else {
    body = new physics.Body({
      shape: new physics.Box(sprite.width, sprite.height),
    });
  }

  Actor.call(this, sprite, body);
}
SpriteActor.prototype = Object.create(Actor.prototype);
SpriteActor.prototype.constructor = SpriteActor;

/**
 * Define a new animation
 * @see PIXI.extras.AnimatedSprite.addAnim
 * @return {SpriteActor} Actor itself for chaining
 */
SpriteActor.prototype.addAnim = function addAnim(name, frames, props) {
  this.sprite.addAnim(name, frames, props);
  return this;
};

/**
 * Play a pre-defined animation
 * @see PIXI.extras.AnimatedSprite.play
 * @return {SpriteActor} Actor itself for chaining
 */
SpriteActor.prototype.play = function play(name, frame) {
  this.sprite.play(name, frame);
  return this;
};

/**
 * Stop current animation
 * @see PIXI.extras.AnimatedSprite.stop
 * @return {SpriteActor} Actor itself for chaining
 */
SpriteActor.prototype.stop = function stop(frame) {
  this.sprite.stop(frame);
  return this;
};

/**
 * Set a specific frame
 * @see PIXI.extras.AnimatedSprite.gotoFrame
 * @return {SpriteActor} Actor itself for chaining
 */
SpriteActor.prototype.gotoFrame = function gotoFrame(frame) {
  this.sprite.gotoFrame(frame);
  return this;
};

module.exports = exports = SpriteActor;
