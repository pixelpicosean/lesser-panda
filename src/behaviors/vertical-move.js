/**
 * Make the target object able to move vertically.
 *
 * @protocol {
 *   position: {
 *     y: Number
 *   }
 * }
 *
 * @action moveUp   Start to move up
 * @action moveDown Start to move down
 * @action stop     Stop
 *
 * @setting {
 *   speed [Number]         Move speed
 *   useKeyboard [Boolean]  Whether use keyboard to control
 *   upKey [String]         Hold to move up, when `useKeyboard` is true
 *   downKey [String]       Hold to move down, when `useKeyboard` is true
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

export default class VerticalMove extends Behavior {
  constructor(settings) {
    super();

    this.speed = 200;

    this.useKeyboard = true;
    this.upKey = 'UP';
    this.downKey = 'DOWN';

    /* @private */
    this.needUpdate = true;
    this.dir = 0;

    Object.assign(this, settings);
  }

  // Actions
  moveUp() {
    this.dir = -1;
  }
  moveDown() {
    this.dir = 1;
  }
  stop() {
    this.dir = 0;
  }

  // Private
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.upKey)) this.dir -= 1;
      if (keyboard.down(this.downKey)) this.dir += 1;
    }

    this.target.position.y += this.dir * this.speed * dt;
  }
}
