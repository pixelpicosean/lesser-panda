/**
 * Make the target object able to move horizontally.
 *
 * @protocol {
 *   position: {
 *     x: Number
 *   }
 * }
 *
 * @action moveLeft   Start to move left
 * @action moveRight  Start to move right
 * @action stop       Stop
 *
 * @setting {
 *   speed [Number]         Move speed
 *   useKeyboard [Boolean]  Whether use keyboard to control
 *   leftKey [String]       Hold to move left, when `useKeyboard` is true
 *   rightKey [String]      Hold to move right, when `useKeyboard` is true
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

export default class HorizontalMove extends Behavior {
  constructor(settings) {
    super();

    this.speed = 200;

    this.useKeyboard = true;
    this.leftKey = 'LEFT';
    this.rightKey = 'RIGHT';

    /* @private */
    this.needUpdate = true;
    this.dir = 0;

    Object.assign(this, settings);
  }

  // Actions
  moveLeft() {
    this.dir = -1;
  }
  moveRight() {
    this.dir = 1;
  }
  stop() {
    this.dir = 0;
  }

  // Private
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.leftKey)) this.dir -= 1;
      if (keyboard.down(this.rightKey)) this.dir += 1;
    }

    this.target.position.x += this.dir * this.speed * dt;
  }
}
