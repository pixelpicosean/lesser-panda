function System() {
  this.name = '';
}

System.prototype.awake = function() {};
System.prototype.update = function() {};
System.prototype.fixedUpdate = function() {};
System.prototype.freeze = function() {};

System.prototype.onEntitySpawn = function() {};
System.prototype.onEntityRemove = function() {};

module.exports = System;
