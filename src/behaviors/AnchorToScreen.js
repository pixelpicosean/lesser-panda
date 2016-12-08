/**
 * Anchor object to screen left/right/top/bottom,
 * by percentage or pixel.
 *
 * Note: Set both `right` and `left` will stretch the width of target.
 */

const core = require('engine/core');
const Behavior = require('engine/Behavior');

function pct2Num(pctStr) {
  if (pctStr.length === 0) return 0;
  if (pctStr[pctStr.length - 1] !== '%') return 0;

  return parseFloat(pctStr.slice(0, -1)) * 0.01;
}

const DefaultSettings = {
  left: undefined,
  right: undefined,
  top: undefined,
  bottom: undefined,
};

class AnchorToScreen extends Behavior {
  constructor() {
    super();

    this.type = 'AnchorToScreen';

    this.left = undefined;
    this.right = undefined;
    this.top = undefined;
    this.bottom = undefined;
  }

  init(ent, settings) {
    super.init(ent);

    this.entity.canFixedTick = true;

    Object.assign(this, DefaultSettings, settings);

    this.calc('left');
    this.calc('right');
    this.calc('top');
    this.calc('bottom');
  }
  fixedUpdate() {
    this.applyAnchor();
  }
  applyAnchor() {
    const bounds = this.entity.gfx.getLocalBounds();

    let left, right, top, bottom, width, height;

    // x-axis
    if (this.left !== undefined) {
      // this.entity.position.x = this.left + bounds.x;
      left = this.left;
    }
    else if (this.leftPct !== undefined) {
      // this.entity.position.x = core.width * this.leftPct - bounds.x;
      left = core.width * this.leftPct;
    }
    if (this.right !== undefined) {
      // this.entity.position.x = core.width - this.right - (bounds.x + bounds.width);
      right = core.width - this.right;
    }
    else if (this.rightPct !== undefined) {
      // this.entity.position.x = core.width * (1 - this.rightPct) - (bounds.x + bounds.width);
      right = core.width * (1 - this.rightPct);
    }
    // Stretch if both left and right is set
    if (left !== undefined && right !== undefined) {
      width = right - left;
    }

    if (width !== undefined) {
      this.entity.gfx.width = width;
    }
    if (left !== undefined) {
      this.entity.position.x = left - bounds.x;
    }
    else if (right !== undefined) {
      this.entity.position.x = right - (bounds.x + bounds.width);
    }

    // y-axis
    if (this.top !== undefined) {
      // this.entity.position.y = this.top + bounds.y;
      top = this.top;
    }
    else if (this.topPct !== undefined) {
      // this.entity.position.y = core.height * this.topPct - bounds.y;
      top = core.height * this.topPct;
    }
    if (this.bottom !== undefined) {
      // this.entity.position.y = core.height - this.bottom - (bounds.y + bounds.height);
      bottom = core.height - this.bottom;
    }
    else if (this.bottomPct !== undefined) {
      // this.entity.position.y = core.height * (1 - this.bottomPct) - (bounds.y + bounds.height);
      bottom = core.height * (1 - this.bottomPct);
    }
    // Stretch if both top and bottom is set
    if (top !== undefined && bottom !== undefined) {
      height = bottom - top;
    }

    if (height !== undefined) {
      this.entity.gfx.height = height;
    }
    if (top !== undefined) {
      this.entity.position.y = top - bounds.y;
    }
    else if (bottom !== undefined) {
      this.entity.position.y = bottom - (bounds.y + bounds.height);
    }
  }

  calc(dir) {
    if (typeof(this[dir]) === 'string') {
      this[`${dir}Pct`] = pct2Num(this[dir]);
      this[dir] = undefined;
    }
  }
}

Behavior.register('AnchorToScreen', AnchorToScreen);

module.exports = AnchorToScreen;
