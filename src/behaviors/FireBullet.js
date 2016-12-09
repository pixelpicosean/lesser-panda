/**
 * Fire bullets to a specific direction
 */

const keyboard = require('engine/keyboard');
const Behavior = require('engine/Behavior');
const Vector = require('engine/Vector');

const DefaultSettings = {
  /* Max ammo to  */
  MaxAmmo: 5,

  /* Time between fires */
  Cooldown: 200,

  /* Bullet class that accept `emitter` and `direction` */
  BulletActor: null,
  /* Which layer to add this bullet to */
  BulletLayer: null,
};

class FireBullet extends Behavior {
  constructor() {
    super();

    this.type = 'FireBullet';

    // Constants
    this.MaxAmmo = 5;

    this.Cooldown = 200;

    this.BulletActor = null;
    this.BulletLayer = null;

    // Properties
    this.cdTimer = 0;
    this.ammo = 0;

    this.bulletConfig = {
      emitter: null,
      direction: 0,
    };
  }
  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedTick = true;

    this.cdTimer = 0;
    this.ammo = this.MaxAmmo;
  }
  fixedUpdate(dt) {
    if (this.cdTimer > 0) {
      this.cdTimer -= dt;
    }
  }

  // Actions
  fire(position, direction) {
    if (this.cdTimer > 0) return;

    this.bulletConfig.emitter = this.entity;
    this.bulletConfig.direction = direction;

    if (this.bulletActor && this.entity && this.entity.game) {
      if (this.ammo > 0) {
        this.ammo -= 1;
        this.entity.events.emit('ammoChange', this.ammo);
        this.cdTimer = this.Cooldown;
        this.entity.game.spawnEntity(this.BulletActor, position.x, position.y, this.BulletLayer, this.bulletConfig);
      }
    }
  }
  reload(amount) {
    if (!amount) {
      this.ammo = this.MaxAmmo;
    }
    else {
      this.ammo = amount;
    }
    this.entity.events.emit('ammoChange', this.ammo);
  }
}

Behavior.register('FireBullet', FireBullet);

module.exports = FireBullet;
