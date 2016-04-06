/**
 * Make the target behavive like the ship of
 * classic Asteroid game
 *
 * Target types can be:
 * - physics.Body
 * - Actor and its sub-classes
 * - Any object matches the protocol
 *
 * @protocol {
 *   position: Vector,
 *   velocity: Vector,
 *   force: Vector,
 *   rotation: Number,
 * }
 *
 * @action pushForward
 * @action pushBackward
 * @action turnLeft
 * @action turnRight
 *
 * @setting {
 *   useKeyboard [Boolean]    Whether use keyboard to control
 *   forwardKey [String]      Hold to push forward, when `useKeyboard` is true
 *   backwardKey [String]     Hold to push backward, when `useKeyboard` is true
 *   leftKey [String]         Hold to turn left, when `useKeyboard` is true
 *   rightKey [String]        Hold to turn right, when `useKeyboard` is true
 *   forwardForce [Number]    The force to move forward
 *   backwardForce [Number]   The force to move backward
 *   torque [Number]          The force to turn
 *   maxVelocity [Vector]     Same as Body.velocityLimit
 *   maxTurnSpeed [Number]    Max turn speed
 *   damping [Number]         Damping of velocity
 *   angularDamping [Number]  Damping of angular velocity(turn)
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';
import { clamp } from 'engine/utils';

export default class AsteroidMove extends Behavior {
  constructor(settings) {
    super();

    this.useKeyboard = true;
    this.forwardKey = 'UP';
    this.backwardKey = 'DOWN';
    this.leftKey = 'LEFT';
    this.rightKey = 'RIGHT';
    this.forwardForce = 10;
    this.backwardForce = 8;
    this.torque = 1;
    this.maxVelocity = Vector.create(400);
    this.maxTurnSpeed = 3;
    this.damping = 0.2;
    this.angularDamping = 0.2;

    /* @private */
    this.needUpdate = true;
    this.dir = Vector.create(1, 0);
    this.turnSpeed = 0;
    this.turning = 0;

    Object.assign(this, settings);
  }

  // Actions
  pushForward() {
    this.target.force
      .copy(this.dir)
      .multiply(this.forwardForce)
  }
  pushBackward() {
    this.target.force
      .copy(this.dir)
      .multiply(-this.backwardForce)
  }
  turnLeft() {
    this.turning = -1;
  }
  turnRight() {
    this.turning = 1;
  }

  // Private
  update(_, dt) {
    let force = this.target.force;
    let vel = this.target.velocity;

    if (this.useKeyboard) {
      this.target.force.set(0);
      this.turning = 0;
      if (keyboard.down(this.forwardKey)) this.pushForward();
      if (keyboard.down(this.backwardKey)) this.pushBackward();
      if (keyboard.down(this.leftKey)) this.turning -= 1;
      if (keyboard.down(this.rightKey)) this.turning += 1;
    }

    this.target.damping = this.damping;

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
}
