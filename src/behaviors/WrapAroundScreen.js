/**
 * Wrap around the screen, works with or without camera.
 */

const core = require('engine/core');
const Behavior = require('engine/Behavior');

const DefaultSettings = {
  Vertical: true,
  Horizontal: true,
};

export default class WrapAroundScreen extends Behavior {
  constructor() {
    super();

    this.type = 'WrapAroundScreen';

    // Constants
    this.Vertical = true;
    this.Horizontal = true;

    // Properties
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
  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedTick = true;
  }
  fixedUpdate(_, dt) {
    // Update bounds
    if (this.entity.game.camera) {
      this.left = this.entity.game.camera.left;
      this.right = this.entity.game.camera.right;
      this.up = this.entity.game.camera.up;
      this.bottom = this.entity.game.camera.bottom;
    }
    else {
      this.left = 0;
      this.right = core.width;
      this.up = 0;
      this.bottom = core.height;
    }
    this.width = this.right - this.left;
    this.height = this.bottom - this.up;

    this.targetBounds = this.entity.gfx.getLocalBounds();
    this.targetLeft = this.targetBounds.x + this.entity.position.x;
    this.targetRight = this.targetBounds.x + this.targetBounds.width + this.entity.position.x;
    this.targetTop = this.targetBounds.y + this.entity.position.y;
    this.targetBottom = this.targetBounds.y + this.targetBounds.height + this.entity.position.y;

    if (this.horizontal) {
      if (this.targetRight < this.left) {
        this.entity.position.x += this.width;
      }
      else if (this.targetLeft > this.right) {
        this.entity.position.x -= this.width;
      }
    }
    if (this.vertical) {
      if (this.targetBottom < this.up) {
        this.entity.position.y += this.height;
      }
      else if (this.targetTop > this.bottom) {
        this.entity.position.y -= this.height;
      }
    }
  }
}

Behavior.register('WrapAroundScreen', WrapAroundScreen);

module.exports = WrapAroundScreen;
