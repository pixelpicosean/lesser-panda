/**
 * Spawn bullets from target position
 *
 * @protocol {
 *   position: Vector
 * }
 *
 * @action moveUp   Start to move up
 * @action moveDown Start to move down
 * @action stop     Stop
 *
 * @setting {
 *   useKeyboard [Boolean]  Whether use keyboard to control
 *   fireKey [String]       Press to fire, when `useKeyboard` is true
 *   bulletCreator [Function] Factory that creates bullets, bullet(position, rotation)
 *   rapid [Boolean]        Fire continually or not
 *   fireBetween [Number]   Time between 2 bullets, when `rapid` is true
 *   directionMode [String] "Relative" to target rotation or "Absolute" value
 *   direction [Number]     Angle that applied to bullets, based on `directionMode`
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

export default class FireBullet extends Behavior {
  constructor(settings) {
    super();

    this.useKeyboard = true;
    this.fireKey = 'X';

    this.bulletCreator = null;

    this.rapid = true;
    this.fireBetween = 400;

    /* Relative, Absolute */
    this.directionMode = 'Relative';
    this.direction = 0;

    /* @private */
    this.needUpdate = true;
    this._dir = 0;

    Object.assign(this, settings);
  }

  // Actions
  fire() {
    if (this._fireTimer > 0) return;

    if (rapid) {
      this._fireTimer = this.fireBetween;
    }

    this._dir = (this.directionMode === 'Relative') ? this.target.rotation + this.direction : this.direction;
    this.bulletCreator(this.target.position, this._dir);
  }

  // Private
  update(dt) {
    if (this._fireTimer > 0) {
      this._fireTimer -= dt;
    }

    if (this.useKeyboard && keyboard.down(this.fireKey)) {
      this.fire();
    }
  }
}
