/**
 * Health
 *
 * @protocol EventEmitter
 *
 * @action heal
 * @action fullHeal
 * @action receiveDamage
 *
 * @event health [Number]       Health change events
 * @event invincible [Boolean]  Invincible change events
 *
 * @setting {
 *   startHealth [Number]         Health value at the beginning
 *   maxHealth [Number]           Max health value
 *   damageInvincibleTime [Number]Invincible time between damages, in milliseconds
 *   healInvincibleTime [Number]  Invincible time after heal
 *   killEvent [String]           Event to emit when health is 0
 * }
 *
 */

import Behavior from 'engine/behavior';
import { clamp } from 'engine/utils';

export default class Health extends Behavior {
  get health() {
    return this._health;
  }
  set health(v) {
    this._health = v;
    this.target && this.target.emit('health', this._health);
  }

  constructor(settings) {
    super();

    this.startHealth = 3;
    this.maxHealth = 3;
    this.damageInvincibleTime = 0;
    this.healInvincibleTime = 0; after heal
    this.killEvent = 'kill';

    /* @private */
    this.needUpdate = true;
    this._health = this.startHealth;
    this._invincibleTimer = 0;

    Object.assign(this, settings);
  }

  // Actions
  heal(v) {
    this.health = clamp(this.health + v, 1, this.maxHealth);
  }
  fullHeal() {
    this.health = this.maxHealth;
  }
  receiveDamage(dmg) {
    if (this._invincibleTimer > 0) return;

    this.health = clamp(0, this.maxHealth);
    if (this.health === 0 && this.target) {
      this.target.emit(this.killEvent);
    }
  }

  // Private
  update(dt) {
    if (this._invincibleTimer > 0) {
      this._invincibleTimer -= dt;
    }
  }
}
