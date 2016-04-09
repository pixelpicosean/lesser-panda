/**
 * Make the target object able to move vertically.
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
   * Percentage of start y location in the range if exist
   * when range is defined
   */
  startPct: 0,

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

const setupTarget = function() {
  this.moveUp = moveUp;
  this.moveDown = moveDown;
  this.stop = stop;
};

export default class VerticalMove extends Behavior {
  constructor(s) {
    super('VerticalMove', setupTarget, Object.assign({}, settings, s), true);

    this.dir = 0;
    this.top = 0;
    this.bottom = 0;
    this.hasRange = Number.isFinite(this.range);
  }
  activate() {
    if (this.hasRange) {
      this.top = this.target.position.y - this.range * this.startPct;
      this.bottom = this.top + this.range;
    }

    return super.activate();
  }
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.upKey)) this.dir -= 1;
      if (keyboard.down(this.downKey)) this.dir += 1;
    }

    this.target.position.y += this.dir * this.speed * dt;

    if (this.dir !== 0 && this.hasRange) {
      if (this.target.position.y > this.bottom) {
        this.target.position.y = this.bottom;
        this.dir = 0;
        this.emit('reachEnd');
      }
      else if (this.target.position.y < this.top) {
        this.target.position.y = this.top;
        this.dir = 0;
        this.emit('reachStart');
      }
    }
  }
}
