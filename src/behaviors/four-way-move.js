/**
 * Make the Actor able to move horizontally or vertically.
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

export default class FourWayMove extends Behavior {
  static TYPE = 'FourWayMove';

  static DEFAULT_SETTINGS = {
    /* Move speed */
    speed: 200,

    /* Whether use keyboard to control */
    useKeyboard: true,
    /* Hold to move left, when `useKeyboard` is true */
    leftKey: 'LEFT',
    /* Hold to move right, when `useKeyboard` is true */
    rightKey: 'RIGHT',
    /* Hold to move up, when `useKeyboard` is true */
    upKey: 'UP',
    /* Hold to move down, when `useKeyboard` is true */
    downKey: 'DOWN',
  };

  constructor() {
    super();

    this.dir = Vector.create();
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
  }
  update(_, dt) {
    if (this.useKeyboard) {
      this.dir.set(0);
      if (keyboard.down(this.leftKey)) this.dir.x -= 1;
      if (keyboard.down(this.rightKey)) this.dir.x += 1;
      if (keyboard.down(this.upKey)) this.dir.y -= 1;
      if (keyboard.down(this.downKey)) this.dir.y += 1;
    }

    this.dir.normalize();

    this.actor.position.x += this.dir.x * this.speed * dt;
    this.actor.position.y += this.dir.y * this.speed * dt;
  }

  // Actors
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
