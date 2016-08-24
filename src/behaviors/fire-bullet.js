/**
 * Fire bullets to a specific direction
 */

import keyboard from 'engine/keyboard';
import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

export default class FireBullet extends Behavior {
  static TYPE = 'FireBullet';

  static DEFAULT_SETTINGS = {
    /* "Relative" to target rotation or "Absolute" value */
    directionMode: 'Relative',

    /* Max ammo to  */
    maxAmmo: 5,

    /* Time between fires */
    cooldown: 200,

    /* Bullet class that accept `emitter` and `direction` */
    bulletActor: null,
    /* Which layer to add this bullet to */
    bulletLayer: 'stage',
  };

  constructor() {
    super();

    this.cdTimer = 0;
    this.ammo = 0;

    this.bulletConfig = {
      emitter: null,
      direction: 0,
    };
  }
  awake() {
    this.cdTimer = 0;
    this.ammo = this.maxAmmo;
  }

  // Private
  update(dt) {
    if (this.cdTimer > 0) {
      this.cdTimer -= dt;
    }
  }

  // Actions
  fire(position, direction) {
    if (this.cdTimer > 0) return;

    this.bulletConfig.emitter = this.actor;
    this.bulletConfig.direction = (this.directionMode === 'Relative') ? (this.actor.rotation + direction) : direction;

    if (this.bulletActor && this.actor && this.actor.scene) {
      if (this.ammo > 0) {
        this.ammo -= 1;
        this.actor.emit('ammo', this.ammo);
        this.cdTimer = this.cooldown;
        this.actor.scene.spawnActor(this.bulletActor, position.x, position.y, this.bulletLayer, this.bulletConfig);
      }
    }
  }
  reload(amount) {
    if (!amount) {
      this.ammo = this.maxAmmo;
    }
    else {
      this.ammo = amount;
    }
    this.actor.emit('ammo', this.ammo);
  }
}

Behavior.register('FireBullet', FireBullet);
