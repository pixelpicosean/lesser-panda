/**
 * Let the actor always face to the mouse
 */

const Behavior = require('engine/Behavior');
require('engine/gfx/interaction');

class FaceTheMouse extends Behavior {
  constructor() {
    super();

    this.type = 'FaceTheMouse';

    this.mousePos = null;
    this.posCache = null;

    this.rotation = 0;
  }
  init(ent) {
    super.init(ent);

    this.entity.canEverTick = true;
  }
  update(_, dt) {
    if (!this.mousePos) {
      this.mousePos = this.entity.game.sysGfx.mouse;
      this.posCache = this.mousePos.clone();
    }

    this.rotation = this.posCache.copy(this.mousePos)
      .subtract(this.entity.position)
      .angle();

    if (this.entity.gfx) {
      this.entity.gfx.rotation = this.rotation;
    }
  }
}

Behavior.register('FaceTheMouse', FaceTheMouse);

module.exports = FaceTheMouse;
