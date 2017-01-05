const System = require('engine/system');
const Vector = require('engine/Vector');
const { removeItems } = require('engine/utils/array');
const { clamp } = require('engine/utils/math');

const Arrays = new Array(20);
for (let i = 0; i < 20; i++) {
  Arrays[i] = [];
}
const getArray = () => {
  let arr = Arrays.pop();
  if (!arr) {
    arr = [];
  }
  return arr;
};
const putArray = (arr) => {
  arr.length = 0;
  Arrays.push(arr);
};

/**
 * Physics system.
 *
 * @class SystemPhysics
 */
class SystemPhysics extends System {
  /**
   * @constructor
   * @param {Object} [settings] Settings to be merged in.
   */
  constructor(settings) {
    super();

    this.name = 'Physics';

    /**
     * Gravity of physics world.
     * @property {Vector} gravity
    */
    this.gravity = Vector.create();
    /**
     * Spatial hash shift factor (larger number = less division)
     * @type {Number}
     */
    this.spatialShift = 5;
    /**
     * Collision solver instance.
     * @type {SATSolver|AABBSolver}
     */
    this.solver = null;
    /**
     * List of colliders in world.
     * @type {array}
     */
    this.colliders = [];
    /**
     * Collision map to trace colliders against.
     * @type {CollisionMap}
     */
    this.collisionMap = null;

    /**
     * Save whether collision of a pair of objects are checked
     * @type {object}
     * @private
     */
    this.checks = {};
    /**
     * How many pair of colliders have been checked in this frame
     * @type {number}
     * @protected
     */
    this.collisionChecks = 0;

    /**
     * Collision map trace result
     * @type {Object}
     * @private
     */
    this.res = {
      x: 0,
      y: 0,
      hitX: false,
      hitY: false,
    };

    this.setup(settings);
  }

  /**
   * Setup this system with setting object.
   * @memberof SystemPhysics#
   * @method setup
   * @param {Object} settings Setting object.
   */
  setup(settings) {
    for (let k in settings) {
      switch (k) {
        // Value
        case 'name':
        case 'spatialShift':
        case 'solver':
        case 'collisionMap':
          this[k] = settings[k];
          break;

        // Vector
        case 'gravity':
          this.gravity.x = settings.gravity.x || 0;
          this.gravity.y = settings.gravity.y || 0;
          break;
      }
    }
  }

  /**
   * Add collider to world.
   * @memberof SystemPhysics#
   * @method addCollider
   * @param {Coll} coll Collider to add
   */
  addCollider(coll) {
    coll.world = this;
    coll.isRemoved = false;
    if (this.colliders.indexOf(coll) === -1) {
      this.colliders.push(coll);
    }
  }

  /**
   * Remove collider from world.
   * @memberof SystemPhysics#
   * @method removeCollider
   * @param {Coll} coll Collider to remove
   */
  removeCollider(coll) {
    if (!coll.world) {return;}
    coll.world = null;
    coll.isRemoved = true;
  }

