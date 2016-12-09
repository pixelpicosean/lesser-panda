const Vector = require('engine/Vector');
const { Box, Circle } = require('./shapes');

/**
 * Collider is the core element of physics module.
 *
 * @example <caption>Create a collider</caption>
 * const Collider = require('engine/physics/Collider');
 *
 * // Create collider instance
 * let collider = Collider({
 *   shape: 'Box',
 *   width: 20, height: 20,
 *   dumping: 0.6,
 * });
 *
 * @example <caption>Define collision groups</caption>
 * const { getGroupMask } = require('engine/physics');
 *
 * // It is recommend to define once in a module, and import it to use.
 * const GROUPS = {
 *   SOLID:   getGroupMask(0),
 *   PLAYER:  getGroupMask(1),
 *   TRIGGER: getGroupMask(2),
 * };
 *
 * @example <caption>Setup collision</caption>
 * let bodyA = Collider({
 *   // A is a SOLID collider
 *   collisionGroup: GROUPS.SOLID,
 * });
 *
 * let bodyB = Collider({
 *   // B is a player collider
 *   collisionGroup: GROUPS.PLAYER,
 *   // This collider will collide with SOLID bodies
 *   collideAgainst: GROUPS.SOLID,
 *   // Collision response handler
 *   collide: function(other) {
 *     // Response to the collision when collide with something SOLID,
 *     // which means this will be moved back and won't get through
 *     // the SOLID collider.
 *     if (other.collisionGroup & GROUPS.SOLID) {
 *       // When return false here, this collider will keep as is.
 *       // In this case, player will get through the SOLID collider.
 *       return true;
 *     }
 *   },
 * });
 *
 * For more complex samples, take a look at the [physics sample code](https://github.com/pixelpicosean/lesser-panda-samples/blob/master/src/game/samples/physics.js).
 *
 * @class Collider
 */
class Collider {
  /**
   * @constructor
   * @param {object} [properties] Settings to merge.
   */
  constructor(properties) {
    /**
     * ID of this collider.
     * @type {number}
     */
    this.id = Collider.nextId++;
    /**
     * Static collider will never update or response to collisions.
     * @type {Boolean}
     * @default false
     */
    this.isStatic = false;
    /**
     * Whether this collider will hit CollisionMap.
     * @type {Boolean}
     */
    this.canHitMap = true;
    /**
     * Collider's parent world.
     * @type {SystemPhysics}
     */
    this.world = null;
    /**
     * Collider's shape.
     * @type {Box|Circle}
     */
    this.shape = null;
    /**
     * Position of collider.
     * @type {Vector}
     */
    this.position = Vector.create();
    /**
     * Last position of collider.
     * @type {Vector}
     */
    this.last = Vector.create();
    /**
     * Collider's velocity.
     * @type {Vector}
     */
    this.velocity = Vector.create();
    /**
     * Collider's maximum velocity.
     * @type {Vector}
     * @default 400, 400
     */
    this.velocityLimit = Vector.create(400, 400);
    /**
     * Collider's mass.
     * @type {number}
     * @default 0
     */
    this.mass = 0;
    /**
     * Collider's collision group.
     * @type {number}
     * @default null
     */
    this.collisionGroup = null;
    /**
     * Collision groups that this collider collides against.
     * Note: this will be a Number when broadPhase is "SpatialHash",
     * but will be an Array while using "Simple".
     * @type {array|number}
     */
    this.collideAgainst = 0;
    /**
     * Collider's force.
     * @type {Vector}
     * @default 0,0
     */
    this.force = Vector.create();
    /**
     * Collider's damping. Should be number between 0 and 1.
     * @type {number}
     * @default 0
     */
    this.damping = 0;

    // Bounding info
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;

    this.lastLeft = 0;
    this.lastRight = 0;
    this.lastTop = 0;
    this.lastBottom = 0;

    this.setup(properties);
  }

  /**
   * Width of this collider(of its shape or 0).
   * @type {number}
   * @readonly
   */
  get width() {
    return this.shape ? this.shape.width : 0;
  }

  /**
   * Height of this collider(of its shape or 0).
   * @type {number}
   * @readonly
   */
  get height() {
    return this.shape ? this.shape.height : 0;
  }

  /**
   * Add this collider to the world.
   * @memberof Collider#
   * @method addTo
   * @param {SystemPhysics} world   Physics system instance to add to
   * @return {Collider}             Self for chaining
   */
  addTo(world) {
    world.addCollider(this);
    return this;
  }

  /**
   * Remove collider from it's world.
   * @memberof Collider#
   * @method remove
   */
  remove() {
    if (this.world) {
      this.world.removeCollider(this);
    }
  }

  /**
   * This will be called before collision checking.
   * You can clean up collision related flags here.
   * @memberof Collider#
   * @method beforeCollide
   */
  beforeCollide() {}

  /**
   * This is called while overlapping another collider.
   * @memberof Collider#
   * @method collide
   * @param {Collider} other  Collider that is currently overlapping.
   * @param {*} response      Response infomration(direction for box, and angle for circle).
   * @return {boolean}        Return true to apply hit response.
   */
  collide(other, response) { /* eslint no-unused-vars:0 */
    return true;
  }

  /**
   * This is called after hit response.
   * @memberof Collider#
   * @method afterCollide
   */
  afterCollide() {}

  /**
   * Handle collision map tracing result.
   * @param {Object} res  Tracing result to handle.
   */
  handleMovementTrace(res) {} /* eslint no-unused-vars:0 */

  /**
   * Setup this collider with settings.
   * @memberof Collider#
   * @method setup
   * @param {Object} settings Setting object.
   * @return {Collider}       Self for chaining
   */
  setup(settings) {
    for (let k in settings) {
      switch (k) {
        // Set value
        case 'mass':
        case 'damping':
        case 'collisionGroup':
        case 'collideAgainst':
        case 'isStatic':
        case 'beforeCollide':
        case 'collide':
        case 'afterCollide':
        case 'handleMovementTrace':
          this[k] = settings[k];
          break;

        // Set vector
        case 'position':
        case 'velocity':
        case 'force':
        case 'velocityLimit':
          this[k].x = settings[k].x || 0;
          this[k].y = settings[k].y || 0;
          break;

        // Set shape
        case 'shape':
          if (typeof(settings.shape) === 'string') {
            if (settings.shape === 'Box') {
              this.shape = new Box(settings.width || 8, settings.height || 8);
            }
            else if (settings.shape === 'Circle') {
              this.shape = new Circle(settings.radius || 4);
            }
          }
          else {
            this.shape = settings.shape;
          }
      }
    }

    return this;
  }
}

Collider.nextId = 0;

module.exports = function(settings) {
  return new Collider(settings);
};
