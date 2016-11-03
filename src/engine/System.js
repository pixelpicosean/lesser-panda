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
  onEntityTagChange() {}

  onPause() {}
  onResume() {}
}

module.exports = System;
