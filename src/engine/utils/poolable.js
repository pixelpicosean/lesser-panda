const core = require('engine/core');

/**
 * Add ability of object pooling to a class(function).
 * @param  {function} ctor        Target class(constructor).
 * @param  {number} preAllocSize  How many instances to alloc at the beginning.
 * @return {function}             Class itself for chaining.
 */
module.exports = function(ctor, preAllocSize = 20) {
  // Mark as poolabled
  ctor.canBePooled = true;

  // Pre-allocate instances when resources are loaded
  core.once('ready', function() {
    ctor.pool = Array(preAllocSize);
    for (let i = 0; i < preAllocSize; i++) {
      ctor.pool[i] = new ctor();
    }
  });

  // Get an initialized instance
  ctor.create = function(s) {
    let a = this.pool.pop();
    if (!a) {
      a = new this();
    }
    a.init(s);
    return a;
  };

  // Recycle for later use
  ctor.recycle = function(s) {
    this.pool.push(s);
  };

  return ctor;
};
