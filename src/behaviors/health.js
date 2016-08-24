/**
 * Health management
 *
 * @event heal
 * @event receiveDamage
 * @event kill
 * @event health Health is changed
 */

import Behavior from 'engine/behavior';
import { clamp } from 'engine/utils';

export default class Health extends Behavior {
  static TYPE = 'Health';

  static DEFAULT_SETTINGS = {
    /* Max health value */
    maxHealth: 3,
    damageInvincibleTime: 0,
    healInvincibleTime: 0,
  };

  get health() {
    return this._health;
  }
  set health(v) {
    this._health = v;
    this.target.emit('health', v);
  }

  get invincible() {
    return this.invincibleTimer > 0;
  }

  ready() {
    // Init variables
    this.health = this.maxHealth;
    this.invincibleTimer = 0;
  }
  update(dt) {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
  }

  // Actions
  // Recover some health
  heal(v) {
    this.health = clamp(this.health + v, 1, this.maxHealth);
    this.target.emit('heal', v);
  }
  // Reset health to maxHealth
  fullHeal() {
    this.health = this.maxHealth;
    this.target.emit('heal');
  }
  // Received damages
  receiveDamage(dmg) {
    if (this.invincibleTimer > 0) return;

    this.health = clamp(this.health - dmg, 0, this.maxHealth);

    this.target.emit('receiveDamage', dmg);

    if (this.health === 0) {
      this.kill();
      return;
    }

    this.invincibleTimer = this.damageInvincibleTime;
  }
  // Health is 0
  kill() {
    this.target.emit('kill');
  }
}

Behavior.register('Health', Health);
