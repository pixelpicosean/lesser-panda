/**
 * Make the target object able to move horizontally.
 *
 * @protocol {
 *   position: Vector
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

const settings = {
  /* Move speed */
  speed: 200,

  /* Range of the movement, limit to a range or keep it undefined to avoid */
  range: undefined,
  /**
   * Percentage of start x location in the range if exist
   * when range is defined
   */
  startPct: 0,

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

const setupTarget = function() {
  this.moveLeft = moveLeft;
  this.moveRight = moveRight;
  this.stop = stop;
};

export default class HorizontalMove extends Behavior {
  constructor(s) {
    super('HorizontalMove', setupTarget, Object.assign({}, settings, s), true);

    this.dir = 0;
    this.left = 0;
    this.right = 0;
    this.hasRange = Number.isFinite(this.range);
  }
  activate() {
    if (this.hasRange) {
      this.left = this.target.position.x - this.range * this.startPct;
      this.right = this.left + this.range;
    }

    return super.activate();
  }
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.leftKey)) this.dir -= 1;
      if (keyboard.down(this.rightKey)) this.dir += 1;
    }

    this.target.position.x += this.dir * this.speed * dt;

    if (this.dir !== 0 && this.hasRange) {
      if (this.target.position.x > this.right) {
        this.target.position.x = this.right;
        this.dir = 0;
        this.emit('reachEnd');
      }
      else if (this.target.position.x < this.left) {
        this.target.position.x = this.left;
        this.dir = 0;
        this.emit('reachStart');
      }
    }
  }
}
