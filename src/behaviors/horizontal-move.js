/**
 * Make the target object able to move horizontally.
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

export default class HorizontalMove extends Behavior {
  static TYPE = 'HorizontalMove';

  static DEFAULT_SETTINGS = {
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

  constructor() {
    super();

    this.dir = 0;
    this.left = 0;
    this.right = 0;
    this.hasRange = false;
  }
  awake() {
    this.hasRange = Number.isFinite(this.range);
    if (this.hasRange) {
      this.left = this.actor.position.x - this.range * this.startPct;
      this.right = this.left + this.range;
    }
  }
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.leftKey)) this.dir -= 1;
      if (keyboard.down(this.rightKey)) this.dir += 1;
    }

    this.actor.position.x += this.dir * this.speed * dt;

    if (this.dir !== 0 && this.hasRange) {
      if (this.actor.position.x > this.right) {
        this.actor.position.x = this.right;
        this.dir = 0;
        this.actor.emit('reachEnd');
      }
      else if (this.actor.position.x < this.left) {
        this.actor.position.x = this.left;
        this.dir = 0;
        this.actor.emit('reachStart');
      }
    }
  }

  // Actions
  // Start to move left
  moveLeft() {
    this.dir = -1;
  }
  // Start to move right
  moveRight() {
    this.dir = 1;
  }
  // Stop
  stop() {
    this.dir = 0;
  }
}

Behavior.register('HorizontalMove', HorizontalMove);