  /**
   * Update colliders and check collisions.
   * @memberof SystemPhysics#
   * @method fixedUpdate
   * @param {Number} dt     Delta time in millisecond
   * @param {Number} delta  Delta time in second
   */
  fixedUpdate(dt, delta) {
    this.collisionChecks = 0;
    this.checks = {};

    let i, j, coll, coll2, group, hash = {};
    let halfWidth, halfHeight, sx, sy, ex, ey, x, y, a2b, b2a, key;

    // Process colliders
    for (i = 0; i < this.colliders.length; i++) {
      coll = this.colliders[i];

      // Save position of last frame
      coll.last.copy(coll.position);

      // Collider is already removed, just remove it
      if (coll.isRemoved) {
        removeItems(this.colliders, i--, 1);
        continue;
      }

      if (!coll.isStatic) {
        // Update velocity
        if (coll.mass !== 0) {
          coll.velocity.add(
            this.gravity.x * coll.mass * delta,
            this.gravity.y * coll.mass * delta
          );
        }

        coll.velocity.add(coll.force.x * delta, coll.force.y * delta);
        if (coll.damping > 0 && coll.damping < 1) {
          coll.velocity.multiply(Math.pow(1 - coll.damping, delta));
        }

        // Clamp the velocity
        if (coll.velocityLimit.x > 0) {
          coll.velocity.x = clamp(coll.velocity.x, -coll.velocityLimit.x, coll.velocityLimit.x);
        }
        if (coll.velocityLimit.y > 0) {
          coll.velocity.y = clamp(coll.velocity.y, -coll.velocityLimit.y, coll.velocityLimit.y);
        }

        // Calculate delta movement during this frame
        this.res.x = coll.velocity.x * delta;
        this.res.y = coll.velocity.y * delta;

        // Trace against the map there is one
        if (this.collisionMap && coll.canHitMap) {
          this.collisionMap.trace(coll, this.res.x, this.res.y, this.res);
          // Manually handle trace result
          coll.handleMovementTrace(this.res);
        }

        // Apply trace result
        coll.position.x += this.res.x;
        coll.position.y += this.res.y;
      }

      // Update bounds
      if (coll.shape) {
        halfWidth = coll.shape.width * 0.5;
        halfHeight = coll.shape.height * 0.5;

        coll.lastLeft = coll.last.x - halfWidth;
        coll.lastRight = coll.last.x + halfWidth;
        coll.lastTop = coll.last.y - halfHeight;
        coll.lastBottom = coll.last.y + halfHeight;

        coll.left = coll.position.x - halfWidth;
        coll.right = coll.position.x + halfWidth;
        coll.top = coll.position.y - halfHeight;
        coll.bottom = coll.position.y + halfHeight;
      }

      // Insert the hash and test collisions
      sx = coll.left >> this.spatialShift;
      sy = coll.top >> this.spatialShift;
      ex = coll.right >> this.spatialShift;
      ey = coll.bottom >> this.spatialShift;

      // Non-static colliders will be notified before collision
      if (!coll.isStatic) {
        coll.beforeCollide();
      }

      for (y = sy; y <= ey; y++) {
        for (x = sx; x <= ex; x++) {
          // Find or create the list
          if (!hash[x]) {
            hash[x] = {};
          }
          if (!hash[x][y]) {
            hash[x][y] = getArray();
          }
          group = hash[x][y];

          // Insert collider into the group
          group.push(coll);

          // Pass: only one collider
          if (group.length === 1) {
            continue;
          }

          // Test colliders in the same group
          for (j = 0; j < group.length; j++) {
            coll2 = group[j];

            // Pass: same collider or someone is already removed
            if (coll2 === coll || coll.isRemoved || coll2.isRemoved) {
              continue;
            }

            a2b = !!(coll.collideAgainst & coll2.collisionGroup) && !(coll.isStatic);
            b2a = !!(coll2.collideAgainst & coll.collisionGroup) && !(coll2.isStatic);

            // Pass: never collide with each other
            if (!a2b && !b2a) {
              continue;
            }

            key = `${coll.id < coll2.id ? coll.id : coll2.id}:${coll.id > coll2.id ? coll.id : coll2.id}`;

            // Pass: already checked
            if (this.checks[key]) {
              continue;
            }

            // Mark this pair is already checked
            this.checks[key] = true;
            this.collisionChecks++;

            // Test overlap
            if (this.solver.hitTest(coll, coll2)) {
              // Apply response
              this.solver.hitResponse(coll, coll2, a2b, b2a);
            }
          }
        }
      }
    }

    // Recycle arrays in the hash
    for (i in hash) {
      group = hash[i];
      for (j in group) {
        putArray(group[j]);
        delete group[j];
      }
      delete hash[i];
    }
  }

  /**
   * Remove all colliders and collision groups.
   * @memberof SystemPhysics#
   * @method cleanup
   */
  cleanup() {
    this.colliders.length = 0;
  }

  /**
   * Callback that will be invoked on each entity spawn.
   * @memberof SystemPhysics#
   * @method onEntitySpawn
   * @param  {Entity} ent Entity instance
   */
  onEntitySpawn(ent) {
    if (ent.coll) {
      this.addCollider(ent.coll);
    }
  }
  /**
   * Callback that will be invoked on each entity remove.
   * @memberof SystemPhysics#
   * @method onEntityRemove
   * @param  {Entity} ent Entity instance
   */
  onEntityRemove(ent) {
    if (ent.coll) {
      ent.coll.remove();
    }
  }
}

module.exports = SystemPhysics;

/**
 * Get a collision group by index
 * @memberof module:engine/physics
 * @param  {Number} idx Index of the group.
 * @return {Number}     Group mask
 */
module.exports.getGroupMask = function(idx) {
  if (idx < 31) {
    return 1 << idx;
  }
  else {
    console.log('Warning: only 0-30 indexed collision group is supported!');
    return 0;
  }
};
