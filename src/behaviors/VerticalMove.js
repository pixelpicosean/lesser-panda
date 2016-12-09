/**
 * Make the target object able to move vertically.
 *
 * @protocol {
 *   position: Vector
 * }
 */

const keyboard = require('engine/keyboard');
const Behavior = require('engine/Behavior');

const DefaultSettings = {
  /* Move speed */
  Speed: 200,

  /* Range of the movement, limit to a range or keep it undefined to avoid */
  Range: undefined,
  /**
   * Percentage of start y location in the range if exist
   * when range is defined
   */
  StartPct: 0,

  /* Whether use keyboard to control */
  UseKeyboard: true,
  /* Hold to move up, when `useKeyboard` is true */
  UpKey: 'UP',
  /* Hold to move down, when `useKeyboard` is true */
  DownKey: 'DOWN',
};

class VerticalMove extends Behavior {
  constructor() {
    super();

    this.type = 'VerticalMove';

    this.dir = 0;
    this.top = 0;
    this.bottom = 0;
    this.hasRange = false;
  }
  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedTick = true;

    this.hasRange = Number.isFinite(this.Range);
    if (this.hasRange) {
      this.top = this.entity.position.y - this.Range * this.StartPct;
      this.bottom = this.top + this.Range;
    }
  }
  fixedUpdate(_, dt) {
    if (this.UseKeyboard) {
      this.dir = 0;
      if (keyboard.down(this.UpKey)) this.dir -= 1;
      if (keyboard.down(this.DownKey)) this.dir += 1;
    }

    this.entity.position.y += this.dir * this.Speed * dt;

    if (this.dir !== 0 && this.hasRange) {
      if (this.entity.position.y > this.bottom) {
        this.entity.position.y = this.bottom;
        this.dir = 0;
        this.entity.events.emit('reachEnd');
      }
      else if (this.entity.position.y < this.top) {
        this.entity.position.y = this.top;
        this.dir = 0;
        this.entity.events.emit('reachStart');
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

module.exports = VerticalMove;
