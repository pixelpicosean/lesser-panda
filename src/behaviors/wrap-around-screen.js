/**
 * Wrap around the screen, works with or without camera
 * TODO: take target size into account
 *
 * @protocol {
 *   position: Vector
 * }
 */

import engine from 'engine/core';
import Behavior from 'engine/behavior';

export default class WrapAroundScreen extends Behavior {
  type = 'WrapAroundScreen'

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
    if (this.target.scene.camera) {
      this.left = this.target.scene.camera.left;
      this.right = this.target.scene.camera.right;
      this.up = this.target.scene.camera.up;
      this.bottom = this.target.scene.camera.bottom;
    }
    else {
      this.left = 0;
      this.right = engine.width;
      this.up = 0;
      this.bottom = engine.height;
    }
    this.width = this.right - this.left;
    this.height = this.bottom - this.up;

    this.targetBounds = this.target.sprite.getLocalBounds();
    this.targetLeft = this.targetBounds.x + this.target.position.x;
    this.targetRight = this.targetBounds.x + this.targetBounds.width + this.target.position.x;
    this.targetTop = this.targetBounds.y + this.target.position.y;
    this.targetBottom = this.targetBounds.y + this.targetBounds.height + this.target.position.y;

    if (this.targetRight < this.left) {
      this.target.position.x += this.width;
    }
    else if (this.targetLeft > this.right) {
      this.target.position.x -= this.width;
    }
    if (this.targetBottom < this.up) {
      this.target.position.y += this.height;
    }
    else if (this.targetTop > this.bottom) {
      this.target.position.y -= this.height;
    }
  }
}

Behavior.register('WrapAroundScreen', WrapAroundScreen);
