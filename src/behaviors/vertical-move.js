/**
 * Make the target object able to move vertically.
 *
 * @protocol {
 *   position: Vector
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

export default class VerticalMove extends Behavior {
  static TYPE = 'VerticalMove';

  static DEFAULT_SETTINGS = {
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

  constructor() {
    super();

    this.dir = 0;
    this.top = 0;
    this.bottom = 0;
    this.hasRange = false;
  }
  ready() {
    this.hasRange = Number.isFinite(this.range);
    if (this.hasRange) {
      this.top = this.target.position.y - this.range * this.startPct;
      this.bottom = this.top + this.range;
    }
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
        this.target.emit('reachEnd');
      }
      else if (this.target.position.y < this.top) {
        this.target.position.y = this.top;
        this.dir = 0;
        this.target.emit('reachStart');
      }
    }
  }

  // Actions
  // Start to move up
  moveUp() {
    this.dir = -1;
  }
  // Start to move down
  moveDown() {
    this.dir = 1;
  }
  // Stop
  stop() {
    this.dir = 0;
  }
}

Behavior.register('VerticalMove', VerticalMove);
