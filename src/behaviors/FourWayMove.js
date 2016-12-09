/**
 * Make the Actor able to move horizontally or vertically.
 */

const keyboard = require('engine/keyboard');
const Behavior = require('engine/Behavior');
const Vector = require('engine/Vector');

const DefaultSettings = {
  /* Move speed */
  Speed: 200,

  /* Whether use keyboard to control */
  UseKeyboard: true,
  /* Hold to move left, when `useKeyboard` is true */
  LeftKey: 'LEFT',
  /* Hold to move right, when `useKeyboard` is true */
  RightKey: 'RIGHT',
  /* Hold to move up, when `useKeyboard` is true */
  UpKey: 'UP',
  /* Hold to move down, when `useKeyboard` is true */
  DownKey: 'DOWN',
};

class FourWayMove extends Behavior {
  constructor() {
    super();

    this.type = 'FourWayMove';

    this.dir = Vector.create();
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
  }
  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedTick = true;
  }
  fixedUpdate(_, dt) {
    if (this.UseKeyboard) {
      this.dir.set(0);
      if (keyboard.down(this.LeftKey)) this.dir.x -= 1;
      if (keyboard.down(this.RightKey)) this.dir.x += 1;
      if (keyboard.down(this.UpKey)) this.dir.y -= 1;
      if (keyboard.down(this.DownKey)) this.dir.y += 1;
    }

    this.dir.normalize();

    this.entity.position.x += this.dir.x * this.Speed * dt;
    this.entity.position.y += this.dir.y * this.Speed * dt;
  }

  // Actions
  // Move left
  moveLeft() {
    this.dir.x = -1;
  }
  // Move right
  moveRight() {
    this.dir.x = 1;
  }
  // Move up
  moveUp() {
    this.dir.y = -1;
  }
  // Move down
  moveDown() {
    this.dir.y = 1;
  }
  // Stop horizontal movement
  stopX() {
    this.dir.x = 0;
  }
  // Stop vertical movement
  stopY() {
    this.dir.y = 0;
  }
  // Stop
  stop() {
    this.dir.set(0);
  }
}

Behavior.register('FourWayMove', FourWayMove);

module.exports = FourWayMove;
