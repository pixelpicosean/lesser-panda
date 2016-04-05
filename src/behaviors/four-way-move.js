/**
 * Make the target object able to move horizontally or vertically
 *
 * @protocol {
 *   position: {
 *     x: Number,
 *     y: Number,
 *   }
 * }
 *
 * @action moveLeft   Move left
 * @action moveRight  Move right
 * @action moveUp     Move up
 * @action moveDown   Move down
 * @action stopX      Stop horizontal movement
 * @action stopY      Stop vertical movement
 * @action stop       Stop
 *
 * @setting {
 *   speed [Number]         Move speed
 *   useKeyboard [Boolean]  Whether use keyboard to control
 *   leftKey [String]       Hold to move left, when `useKeyboard` is true
 *   rightKey [String]      Hold to move right, when `useKeyboard` is true
 *   upKey [String]         Hold to move up, when `useKeyboard` is true
 *   downKey [String]       Hold to move down, when `useKeyboard` is true
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

export default class VerticalMove extends Behavior {
  constructor(settings) {
    super();

    this.speed = 200;

    this.useKeyboard = true;
    this.leftKey = 'LEFT';
    this.rightKey = 'RIGHT';
    this.upKey = 'UP';
    this.downKey = 'DOWN';

    /* @private */
    this.needUpdate = true;
    this.dir = Vector.create();
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;

    Object.assign(this, settings);
  }

  // Actions
  moveLeft() {
    this.dir.x = -1;
  }
  moveRight() {
    this.dir.x = 1;
  }
  moveUp() {
    this.dir.y = -1;
  }
  moveDown() {
    this.dir.y = 1;
  }
  stopX() {
    this.dir.x = 0;
  }
  stopY() {
    this.dir.y = 0;
  }
  stop() {
    this.dir.set(0);
  }

  // Private
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
