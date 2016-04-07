/**
 * Make the target object able to move vertically.
 *
 * @protocol {
 *   position: {
 *     y: Number
 *   }
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

const settings = {
  /* Move speed */
  speed: 200,

  /* Whether use keyboard to control */
  useKeyboard: true,
  /* Hold to move up, when `useKeyboard` is true */
  upKey: 'UP',
  /* Hold to move down, when `useKeyboard` is true */
  downKey: 'DOWN',
};

// Start to move up
function moveUp() {
  this.VerticalMove.dir = -1;
}
// Start to move down
function moveDown() {
  this.VerticalMove.dir = 1;
}
// Stop
function stop() {
  this.VerticalMove.dir = 0;
}

const setupTarget = () => {
  this.moveUp = moveUp;
  this.moveDown = moveDown;
  this.stop = stop;
};

export default class VerticalMove extends Behavior {
  constructor(s) {
    super('VerticalMove', setupTarget, Object.assign({}, settings, s), true);

    this.dir = 0;
  }
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.upKey)) this.dir -= 1;
      if (keyboard.down(this.downKey)) this.dir += 1;
    }

    this.target.position.y += this.dir * this.speed * dt;
  }
}
