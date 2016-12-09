/**
 * Make the target object able to move horizontally.
 */

const keyboard = require('engine/keyboard');
const Behavior = require('engine/Behavior');

const DefaultSettings = {
  /* Move speed */
  Speed: 200,

  /* Range of the movement, limit to a range or keep it undefined to avoid */
  Range: undefined,
  /**
   * Percentage of start x location in the range if exist
   * when range is defined
   */
  StartPct: 0,

  /* Whether use keyboard to control */
  UseKeyboard: true,
  /* Hold to move left, when `useKeyboard` is true */
  LeftKey: 'LEFT',
  /* Hold to move right, when `useKeyboard` is true */
  RightKey: 'RIGHT',
};

class HorizontalMove extends Behavior {
  constructor() {
    super();

    this.type = 'HorizontalMove';

    this.dir = 0;
    this.left = 0;
    this.right = 0;
    this.hasRange = false;
  }
  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedTick = true;

    this.hasRange = Number.isFinite(this.Range);
    if (this.hasRange) {
      this.left = this.entity.position.x - this.Range * this.StartPct;
      this.right = this.left + this.Range;
    }
  }
  fixedUpdate(_, dt) {
    if (this.UseKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.LeftKey)) this.dir -= 1;
      if (keyboard.down(this.RightKey)) this.dir += 1;
    }

    this.entity.position.x += this.dir * this.Speed * dt;

    if (this.dir !== 0 && this.hasRange) {
      if (this.entity.position.x > this.right) {
        this.entity.position.x = this.right;
        this.dir = 0;
        this.entity.events.emit('reachEnd');
      }
      else if (this.entity.position.x < this.left) {
        this.entity.position.x = this.left;
        this.dir = 0;
        this.entity.events.emit('reachStart');
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

module.exports = HorizontalMove;
