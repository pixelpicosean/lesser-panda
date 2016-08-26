/**
 * Wrap around the screen, works with or without camera.
 */

import engine from 'engine/core';
import Behavior from 'engine/behavior';

export default class WrapAroundScreen extends Behavior {
  static TYPE = 'WrapAroundScreen';

  static DEFAULT_SETTINGS = {
    vertical: true,
    horizontal: true,
  };

  constructor() {
    super();

    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.width = 0;
    this.height = 0;

    this.targetLeft = 0;
    this.targetRight = 0;
    this.targetTop = 0;
    this.targetBottom = 0;

    this.targetBounds;
  }
  update(_, dt) {
    // Update bounds
    if (this.actor.scene.camera) {
      this.left = this.actor.scene.camera.left;
      this.right = this.actor.scene.camera.right;
      this.up = this.actor.scene.camera.up;
      this.bottom = this.actor.scene.camera.bottom;
    }
    else {
      this.left = 0;
      this.right = engine.width;
      this.up = 0;
      this.bottom = engine.height;
    }
    this.width = this.right - this.left;
    this.height = this.bottom - this.up;

    this.targetBounds = this.actor.sprite.getLocalBounds();
    this.targetLeft = this.targetBounds.x + this.actor.position.x;
    this.targetRight = this.targetBounds.x + this.targetBounds.width + this.actor.position.x;
    this.targetTop = this.targetBounds.y + this.actor.position.y;
    this.targetBottom = this.targetBounds.y + this.targetBounds.height + this.actor.position.y;

    if (this.horizontal) {
      if (this.targetRight < this.left) {
        this.actor.position.x += this.width;
      }
      else if (this.targetLeft > this.right) {
        this.actor.position.x -= this.width;
      }
    }
    if (this.vertical) {
      if (this.targetBottom < this.up) {
        this.actor.position.y += this.height;
      }
      else if (this.targetTop > this.bottom) {
        this.actor.position.y -= this.height;
      }
    }
  }
}

Behavior.register('WrapAroundScreen', WrapAroundScreen);
