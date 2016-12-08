class Behavior {
  constructor() {
    this.type = 'Behavior';

    this.entity = null;
  }
  init(entity) {
    this.entity = entity;
  }
  update(dt, sec) {} /* eslint no-unused-vars:0 */
  fixedUpdate(dt, sec) {} /* eslint no-unused-vars:0 */
}

/**
 * Behavior class map.
 * @type {Object}
 */
Behavior.types = {};
Behavior.register = function(type, ctor) {
  if (!Behavior.types[type]) {
    Behavior.types[type] = ctor;
  }
  else {
    console.log('[WARNING]: "' + type + '" behavior is already registered!');
  }
};

module.exports = Behavior;
