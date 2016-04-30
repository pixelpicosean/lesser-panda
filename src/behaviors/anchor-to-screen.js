/**
 * Anchor object to screen left/right/top/bottom,
 * by percentage or pixel.
 *
 * Note: `right` will override `left`, and
 * `bottom` will over `top`. So only zero or one property
 * should be set on each axis.
 */

import engine from 'engine/core';
import Behavior from 'engine/behavior';

function pct2Num(pctStr) {
  if (pctStr.length === 0) return 0;
  if (pctStr[pctStr.length - 1] !== '%') return 0;

  return parseFloat(pctStr.slice(0, -1)) * 0.01;
}

export default class AnchorToScreen extends Behavior {
  defaultSettings = {
    left: undefined,
    right: undefined,
    top: undefined,
    bottom: undefined,
  }

  setup(settings) {
    super.setup(settings);

    this.calc('left');
    this.calc('right');
    this.calc('top');
    this.calc('bottom');
  }
  update() {
    this.applyAnchor();
  }
  applyAnchor() {
    const bounds = this.target.sprite.getLocalBounds();

    if (this.left !== undefined) {
      this.target.position.x = this.left + bounds.x;
    }
    else if (this.leftPct !== undefined) {
      this.target.position.x = engine.width * this.leftPct - bounds.x;
    }
    if (this.right !== undefined) {
      this.target.position.x = engine.width - this.right - (bounds.x + bounds.width);
    }
    else if (this.rightPct !== undefined) {
      this.target.position.x = engine.width * (1 - this.rightPct) - (bounds.x + bounds.width);
    }

    if (this.top !== undefined) {
      this.target.position.y = this.top + bounds.y;
    }
    else if (this.topPct !== undefined) {
      this.target.position.y = engine.height * this.topPct - bounds.y;
    }
    if (this.bottom !== undefined) {
      this.target.position.y = engine.height - this.bottom - (bounds.y + bounds.height);
    }
    else if (this.bottomPct !== undefined) {
      this.target.position.y = engine.height * (1 - this.bottomPct) - (bounds.y + bounds.height);
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
