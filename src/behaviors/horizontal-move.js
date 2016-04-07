/**
 * Make the target object able to move horizontally.
 *
 * @protocol {
 *   position: {
 *     x: Number
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
  /* Hold to move left, when `useKeyboard` is true */
  leftKey: 'LEFT',
  /* Hold to move right, when `useKeyboard` is true */
  rightKey: 'RIGHT',
};

// Start to move left
function moveLeft() {
  this.HorizontalMove.dir = -1;
}
// Start to move right
function moveRight() {
  this.HorizontalMove.dir = 1;
}
// Stop
function stop() {
  this.HorizontalMove.dir = 0;
}

const setupTarget = () => {
  this.moveLeft = moveLeft;
  this.moveRight = moveRight;
  this.stop = stop;
};

export default class HorizontalMove extends Behavior {
  constructor(s) {
    super('HorizontalMove', setupTarget, Object.assign({}, settings, s), true);

    this.dir = 0;
  }
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.leftKey)) this.dir -= 1;
      if (keyboard.down(this.rightKey)) this.dir += 1;
    }

    this.target.position.x += this.dir * this.speed * dt;
  }
}
