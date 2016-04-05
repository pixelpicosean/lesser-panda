/**
 * Make the target object able to move vertically.
 *
 * @protocol {
 *   position: {
 *     y: Number
 *   }
 * }
 *
 * @action moveUp   Start to move up
 * @action moveDown Start to move down
 * @action stop     Stop
 *
 * @setting {
 *   speed [Number]         Move speed
 *   useKeyboard [Boolean]  Whether use keyboard to control
 *   upKey [String]         Hold to move up, when `useKeyboard` is true
 *   downKey [String]       Hold to move down, when `useKeyboard` is true
 * }
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';

export default class VerticalMove extends Behavior {
  speed = 200;

  useKeyboard = true;
  upKey = 'UP';
  downKey = 'DOWN';

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
  moveUp() {
    this.dir = -1;
  }
  moveDown() {
    this.dir = 1;
  }
  stop() {
    this.dir = 0;
  }

  // Private
  update(_, dt) {
    if (this.useKeyboard) {
      if (keyboard.down(this.upKey) && !keyboard.down(this.downKey)) {
        this.moveUp();
      }
      else if (keyboard.down(this.downKey) && !keyboard.down(this.upKey)) {
        this.moveDown();
      }
      else {
        this.stop();
      }
    }

    this.target.position.y += this.dir * this.speed * dt;
  }
}
