/**
 * Health management
 *
 * @event heal
 * @event receiveDamage
 * @event kill
 * @event health Health is changed
 */

const Behavior = require('engine/Behavior');
const { clamp } = require('engine/utils/math');

const DefaultSettings = {
  /* Max health value */
  MaxHealth: 3,
  DamageInvincibleTime: 0,
  HealInvincibleTime: 0,
};

class Health extends Behavior {
  constructor() {
    super();

    this.type = 'Health';

    // Constants
    this.MaxHealth = 0;
    this.DamageInvincibleTime = 0;
    this.HealInvincibleTime = 0;

    // Properties
    this.health = 0;
    this.invincibleTimer = 0;
  }

  init(ent, settings) {
    super.init(ent);

    this.entity.canFixedTick = true;

    Object.assign(this, DefaultSettings, settings);

    // Init variables
    this.health = this.MaxHealth;
    this.invincibleTimer = 0;
  }
  fixedUpdate(dt) {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
  }

  // Actions
  // Recover some health
  heal(v) {
    this.health = clamp(this.health + v, 1, this.MaxHealth);

    this.entity.events.emit('heal', v);
  }
  // Received damages
  receiveDamage(dmg) {
    if (this.invincibleTimer > 0) return;

    this.health = clamp(this.health - dmg, 0, this.MaxHealth);

    if (this.health === 0) {
      this.entity.events.emit('kill');
      return;
    }

    this.invincibleTimer = this.DamageInvincibleTime;

    this.entity.events.emit('receiveDamage', dmg);
  }
}

Behavior.register('Health', Health);

module.exports = Health;
