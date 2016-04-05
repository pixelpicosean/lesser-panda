/**
 * Make the target object able to move horizontally.
 *
 * @protocol {
 *   position: {
 *     x: Number
 *   }
 * }
 *
 * @action moveLeft   Start to move left
 * @action moveRight  Start to move right
 * @action stop       Stop
 *
 * @setting {
 *   speed [Number]         Move speed
 *   useKeyboard [Boolean]  Whether use keyboard to control
 *   leftKey [String]       Hold to move left, when `useKeyboard` is true
 *   rightKey [String]      Hold to move right, when `useKeyboard` is true
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

export default class HorizontalMove extends Behavior {
  speed = 200;

  useKeyboard = true;
  leftKey = 'LEFT';
  rightKey = 'RIGHT';

  constructor(settings) {
    super(settings);

    this.dir = 0;
  }
  activate() {
    this.scene.addObject(this);
    return super.activate();
  }
  deactivate() {
    this.scene.removeObject(this);
    return super.deactivate();
  }

  // Actions
  moveLeft() {
    this.dir = -1;
  }
  moveRight() {
    this.dir = 1;
  }
  stop() {
    this.dir = 0;
  }

  // Private
  update(_, dt) {
    if (this.useKeyboard) {
      if (keyboard.down(this.leftKey) && !keyboard.down(this.rightKey)) {
        this.moveLeft();
      }
      else if (keyboard.down(this.rightKey) && !keyboard.down(this.leftKey)) {
        this.moveRight();
      }
      else {
        this.stop();
      }
    }

    this.target.position.x += this.dir * this.speed * dt;
  }
}
