/**
 * Spawn bullets from target position
 *
 * @action fire Fire a bullet
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

export default class FireBullet extends Behavior {
  type = 'FireBullet'

  defaultSettings = {
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

    /* Bullet emit function, `spawnBullet(position, direction)`, the context is target Actor */
    spawnBullet: null,
  }

  get emitPoint() {
    return this._emitPoint.set(this.offset, 0)
      .rotate(this.dir);
  }

  constructor() {
    super();

    this._emitPoint = Vector.create();
  }

  // Private
  update(dt) {
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
    }

    if (this.useKeyboard && keyboard.down(this.key)) {
      this.fire();
    }
  }

  // Actions
  fire() {
    if (this.fireTimer > 0) return;

    if (this.rapid) {
      this.fireTimer = this.fireBetween;
    }

    this.dir = (this.directionMode === 'Relative') ? this.target.rotation + this.direction : this.direction;
    this.spawnBullet && this.spawnBullet.call(this.target, this.emitPoint, this.dir);
  }
}

Behavior.register('FireBullet', FireBullet);
