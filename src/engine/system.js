class System {
  constructor() {
    this.name = '';
    this.game = null;
  }

  awake() {}
  update() {}
  fixedUpdate() {}
  freeze() {}

  onEntitySpawn() {}
  onEntityRemove() {}

  onPause() {}
  onResume() {}
}

module.exports = System;
