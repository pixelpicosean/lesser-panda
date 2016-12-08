/**
 * Interface of sub-systems of game.
 * @interface
 */
class System {
  /**
   * @constructor
   */
  constructor() {
    /**
     * Name of this system
     * @type {String}
     * @readonly
     */
    this.name = '';

    /**
     * Reference to the owner game instance
     * @type {Game}
     * @readonly
     */
    this.game = null;
  }

  /**
   * Callback that will be invoked when owner game is awake.
   * @method awake
   * @memberof System#
   * @param {Object} settings Settings passed to the game
   */
  awake(settings) {} /* eslint no-unused-vars:0 */
  /**
   * Callback that will be invoked each idle frame(animation frame).
   * @method update
   * @memberof System#
   * @param {Number} dt     Delta time in millisecond
   * @param {Number} dtSec  Delta time in second
   */
  update(dt, dtSec) {} /* eslint no-unused-vars:0 */
  /**
   * Callback that will be invoked each fixed frame(based on Game#desiredFPS).
   * @method fixedUpdate
   * @memberof System#
   * @param {Number} dt     Delta time in millisecond
   * @param {Number} dtSec  Delta time in second
   */
  fixedUpdate(dt, dtSec) {} /* eslint no-unused-vars:0 */
  /**
   * Callback that will be invoked when owner game is freeze.
   * @method freeze
   * @memberof System#
   */
  freeze() {}

  /**
   * Callback that will be invoked on each entity spawn.
   * @method onEntitySpawn
   * @memberof System#
   * @param  {Entity} ent Entity instance
   */
  onEntitySpawn(ent) {} /* eslint no-unused-vars:0 */
  /**
   * Callback that will be invoked on each entity remove.
   * @method onEntityRemove
   * @memberof System#
   * @param  {Entity} ent Entity instance
   */
  onEntityRemove(ent) {} /* eslint no-unused-vars:0 */
  /**
   * Callback that will be invoked when an entity changes its tag.
   * @method onEntityTagChange
   * @memberof System#
   * @param {Entity} ent Entity instance
   * @param {String} tag New tag
   */
  onEntityTagChange(ent, tag) {} /* eslint no-unused-vars:0 */

  /**
   * Callback that will be invoked when owner game will pause.
   * @method onPause
   * @memberof System#
   */
  onPause() {}
  /**
   * Callback that will be invoked when owner game will resume from pause.
   * @method onResume
   * @memberof System#
   */
  onResume() {}
}

module.exports = System;
