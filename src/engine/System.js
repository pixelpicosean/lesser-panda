class System {
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

  awake(settings) {} /* eslint no-unused-vars:0 */
  update(dt, dtSec) {} /* eslint no-unused-vars:0 */
  fixedUpdate(dt, dtSec) {} /* eslint no-unused-vars:0 */
  freeze() {}

  onEntitySpawn(ent) {} /* eslint no-unused-vars:0 */
  onEntityRemove(ent) {} /* eslint no-unused-vars:0 */
  onEntityTagChange(ent, tag) {} /* eslint no-unused-vars:0 */

  onPause() {}
  onResume() {}
}

module.exports = System;
