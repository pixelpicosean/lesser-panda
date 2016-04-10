/**
 * Spawn bullets from target position
 *
 * @protocol {
 *   position: Vector
 *   createBullet: Function(position: Vector, direction: Number)
 *   rotation: Number (only required when directionMode = "Relative")
 * }
 *
 * @action fire Fire a bullet
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

const settings = {
  /* Whether use keyboard to control */
  useKeyboard: true,
  /* Press to fire, when `useKeyboard` is true */
  key: 'X',

  /* Fire continually or not */
  rapid: true,
  /* Time between 2 bullets, when `rapid` is true */
  fireBetween: 400,

  /* "Relative" to target rotation or "Absolute" value */
  directionMode: 'Relative',
  /* Angle that applied to bullets, based on `directionMode` */
  direction: 0,
};

function fire() {
  if (this.FireBullet.fireTimer > 0) return;

  if (this.FireBullet.rapid) {
    this.FireBullet.fireTimer = this.FireBullet.fireBetween;
  }

  this.FireBullet.dir = (this.FireBullet.directionMode === 'Relative') ? this.rotation + this.FireBullet.direction : this.FireBullet.direction;
  this.createBullet(this.FireBullet.emitPoint, this.FireBullet.dir);
}

// Function to setup target
const setupTarget = function() {
  this.fire = fire;
};

export default class FireBullet extends Behavior {
  get emitPoint() {
    return this._emitPoint.set(this.offset, 0)
      .rotate(this.dir);
  }

  constructor(s) {
    super('FireBullet', setupTarget, Object.assign({}, settings, s), true);

    this._emitPoint = Vector.create();
  }

  // Private
  update(dt) {
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    if (this.useKeyboard && keyboard.down(this.key)) {
      this.target.fire();
    }
  }
}
