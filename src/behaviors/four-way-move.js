/**
 * Make the target object able to move horizontally or vertically
 *
 * @protocol {
 *   position: Vector
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

const settings = {
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

// Move left
function moveLeft() {
  this.FourWayMove.dir.x = -1;
}
// Move right
function moveRight() {
  this.FourWayMove.dir.x = 1;
}
// Move up
function moveUp() {
  this.FourWayMove.dir.y = -1;
}
// Move down
function moveDown() {
  this.FourWayMove.dir.y = 1;
}
// Stop horizontal movement
function stopX() {
  this.FourWayMove.dir.x = 0;
}
// Stop vertical movement
function stopY() {
  this.FourWayMove.dir.y = 0;
}
// Stop
function stop() {
  this.FourWayMove.dir.set(0);
}

const setupTarget = () => {
  this.moveLeft = moveLeft;
  this.moveRight = moveRight;
  this.moveUp = moveUp;
  this.moveDown = moveDown;
  this.stopX = stopX;
  this.stopY = stopY;
  this.stop = stop;
};

export default class VerticalMove extends Behavior {
  constructor(s) {
    super('VerticalMove', setupTarget, Object.assign({}, settings, s), true);

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

    this.target.position.x += this.dir.x * this.speed * dt;
    this.target.position.y += this.dir.y * this.speed * dt;
  }
}
