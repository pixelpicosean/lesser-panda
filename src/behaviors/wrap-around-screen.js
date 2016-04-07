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

const settings = {};
const setupTarget = function() {};

export default class WrapAroundScreen extends Behavior {
  constructor(s) {
    super('WrapAroundScreen', setupTarget, settings, true);

    this.needUpdate = true;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.width = 0;
    this.height = 0;
  }
  update(_, dt) {
    // Update bounds
    if (this.scene.camera) {
      this.left = this.scene.camera.left;
      this.right = this.scene.camera.right;
      this.up = this.scene.camera.up;
      this.bottom = this.scene.camera.bottom;
    }
    else {
      this.left = 0;
      this.right = engine.width;
      this.up = 0;
      this.bottom = engine.height;
    }
    this.width = this.right - this.left;
    this.height = this.bottom - this.up;

    if (this.target.position.x < this.left) {
      this.target.position.x += this.width;
    }
    else if (this.target.position.x > this.right) {
      this.target.position.x -= this.width;
    }
    if (this.target.position.y < this.up) {
      this.target.position.y += this.height;
    }
    else if (this.target.position.y > this.bottom) {
      this.target.position.y -= this.height;
    }
  }
}
