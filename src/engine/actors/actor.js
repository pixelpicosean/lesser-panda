var EventEmitter = require('engine/eventemitter3');

/**
 * High level object class, made up of a PIXI.Sprite and
 * a physics.Body instance.
 * The `sprite` and `body` share the same postion and rotation,
 * designed to be easy to use.
 * @param {PIXI.Container} sprite Sprite for visual display
 * @param {physics.Body} body
 */
function Actor(sprite, body) {
  EventEmitter.call(this);

  /**
   * Sprite for visual display
   * @type {PIXI.Container}
   */
  this.sprite = sprite;

  /**
   * Body instance
   * @type {physics}
   */
  this.body = body;

  /**
   * Anchor
   * @type {Vector}
   * @default (0.5, 0.5)
   */
  this.anchor = this.sprite.anchor = this.body.anchor.set(0.5);

  /**
   * Position
   * @type {Vector}
   * @default (0, 0)
   */
  this.position = this.sprite.position = this.body.position;

  /**
   * Velocity
   * @type {Vector}
   * @default (0, 0)
   */
  this.velocity = this.body.velocity;

  /**
   * Max velocity
   * @type {Vector}
   * @default (400, 400)
   */
  this.velocityLimit = this.body.velocityLimit;

  /**
   * Force
   * @type {Vector}
   * @default (0, 0)
   */
  this.force = this.body.force;

  /**
   * Reference to the scene that actor is added to
   * @type {Scene}
   */
  this.scene = null;
  /**
   * Reference to the container that sprite is added to
   * @type {[type]}
   */
  this.parent = null;
}
Actor.prototype = Object.create(EventEmitter.prototype);
Actor.prototype.constructor = Actor;

/**
 * Rotation
 */
Object.defineProperty(Actor.prototype, 'rotation', {
  get: function() {
    return this.sprite.rotation;
  },
  set: function(val) {
    this.sprite.rotation = this.body.rotation = val;
  },
});

/**
 * Mass
 */
Object.defineProperty(Actor.prototype, 'mass', {
  get: function() {
    return this.body.mass;
  },
  set: function(val) {
    this.body.mass = val;
  },
});

/**
 * Damping
 */
Object.defineProperty(Actor.prototype, 'damping', {
  get: function() {
    return this.body.damping;
  },
  set: function(val) {
    this.body.damping = val;
  },
});

/**
 * Collision group
 */
Object.defineProperty(Actor.prototype, 'collisionGroup', {
  get: function() {
    return this.body.collisionGroup;
  },
  set: function(val) {
    this.body.setCollisionGroup(val);
  },
});

/**
 * Collision against mask
 */
Object.defineProperty(Actor.prototype, 'collideAgainst', {
  get: function() {
    return this.body.collideAgainst;
  },
  set: function(val) {
    this.body.setCollideAgainst(val);
  },
});

/**
 * Add to the scene and a container
 * @param {Scene} scene
 * @param {PIXI.Container} parent
 * @param {String} tag
 * @return {Actor} Actor itself for chaining
 */
Actor.prototype.addTo = function addTo(scene, parent, tag) {
  this.scene = scene;
  this.parent = parent;

  this.parent.addChild(this.sprite);
  this.scene.world.addBody(this.body);
  this.scene.addObject(this, tag);

  return this;
};

/**
 * Remove from current scene and parent container
 */
Actor.prototype.remove = function remove() {
  this.scene.removeObject(this);

  this.sprite.remove();
  this.body.remove();
};

/**
 * Update method to be called each frame
 * Nothing inside, no need to call `super.update`
 */
Actor.prototype.update = function update() {};

/**
 * @see physics.Body.removeCollision
 */
Actor.prototype.removeCollision = function removeCollision() {
  this.body.removeCollision();
};

module.exports = exports = Actor;
