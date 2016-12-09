/**
 * Make the target behavive like the ship of
 * classic Asteroid game.
 */

const keyboard = require('engine/keyboard');
const Behavior = require('engine/Behavior');
const Vector = require('engine/Vector');
const { clamp } = require('engine/utils/math');

const DefaultSettings = {
  /* Whether use keyboard to control */
  UseKeyboard: true,
  /* Hold to push forward, when `UseKeyboard` is true */
  ForwardKey: 'UP',
  /* Hold to push backward, when `UseKeyboard` is true */
  BackwardKey: 'DOWN',
  /* Hold to turn left, when `UseKeyboard` is true */
  LeftKey: 'LEFT',
  /* Hold to turn right, when `UseKeyboard` is true */
  RightKey: 'RIGHT',

  /* The force to move forward */
  ForwardForce: 10,
  /* The force to move backward */
  BackwardForce: 8,

  /* The force to turn */
  Torque: 1,

  /* Same as Body.velocityLimit */
  MaxVelocity: Vector.create(400),
  /* Max turn speed */
  MaxTurnSpeed: 3,

  /* Damping of velocity */
  Damping: 0.2,
  /* Damping of angular velocity(turn) */
  AngularDamping: 0.2,
};

class AsteroidsMove extends Behavior {
  constructor() {
    super();

    this.type = 'AsteroidsMove';

    // Constants
    this.UseKeyboard = true;
    this.ForwardKey = 'UP';
    this.BackwardKey = 'DOWN';
    this.LeftKey = 'LEFT';
    this.RightKey = 'RIGHT';

    this.ForwardForce = 10;
    this.BackwardForce = 8;

    this.Torque = 1;

    this.MaxVelocity = Vector.create(400);
    this.MaxTurnSpeed = 3;

    this.Damping = 0.2;
    this.AngularDamping = 0.2;

    // Properties
    this.dir = Vector.create(1, 0);
    this.turnSpeed = 0;
    this.turning = 0;
  }
  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedTick = true;
    this.entity.coll.damping = this.Damping;
  }
  fixedUpdate(_, dt) {
    if (this.UseKeyboard) {
      this.entity.coll.force.set(0);
      this.turning = 0;
      if (keyboard.down(this.ForwardKey)) this.pushForward();
      if (keyboard.down(this.BackwardKey)) this.pushBackward();
      if (keyboard.down(this.LeftKey)) this.turning -= 1;
      if (keyboard.down(this.RightKey)) this.turning += 1;
    }

    // Update turning
    if (this.turning !== 0) {
      this.turnSpeed = clamp(this.turnSpeed + this.turning * this.Torque * dt, -this.MaxTurnSpeed, this.MaxTurnSpeed);
    }
    if (this.AngularDamping !== 0) {
      this.turnSpeed *= Math.pow(1 - this.AngularDamping, dt);
    }
    this.entity.rotation += this.turnSpeed * dt;
    this.dir.set(1, 0).rotate(this.entity.rotation);
  }

  // Actions
  // Move forward
  pushForward() {
    this.entity.coll.force
      .copy(this.dir)
      .multiply(this.ForwardForce)
  }
  // Move backward
  pushBackward() {
    this.entity.coll.force
      .copy(this.dir)
      .multiply(-this.BackwardForce)
  }
  // Turn left
  turnLeft() {
    this.turning = -1;
  }
  // Turn right
  turnRight() {
    this.turning = 1;
  }
}

Behavior.register('AsteroidsMove', AsteroidsMove);

module.exports = AsteroidsMove;
