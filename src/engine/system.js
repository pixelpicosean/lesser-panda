class System {
  constructor() {
    this.name = '';
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
