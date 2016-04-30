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

export default class Health extends Behavior {
  type = 'Health'

  defaultSettings = {
    /* Health value at the beginning */
    startHealth: 3,
    /* Max health value */
    maxHealth: 3,
    damageInvincibleTime: 0,
    healInvincibleTime: 0,
  }

  get health() {
    return this._health;
  }
  set health(v) {
    this._health = v;
    this.target.emit('health', v);
  }

  setup(settings) {
    super.setup(settings);

    // Init variables
    this.health = this.startHealth;
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
    this.target.emit('fullHeal');
  }
  // Received damages
  receiveDamage(dmg) {
    if (this.invincibleTimer > 0) return;

    this.health = clamp(this.health - dmg, 0, this.maxHealth);

    if (this.health === 0) {
      this.kill();
      return;
    }

    this.target.emit('receiveDamage', dmg);
    this.invincibleTimer = this.damageInvincibleTime;
  }
  // Health is 0
  kill() {
    this.target.emit('kill');
  }
}

Behavior.register('Health', Health);
