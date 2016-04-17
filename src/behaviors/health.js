/**
 * Health management
 *
 * @protocol *
 *
 * @event heal
 * @event fullHeal
 * @event receiveDamage
 * @event kill
 * @event health Health is changed
 */

import Behavior from 'engine/behavior';
import { clamp } from 'engine/utils';

const settings = {
  /* Health value at the beginning */
  startHealth: 3,
  /* Max health value */
  maxHealth: 3,
  damageInvincibleTime: 0,
  healInvincibleTime: 0,
};

// Recover some health
function heal(v) {
  this.health = clamp(this.health + v, 1, this.Health.maxHealth);
  this.Health.emit('heal', v);
}
// Reset health to maxHealth
function fullHeal() {
  this.health = this.Health.maxHealth;
  this.Health.emit('fullHeal');
}
// Received damages
function receiveDamage(dmg) {
  if (this.Health.invincibleTimer > 0) return;

  this.health = clamp(this.health - dmg, 0, this.Health.maxHealth);

  if (this.health === 0) {
    this.kill();
    return;
  }

  this.Health.emit('receiveDamage', dmg);
  this.Health.invincibleTimer = this.Health.damageInvincibleTime;
}
// Health is 0
function kill() {
  this.Health.emit('kill');
}

// Function to setup target
const setupTarget = function() {
  Object.defineProperty(this, 'health', {
    get: function() { return this.Health.health },
    set: function(v) {
      this.Health.health = v;
      this.Health.emit('health', v);
    },
  });

  this.heal = heal;
  this.fullHeal = fullHeal;
  this.receiveDamage = receiveDamage;
  this.kill = kill;

  // Init variables
  this.health = this.Health.startHealth;
  this.Health.invincibleTimer = 0;
};

export default class Health extends Behavior {
  constructor(s) {
    super('Health', setupTarget, Object.assign({}, settings, s), true);
  }
  update(dt) {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
  }
}
