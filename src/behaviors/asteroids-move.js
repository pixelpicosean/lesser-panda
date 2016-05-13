/**
 * Make the target behavive like the ship of
 * classic Asteroid game.
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';
import { clamp } from 'engine/utils';

export default class AsteroidsMove extends Behavior {
  type = 'AsteroidsMove'

  defaultSettings = {
    /* Whether use keyboard to control */
    useKeyboard: true,
    /* Hold to push forward, when `useKeyboard` is true */
    forwardKey: 'UP',
    /* Hold to push backward, when `useKeyboard` is true */
    backwardKey: 'DOWN',
    /* Hold to turn left, when `useKeyboard` is true */
    leftKey: 'LEFT',
    /* Hold to turn right, when `useKeyboard` is true */
    rightKey: 'RIGHT',

    /* The force to move forward */
    forwardForce: 10,
    /* The force to move backward */
    backwardForce: 8,

    /* The force to turn */
    torque: 1,

    /* Same as Body.velocityLimit */
    maxVelocity: Vector.create(400),
    /* Max turn speed */
    maxTurnSpeed: 3,

    /* Damping of velocity */
    damping: 0.2,
    /* Damping of angular velocity(turn) */
    angularDamping: 0.2,
  }

  constructor() {
    super();

    this.dir = Vector.create(1, 0);
    this.turnSpeed = 0;
    this.turning = 0;
  }
  setup(settings) {
    super.setup(settings);

    this.target.body.damping = this.damping;
  }
  update(_, dt) {
    if (this.useKeyboard) {
      this.target.body.force.set(0);
      this.turning = 0;
      if (keyboard.down(this.forwardKey)) this.pushForward();
      if (keyboard.down(this.backwardKey)) this.pushBackward();
      if (keyboard.down(this.leftKey)) this.turning -= 1;
      if (keyboard.down(this.rightKey)) this.turning += 1;
    }

    // Update turning
    if (this.turning !== 0) {
      this.turnSpeed = clamp(this.turnSpeed + this.turning * this.torque * dt, -this.maxTurnSpeed, this.maxTurnSpeed);
    }
    if (this.angularDamping !== 0) {
      this.turnSpeed *= Math.pow(1 - this.angularDamping, dt);
    }
    this.target.rotation += this.turnSpeed * dt;
    this.dir.set(1, 0).rotate(this.target.rotation);
  }

  // Actions
  // Move forward
  pushForward() {
    this.target.body.force
      .copy(this.dir)
      .multiply(this.forwardForce)
  }
  // Move backward
  pushBackward() {
    this.target.body.force
      .copy(this.dir)
      .multiply(-this.backwardForce)
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
