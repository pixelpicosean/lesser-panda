/**
 * Anchor object to screen left/right/top/bottom,
 * by percentage or pixel.
 *
 * Note: `right` will override `left`, and
 * `bottom` will over `top`. So only zero or one property
 * should be set on each axis.
 *
 * @protocol {
 *   position: Vector
 * }
 */

import engine from 'engine/core';
import Behavior from 'engine/behavior';

const settings = {
  left: undefined,
  right: undefined,
  top: undefined,
  bottom: undefined,

  // TODO: take bounds into account
};

const setupTarget = function() {};

function pct2Num(pctStr) {
  if (pctStr.length === 0) return 0;
  if (pctStr[pctStr.length - 1] !== '%') return 0;

  return parseFloat(pctStr.slice(0, -1)) * 0.01;
}

export default class AnchorToScreen extends Behavior {
  constructor(s) {
    super('AnchorToScreen', setupTarget, Object.assign({}, settings, s), true);

    this.calc('left');
    this.calc('right');
    this.calc('top');
    this.calc('bottom');
  }
  activate() {
    this.applyAnchor();
    return super.activate();
  }
  update() {
    this.applyAnchor();
  }
  applyAnchor() {
    if (this.left !== undefined) {
      this.target.position.x = this.left;
    }
    else if (this.leftPct !== undefined) {
      this.target.position.x = engine.width * this.leftPct;
    }
    if (this.right !== undefined) {
      this.target.position.x = engine.width - this.right;
    }
    else if (this.rightPct !== undefined) {
      this.target.position.x = engine.width * (1 - this.rightPct);
    }

    if (this.top !== undefined) {
      this.target.position.y = this.top;
    }
    else if (this.topPct !== undefined) {
      this.target.position.y = engine.height * this.topPct;
    }
    if (this.bottom !== undefined) {
      this.target.position.y = engine.height - this.bottom;
    }
    else if (this.bottomPct !== undefined) {
      this.target.position.y = engine.height * (1 - this.bottomPct);
    }
  }

  calc(dir) {
    if (typeof(this[dir]) === 'string') {
      this[`${dir}Pct`] = pct2Num(this[dir]);
      this[dir] = undefined;
    }
  }
}
