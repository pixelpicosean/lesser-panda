var Vector = require('engine/vector');
var Scene = require('engine/scene');
var utils = require('engine/utils');

var SpatialHash = require('./spatial-hash');

var config = require('game/config').default.physics;

// Constants
var ESP = 0.000001;

var UP =      1;
var DOWN =    2;
var LEFT =    4;
var RIGHT =   8;
var OVERLAP = 16;

function eq(a, b) {
  return (a < b) ? (b - a < ESP) : (a - b < ESP);
}
function lte(a, b) {
  return (a < b) || eq(a, b);
}
function gte(a, b) {
  return (a > b) || eq(b, a);
}

// Shapes
var BOX = 0;
var CIRC = 1;
var POLY = 2;

// Array Remove - By John Resig (MIT Licensed)
function remove(arr, from, to) {
  var rest = arr.slice((to || from) + 1 || arr.length);
  arr.length = from < 0 ? arr.length + from : from;
  return arr.push.apply(arr, rest);
};

function erase(arr, obj) {
  var idx = arr.indexOf(obj);
  if (idx !== -1) {
    remove(arr, idx);
  }
};

// Update bounds of a Box body on last frame
function updateBounds(body) {
  body._lastLeft = body.last.x - body.shape.width * body.anchor.x;
  body._lastRight = body._lastLeft + body.shape.width;
  body._lastTop = body.last.y - body.shape.height * body.anchor.y;
  body._lastBottom = body._lastTop + body.shape.height;

  body._left = body.position.x - body.shape.width * body.anchor.x;
  body._right = body._left + body.shape.width;
  body._top = body.position.y - body.shape.height * body.anchor.y;
  body._bottom = body._top + body.shape.height;

  body._center.set(body.position.x + body.shape.width * (0.5 - body.anchor.x), body.position.y + body.shape.height * (0.5 - body.anchor.y));
}

/**
  Physics world.
  @class World
  @constructor
  @param {Number} [x] Gravity x
  @param {Number} [y] Gravity y
**/
function World(x, y) {
  /**
   * Gravity of physics world.
   * @property {Vector} gravity
   * @default 0, 980
  */
  this.gravity = Vector.create(x || 0, y || 980);
  /**
   * Spatial hash instance
   * @type {SpatialHash}
   */
  this.tree = new SpatialHash(config.spatialFactor);
  /**
   * Collision solver instance
   */
  this.solver = (config.solver === 'SAT') ? new SATSolver() : new AABBSolver();
  this.response = new Response();
  /**
   * List of bodies in world.
   * @property {Array} bodies
   */
  this.bodies = [];
  /**
   * List of collision groups.
   * @property {Object} collisionGroups
   */
  this.collisionGroups = {};
  /**
   * Save whether collision of a pair of objects are checked
   * @type {Object}
   */
  this.checks = {};

  /**
   * How many pair of bodies have been checked in this frame
   * @type {Number}
   */
  this.collisionChecks = 0;
}

/**
 * Add body to world.
 * @method addBody
 * @param {Body} body
 */
World.prototype.addBody = function addBody(body) {
  body.world = this;
  body._remove = false;
  if (this.bodies.indexOf(body) === -1) {
    this.bodies.push(body);
  }
  this.addBodyCollision(body);
};

/**
  Remove body from world.
  @method removeBody
  @param {Body} body
**/
World.prototype.removeBody = function removeBody(body) {
  if (!body.world) return;
  body.world = null;
  body._remove = true;
};

/**
  Add body to collision group.
  @method addBodyCollision
  @param {Body} body
**/
World.prototype.addBodyCollision = function addBodyCollision(body) {
  if (typeof body.collisionGroup !== 'number') return;
  this.collisionGroups[body.collisionGroup] = this.collisionGroups[body.collisionGroup] || [];
  if (this.collisionGroups[body.collisionGroup].indexOf(body) !== -1) return;
  this.collisionGroups[body.collisionGroup].push(body);
};

/**
  Remove body from collision group.
  @method removeBodyCollision
  @param {Body} body
**/
World.prototype.removeBodyCollision = function removeBodyCollision(body) {
  if (typeof body.collisionGroup !== 'number') return;
  if (!this.collisionGroups[body.collisionGroup]) return;
  if (this.collisionGroups[body.collisionGroup].indexOf(body) === -1) return;
  erase(this.collisionGroups[body.collisionGroup], body);
};

/**
  Collide body against it's `collideAgainst` groups.
  @method collide
  @param {Body} body
**/
World.prototype.collide = function collide(body) {
  var g, i, b, group;
  var key;

  // Before each collision detection
  body.beforeCollide();

  // Broad phase using spatial hash?
  if (config.broadPhase === 'SpatialHash') {
    group = this.tree.retrieve(body);

    for (i = 0; i < group.length; i++) {
      b = group[i];

      // Should not collide with each other
      if (b === body || ((body.collideAgainst & b.collisionGroup) === 0))
        continue;

      // Already checked?
      key = '' + body.id + ':' + b.id;
      if (this.checks[key])
        continue;

      this.collisionChecks++;

      // Now this pair is checked
      this.checks[key] = true;

      // Clearn reponse instance
      this.response.clear();
      // Test collision
      if (this.solver.hitTest(body, b, this.response)) {
        // Apply response
        if (this.solver.hitResponse(body, b, true, ((b.collideAgainst & body.collisionGroup) === body.collisionGroup), this.response)) {
          body.afterCollide(b);
        }
      }
    }
  }
  // Or simple brute force
  else {
    for (g = 0; g < body.collideAgainst.length; g++) {
      group = this.collisionGroups[body.collideAgainst[g]];

      if (!group) continue;

      for (i = group.length - 1; i >= 0; i--) {
        if (!group) break;
        b = group[i];
        if (body !== b) {
          // Clearn reponse instance
          this.response.clear();
          // Test collision
          if (this.solver.hitTest(body, b, this.response)) {
            // Apply response
            if (this.solver.hitResponse(body, b, true, (b.collideAgainst.indexOf(body.collisionGroup) !== -1), this.response)) {
              body.afterCollide(b);
            }
          }
        }
      }
    }
  }
};

/**
  Update physics world.
  @method update
**/
World.prototype.preUpdate = function preUpdate(delta) {
  var i;
  for (i = 0; i < this.bodies.length; i++) {
    if (this.bodies[i]._remove) {
      this.removeBodyCollision(this.bodies[i]);
      utils.removeItems(this.bodies, i, 1);
    }
    else {
      this.bodies[i].last.copy(this.bodies[i].position);
    }
  }

  if (config.broadPhase === 'SpatialHash') {
    this.tree.clear();
    this.checks = {};
  }
};

/**
  Update physics world.
  @method update
**/
World.prototype.update = function update(delta) {
  var i, j, body;
  var useSpatialHash = config.broadPhase === 'SpatialHash';
  for (i = 0; i < this.bodies.length; i++) {
    body = this.bodies[i];
    body.update(delta);

    if (useSpatialHash) {
      this.tree.insert(body);
    }
  }

  for (i in this.collisionGroups) {
    // Remove empty collision group
    if (this.collisionGroups[i].length === 0) {
      delete this.collisionGroups[i];
      continue;
    }

    for (j = this.collisionGroups[i].length - 1; j >= 0; j--) {
      if (useSpatialHash) {
        if (this.collisionGroups[i][j] && this.collisionGroups[i][j].collideAgainst > 0) {
          this.collide(this.collisionGroups[i][j]);
        }
      }
      else {
        if (this.collisionGroups[i][j] && this.collisionGroups[i][j].collideAgainst.length > 0) {
          this.collide(this.collisionGroups[i][j]);
        }
      }
    }
  }
};

World.prototype.cleanup = function cleanup() {
  this.bodies.length = 0;
  this.collisionGroups = {};
};

/**
  Physics collision solver.
  @class AABBSolver
**/
function AABBSolver() {}

/**
  Hit test a versus b.
  @method hitTest
  @param {Body} a
  @param {Body} b
  @return {Boolean} return true, if bodies hit.
**/
AABBSolver.prototype.hitTest = function hitTest(a, b) {
  // Skip when shape is not available
  if (!a.shape || !b.shape) return false;

  if (a.shape.type === BOX && b.shape.type === BOX) {
    return !(
      a._bottom <= b._top ||
      a._top >= b._bottom ||
      a._left >= b._right ||
      a._right <= b._left
    );
  }

  if (a.shape.type === CIRC && b.shape.type === CIRC) {
    // AABB overlap
    if (!(
      a._bottom <= b._top ||
      a._top >= b._bottom ||
      a._left >= b._right ||
      a._right <= b._left)) {
      return a.position.squaredDistance(b.position) < (a.shape.radius + b.shape.radius) * (a.shape.radius + b.shape.radius);
    }

    return false;
  }

  if ((a.shape.type === BOX && b.shape.type === CIRC) || (a.shape.type === CIRC && b.shape.type === BOX)) {
    var box = (a.shape.type === BOX) ? a : b;
    var circle = (a.shape.type === CIRC) ? a : b;

    // AABB overlap
    if (!(a._bottom <= b._top ||
      a._top >= b._bottom ||
      a._left >= b._right ||
      a._right <= b._left)) {

      var distX = circle._center.x - utils.clamp(circle._center.x, box._left, box._right);
      var distY = circle._center.y - utils.clamp(circle._center.y, box._top, box._bottom);

      return (distX * distX + distY * distY) < (circle.shape.radius * circle.shape.radius);
    }
  }

  return false;
};

/**
  Hit response a versus b.
  @method hitResponse
  @param {Body} a
  @param {Body} b
  @return {Boolean}
**/
AABBSolver.prototype.hitResponse = function hitResponse(a, b) {
  if (a.shape.type === BOX && b.shape.type === BOX ||
    a.shape.type === BOX && b.shape.type === CIRC ||
    a.shape.type === CIRC && b.shape.type === BOX) {
    if (lte(a._lastBottom, b._lastTop)) {
      if (a.collide(b, DOWN)) {
        a.position.y = b.position.y - b.shape.height * b.anchor.y - a.shape.height * (1 - a.anchor.y);
        return true;
      }
    }
    else if (gte(a._lastTop, b._lastBottom)) {
      if (a.collide(b, UP)) {
        a.position.y = b.position.y + b.shape.height * (1 - b.anchor.y) + a.shape.height * a.anchor.y;
        return true;
      }
    }
    else if (lte(a._lastRight, b._lastLeft)) {
      if (a.collide(b, RIGHT)) {
        a.position.x = b.position.x - b.shape.width * b.anchor.x - a.shape.width * (1 - a.anchor.x);
        return true;
      }
    }
    else if (gte(a._lastLeft, b._lastRight)) {
      if (a.collide(b, LEFT)) {
        a.position.x = b.position.x + b.shape.width * (1 - b.anchor.x) + a.shape.width * a.anchor.x;
        return true;
      }
    }
    else {
      // Overlap
      if (a.collide(b, OVERLAP)) return true;
    }

    return false;
  }
  else if (a.shape.type === CIRC && b.shape.type === CIRC) {
    var angle = b.position.angle(a.position);
    if (a.collide(b, angle)) {
      var dist = a.shape.radius + b.shape.radius;
      a.position.x = b.position.x + Math.cos(angle) * dist;
      a.position.y = b.position.y + Math.sin(angle) * dist;
      return true;
    }
  }
};

/**
  Physics body.
  @class Body
  @constructor
  @param {Object} [properties]
**/
function Body(properties) {
  this.id = Body.uid++;
  /**
    Body's physic world.
    @property {World} world
  **/
  this.world = null;
  /**
    Body's shape.
    @property {Box|Circle} shape
  **/
  this.shape = null;
  /**
    Position of body.
    @property {Vector} position
  **/
  this.position = Vector.create();
  /**
   * Anchor of the shape.
   * @type {Vector} anchor
   * @default (0.5, 0.5)
   */
  this.anchor = Vector.create(0.5);
  /**
    Last position of body.
    @property {Vector} last
  **/
  this.last = Vector.create();
  /**
    Body's velocity.
    @property {Vector} velocity
  **/
  this.velocity = Vector.create();
  /**
    Body's maximum velocity.
    @property {Vector} velocityLimit
    @default 400, 400
  **/
  this.velocityLimit = Vector.create(400, 400);
  /**
    Body's mass.
    @property {Number} mass
    @default 0
  **/
  this.mass = 0;
  /**
    Body's collision group.
    @property {Number} collisionGroup
    @default null
  **/
  this.collisionGroup = null;
  /**
   * Collision groups that this body collides against.
   * Note: this will be a Number when broadPhase is "SpatialHash",
   *   but will be an Array while using "Simple".
   * @property {Array|Number} collideAgainst
   */
  this.collideAgainst = 0;
  /**
    Body's force.
    @property {Vector} force
    @default 0,0
  **/
  this.force = Vector.create();
  /**
    Body's damping. Should be number between 0 and 1.
    @property {Number} damping
    @default 0
  **/
  this.damping = 0;

  // Internal caches
  this._center = Vector.create();

  this._left = 0;
  this._right = 0;
  this._top = 0;
  this._bottom = 0;

  this._lastLeft = 0;
  this._lastRight = 0;
  this._lastTop = 0;
  this._lastBottom = 0;

  Object.assign(this, properties);

  if (config.solver === 'SAT' && this.shape.type === BOX) {
    this.shape = this.shape.toPolygon();
  }
  if (config.broadPhase === 'SpatialHash') {
    if (Array.isArray(this.collideAgainst)) {
      this.setCollideAgainst(this.collideAgainst);
    }
  }
  else {
    this.collideAgainst = this.collideAgainst || [];
  }
}
Body.uid = 0;

Object.defineProperty(Body.prototype, 'rotation', {
  get: function() {
    return this.shape ? this.shape.rotation : 0;
  },
  set: function(rotation) {
    this.shape && (this.shape.rotation = rotation);
  },
});

/**
 * This will be called before collision checking.
 * You can clean up collision related flags here.
 */
Body.prototype.beforeCollide = function beforeCollide() {};

/**
  This is called, when body collides with another body.
  @method collide
  @param {Body} body body that it collided with.
  @return {Boolean} Return true, to apply hit response.
**/
Body.prototype.collide = function collide() {
  return true;
};

/**
  This is called after hit response.
  @method afterCollide
  @param {Body} bodyB body that it collided with.
**/
Body.prototype.afterCollide = function afterCollide() {};

/**
  Set new collision group for body.
  @method setCollisionGroup
  @param {Number} group
**/
Body.prototype.setCollisionGroup = function setCollisionGroup(group) {
  if (this.world && typeof this.collisionGroup === 'number') this.world.removeBodyCollision(this);
  this.collisionGroup = group;
  if (this.world) this.world.addBodyCollision(this);
};

/**
 * Set body's collideAgainst groups.
 * @method setCollideAgainst
 * @param {Array} groups
 */
Body.prototype.setCollideAgainst = function setCollideAgainst(groups) {
  // TODO: warning when groups are not array
  if (config.broadPhase === 'SpatialHash') {
    this.collideAgainst = 0;
    for (var i = 0; i < groups.length; i++) {
      this.collideAgainst |= groups[i];
    }
  }
  else {
    this.collideAgainst = groups;
  }
};

/**
  Add body to world.
  @method addTo
  @param {World} world
**/
Body.prototype.addTo = function addTo(world) {
  if (this.world) return;
  world.addBody(this);
  return this;
};

/**
  Remove body from it's world.
  @method remove
**/
Body.prototype.remove = function remove() {
  if (this.world) this.world.removeBody(this);
};

/**
  Remove collision from body.
  @method removeCollision
**/
Body.prototype.removeCollision = function removeCollision() {
  if (this.world) this.world.removeBodyCollision(this);
};

/**
  @method update
**/
Body.prototype.update = function update(delta) {
  if (!this.world) return;

  if (this.mass !== 0) {
    this.velocity.add(
      this.world.gravity.x * this.mass * delta,
      this.world.gravity.y * this.mass * delta
    );
  }

  this.velocity.add(this.force.x * delta, this.force.y * delta);
  if (this.damping > 0 && this.damping < 1) this.velocity.multiply(Math.pow(1 - this.damping, delta));

  if (this.velocityLimit.x > 0) this.velocity.x = utils.clamp(this.velocity.x, -this.velocityLimit.x, this.velocityLimit.x);
  if (this.velocityLimit.y > 0) this.velocity.y = utils.clamp(this.velocity.y, -this.velocityLimit.y, this.velocityLimit.y);

  this.position.add(this.velocity.x * delta, this.velocity.y * delta);

  if (this.shape) {
    updateBounds(this);
  }
};

function Polygon(points) {
  this.width = 1;
  this.height = 1;

  this.points = [];
  this.calcPoints = [];

  this.edges = [];
  this.normals = [];

  this.offset = new Vector();

  this._rotation = 0;

  this.setPoints(points || []);
}
/**
 * Set the points of the polygon.
 * @param {Array<Vector>=} points An array of vectors representing the points in the polygon,
 *   in clockwise order
 * @return {Polygon} This for chaining
 */
Polygon.prototype.setPoints = function setPoints(points) {
  // Only re-allocate if this is a new polygon or the number of points has changed.
  var lengthChanged = !this.points || this.points.length !== points.length;
  if (lengthChanged) {
    var calcPoints = this.calcPoints = [];
    var edges = this.edges = [];
    var normals = this.normals = [];
    // Allocate the vector arrays for the calculated properties
    for (var i = 0, len = points.length; i < len; i++) {
      calcPoints.push(new Vector());
      edges.push(new Vector());
      normals.push(new Vector());
    }
  }
  this.points = points;
  this._recalc();
  return this;
};
/**
 * Set the current offset to apply to the `points` before applying the `rotation` rotation.
 * @param {Vector} offset The new offset vector
 * @return {Polygon} This for chaining
 */
Polygon.prototype.setOffset = function setOffset(offset) {
  this.offset = offset;
  this._recalc();
  return this;
};
/**Rotates this polygon counter-clockwise around the origin of *its local coordinate system* (i.e. `pos`).
 * Note: This changes the **original** points (so any `rotation` will be applied on top of this rotation).
 * @param {Number} rotation The rotation to rotate (in radians)
 * @return {Polygon} This for chaining
 */
Polygon.prototype.rotate = function rotate(rotation) {
  var points = this.points;
  for (var i = 0, len = points.length; i < len; i++) {
    points[i].rotate(rotation);
  }
  this._recalc();
  return this;
};
/**
 * Translates the points of this polygon by a specified amount relative to the origin of *its own coordinate
 * system* (i.e. `body.position`)
 * This is most useful to change the "center point" of a polygon. If you just want to move the whole polygon, change
 * the coordinates of `body.position`.
 * Note: This changes the **original** points (so any `offset` will be applied on top of this translation)
 * @param {Number} x The horizontal amount to translate
 * @param {Number} y The vertical amount to translate
 * @return {Polygon} This for chaining
 */
Polygon.prototype.translate = function translate(x, y) {
  var points = this.points;
  for (var i = 0, len = points.length; i < len; i++) {
    points[i].x += x;
    points[i].y += y;
  }
  this._recalc();
  return this;
};
/**
 * Computes the calculated collision polygon. Applies the `rotation` and `offset` to the original points then recalculates the
 * edges and normals of the collision polygon.
 * @return {Polygon} This for chaining
 */
Polygon.prototype._recalc = function _recalc() {
  // Calculated points - this is what is used for underlying collisions and takes into account
  // the rotation/offset set on the polygon.
  var calcPoints = this.calcPoints;
  // The edges here are the direction of the `n`th edge of the polygon, relative to
  // the `n`th point. If you want to draw a given edge from the edge value, you must
  // first translate to the position of the starting point.
  var edges = this.edges;
  // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
  // to the position of the `n`th point. If you want to draw an edge normal, you must first
  // translate to the position of the starting point.
  var normals = this.normals;
  // Copy the original points array and apply the offset/rotation
  var points = this.points;
  var offset = this.offset;
  var rotation = this._rotation;
  var len = points.length;
  var i;
  var left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (i = 0; i < len; i++) {
    var calcPoint = calcPoints[i].copy(points[i]);
    calcPoint.x += offset.x;
    calcPoint.y += offset.y;
    if (rotation !== 0) {
      calcPoint.rotate(rotation);
    }

    // Update AABB info
    left = Math.min(left, calcPoint.x);
    top = Math.min(top, calcPoint.y);
    right = Math.max(right, calcPoint.x);
    bottom = Math.max(bottom, calcPoint.y);
  }

  // Calculate the edges/normals
  for (i = 0; i < len; i++) {
    var p1 = calcPoints[i];
    var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
    var e = edges[i].copy(p2).subtract(p1);
    normals[i].copy(e).perp().normalize();
  }

  // Calculate size
  this.width = right - left;
  this.height = bottom - top;

  return this;
};
Object.defineProperty(Polygon.prototype, 'rotation', {
  get: function() {
    return this._rotation;
  },
  set: function(rotation) {
    this._rotation = rotation;
    this._recalc();
  },
});

/**
  Box shape for physic body.
  @class Box
  @constructor
  @param {Number} [width]
  @param {Number} [height]
**/
function Box(width, height) {
  /**
    Width of rectangle.
    @property {Number} width
    @default 50
  **/
  this.width = width || 50;
  /**
    Height of rectangle.
    @property {Number} height
    @default 50
  **/
  this.height = height || 50;

  this.rotation = 0;

  this.type = BOX;
}
Box.prototype.toPolygon = function toPolygon() {
  var halfWidth = this.width * 0.5;
  var halfHeight = this.height * 0.5;
  return new Polygon([
    new Vector(-halfWidth, -halfHeight), new Vector(halfWidth, -halfHeight),
    new Vector(halfWidth, halfHeight), new Vector(-halfWidth, halfHeight)
  ]);
};

/**
  Circle shape for physic body.
  @class Circle
  @constructor
  @param {Number} [radius]
**/
function Circle(radius) {
  /**
    Radius of circle.
    @property {Number} radius
    @default 50
  **/
  this.radius = radius || 50;

  this.rotation = 0;

  this.type = CIRC;
}
Object.defineProperty(Circle.prototype, 'width', {
  get: function() {
    return this.radius * 2;
  },
});
Object.defineProperty(Circle.prototype, 'height', {
  get: function() {
    return this.radius * 2;
  },
});

/**
 * Response
 * An object representing the result of an intersection. Contains:
 * - The two objects participating in the intersection
 * - The vector representing the minimum change necessary to extract the first object
 *   from the second one (as well as a unit vector in that direction and the magnitude
 *   of the overlap)
 * - Whether the first object is entirely inside the second, and vice versa.
 */
function Response () {
  /**
   * The first object in the collision.
   * It will be **self body** when passed to `collide` method.
   * @type {Body}
   */
  this.a = null;
  /**
   * The second object in the collision.
   * @type {Body}
   */
  this.b = null;
  /**
   * Whether the first object is completely inside the second.
   * Self inside another one?
   * @type {Boolean}
   */
  this.aInB = true;
  /**
   * Whether the second object is completely inside the first
   * @type {Boolean}
   */
  this.bInA = true;
  /**
   * Magnitude of the overlap on the shortest colliding axis
   * @type {Number}
   */
  this.overlap = Number.MAX_VALUE;
  /**
   * The shortest colliding axis (unit-vector).
   * This vector points from **self body** to the overlapped one.
   * @type {Vector}
   */
  this.overlapN = new Vector();
  /**
   *  The overlap vector (i.e. overlapN.multiply(overlap, overlap)).
   *  If this vector is subtracted from the position of a,
   *  a and b will no longer be colliding.
   * @type {Vector}
   */
  this.overlapV = new Vector();
}
/**
 * Set some values of the response back to their defaults.  Call this between tests if
 * you are going to reuse a single Response object for multiple intersection tests (recommented
 * as it will avoid allcating extra memory)
 * @return {Response} This for chaining
 */
Response.prototype.clear = function clear() {
  this.aInB = true;
  this.bInA = true;
  this.overlap = Number.MAX_VALUE;
  return this;
};

/**
 * SAT based collision solver
 */
function SATSolver() {}
/**
 * Hit test a versus b.
 * @method hitTest
 * @param {Body} a
 * @param {Body} b
 * @return {Boolean} return true, if bodies hit.
 */
SATSolver.prototype.hitTest = function hitTest(a, b, response) {
  // Polygon vs polygon
  if (a.shape.points && b.shape.points) {
    return testPolygonPolygon(a, b, response);
  }
  if (a.shape.radius && b.shape.radius) {
    return testCircleCircle(a, b, response);
  }
  if (a.shape.points && b.shape.radius) {
    return testPolygonCircle(a, b, response);
  }
  else if (a.shape.radius && b.shape.points) {
    return testCirclePolygon(a, b, response);
  }

  throw 'Hit test should not go so far!';

  return false;
};
SATSolver.prototype.hitResponse = function hitResponse(a, b, AvsB, BvsA, response) {
  // Make sure a and b are not reversed
  var uniqueA = (a === response.a ? a : b),
    uniqueB = (b === response.b ? b : a);
  var responseToA = false,
    responseToB = false;
  // Check to see which one or two finally get the response
  if (AvsB && !BvsA) {
    responseToA = uniqueA.collide(uniqueB, response);
  }
  else if (!AvsB && BvsA) {
    responseToB = uniqueB.collide(uniqueA, response);
  }
  else if (AvsB && BvsA) {
    responseToA = uniqueA.collide(uniqueB, response);
    responseToB = uniqueB.collide(uniqueA, response);
  }

  // Only apply response to A if it wants to
  if (responseToA && !responseToB) {
    uniqueA.position.subtract(response.overlapV);
    uniqueA.afterCollide(uniqueB);
  }
  // Only apply response to B if it wants to
  else if (!responseToA && responseToB) {
    uniqueB.position.add(response.overlapV);
    uniqueB.afterCollide(uniqueA);
  }
  // Apply response to both A and B
  else if (responseToA && responseToB) {
    response.overlapV.multiply(0.5);
    uniqueA.position.subtract(response.overlapV);
    uniqueB.position.add(response.overlapV);
    uniqueA.afterCollide(uniqueB);
    uniqueB.afterCollide(uniqueA);
  }
};

// Helper Functions ------------------------------------

/**
 * Flattens the specified array of points onto a unit vector axis,
 * resulting in a one dimensional range of the minimum and
 * maximum value on that axis.
 * @param {Array<Vector>} points The points to flatten
 * @param {Vector} normal The unit vector axis to flatten on
 * @param {Array<Number>} result An array.  After calling this function,
 *   result[0] will be the minimum value,
 *   result[1] will be the maximum value
 */
function flattenPointsOn(points, normal, result) {
  var min = Number.MAX_VALUE;
  var max = -Number.MAX_VALUE;
  var len = points.length;
  for (var i = 0; i < len; i++) {
    // The magnitude of the projection of the point onto the normal
    var dot = points[i].dot(normal);
    if (dot < min) { min = dot; }
    if (dot > max) { max = dot; }
  }
  result[0] = min; result[1] = max;
}

/**
 * Check whether two convex polygons are separated by the specified
 * axis (must be a unit vector).
 * @param {Vector} aPos The position of the first polygon
 * @param {Vector} bPos The position of the second polygon
 * @param {Array<Vector>} aPoints The points in the first polygon
 * @param {Array<Vector>} bPoints The points in the second polygon
 * @param {Vector} axis The axis (unit sized) to test against. The points of both polygons
 *   will be projected onto this axis
 * @param {Response=} response A Response object (optional) which will be populated
 *   if the axis is not a separating axis
 * @return {Boolean} true if it is a separating axis, false otherwise.  If false,
 *   and a response is passed in, information about how much overlap and
 *   the direction of the overlap will be populated
 */
function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
  var rangeA = T_ARRAYS.pop();
  var rangeB = T_ARRAYS.pop();
  // The magnitude of the offset between the two polygons
  var offsetV = T_VECTORS.pop().copy(bPos).subtract(aPos);
  var projectedOffset = offsetV.dot(axis);
  // Project the polygons onto the axis.
  flattenPointsOn(aPoints, axis, rangeA);
  flattenPointsOn(bPoints, axis, rangeB);
  // Move B's range to its position relative to A.
  rangeB[0] += projectedOffset;
  rangeB[1] += projectedOffset;
  // Check if there is a gap. If there is, this is a separating axis and we can stop
  if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
    T_VECTORS.push(offsetV);
    T_ARRAYS.push(rangeA);
    T_ARRAYS.push(rangeB);
    return true;
  }
  // This is not a separating axis. If we're calculating a response, calculate the overlap.
  if (response) {
    var overlap = 0;
    // A starts further left than B
    if (rangeA[0] < rangeB[0]) {
      response.aInB = false;
      // A ends before B does. We have to pull A out of B
      if (rangeA[1] < rangeB[1]) {
        overlap = rangeA[1] - rangeB[0];
        response.bInA = false;
        // B is fully inside A.  Pick the shortest way out.
      }
      else {
        var option1 = rangeA[1] - rangeB[0];
        var option2 = rangeB[1] - rangeA[0];
        overlap = option1 < option2 ? option1 : -option2;
      }
    // B starts further left than A
    }
    else {
      response.bInA = false;
      // B ends before A ends. We have to push A out of B
      if (rangeA[1] > rangeB[1]) {
        overlap = rangeA[0] - rangeB[1];
        response.aInB = false;
      // A is fully inside B.  Pick the shortest way out.
      }
      else {
        var option1 = rangeA[1] - rangeB[0];
        var option2 = rangeB[1] - rangeA[0];
        overlap = option1 < option2 ? option1 : -option2;
      }
    }
    // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
    var absOverlap = Math.abs(overlap);
    if (absOverlap < response.overlap) {
      response.overlap = absOverlap;
      response.overlapN.copy(axis);
      if (overlap < 0) {
        response.overlapN.reverse();
      }
    }
  }
  T_VECTORS.push(offsetV);
  T_ARRAYS.push(rangeA);
  T_ARRAYS.push(rangeB);
  return false;
}

/**
 * Calculates which Vornoi region a point is on a line segment.
 * It is assumed that both the line and the point are relative to `(0,0)`
 *            |       (0)      |
 *     (-1)  [S]--------------[E]  (1)
 *            |       (0)      |
 * @param {Vector} line The line segment
 * @param {Vector} point The point
 * @return {number} LEFT_VORNOI_REGION (-1) if it is the left region,
 *         MIDDLE_VORNOI_REGION (0) if it is the middle region,
 *         RIGHT_VORNOI_REGION (1) if it is the right region
 */
function vornoiRegion(line, point) {
  var len2 = line.squaredLength();
  var dp = point.dot(line);
  // If the point is beyond the start of the line, it is in the
  // left vornoi region.
  if (dp < 0) { return LEFT_VORNOI_REGION; }
  // If the point is beyond the end of the line, it is in the
  // right vornoi region.
  else if (dp > len2) { return RIGHT_VORNOI_REGION; }
  // Otherwise, it's in the middle one.
  else { return MIDDLE_VORNOI_REGION; }
}
// Constants for Vornoi regions
var LEFT_VORNOI_REGION = -1;
var MIDDLE_VORNOI_REGION = 0;
var RIGHT_VORNOI_REGION = 1;

// Collision Tests ---------------------------------------

/**
 * Check if two circles collide.
 * @param {Body} a The first circle body
 * @param {Body} b The second circle body
 * @param {Response=} response Response object (optional) that will be populated if
 *   the circles intersect
 * @return {Boolean} true if the circles intersect, false if they don't
 */
function testCircleCircle(a, b, response) {
  // Check if the distance between the centers of the two
  // circles is greater than their combined radius.
  var differenceV = T_VECTORS.pop().copy(b.position).subtract(a.position);
  var totalRadius = a.shape.radius + b.shape.radius;
  var totalRadiusSq = totalRadius * totalRadius;
  var distanceSq = differenceV.squaredLength();
  // If the distance is bigger than the combined radius, they don't intersect.
  if (distanceSq > totalRadiusSq) {
    T_VECTORS.push(differenceV);
    return false;
  }
  // They intersect.  If we're calculating a response, calculate the overlap.
  if (response) {
    var dist = Math.sqrt(distanceSq);
    response.a = a;
    response.b = b;
    response.overlap = totalRadius - dist;
    response.overlapN.copy(differenceV.normalize());
    response.overlapV.copy(differenceV).multiply(response.overlap);
    response.aInB = a.shape.radius <= b.shape.radius && dist <= b.shape.radius - a.shape.radius;
    response.bInA = b.shape.radius <= a.shape.radius && dist <= a.shape.radius - b.shape.radius;
  }
  T_VECTORS.push(differenceV);
  return true;
}

/**
 * Check if a polygon and a circle collide.
 * @param {Polygon} polygon The polygon
 * @param {Circle} circle The circle
 * @param {Response=} response Response object (optional) that will be populated if
 *   they interset
 * @return {Boolean} true if they intersect, false if they don't
 */
function testPolygonCircle(polygon, circle, response) {
  // Get the position of the circle relative to the polygon.
  var circlePos = T_VECTORS.pop().copy(circle.position).subtract(polygon.position);
  var radius = circle.shape.radius;
  var radius2 = radius * radius;
  var points = polygon.shape.calcPoints;
  var len = points.length;
  var edge = T_VECTORS.pop();
  var point = T_VECTORS.pop();

  // For each edge in the polygon:
  for (var i = 0; i < len; i++) {
    var next = i === len - 1 ? 0 : i + 1;
    var prev = i === 0 ? len - 1 : i - 1;
    var overlap = 0;
    var overlapN = null;

    // Get the edge.
    edge.copy(polygon.shape.edges[i]);
    // Calculate the center of the circle relative to the starting point of the edge.
    point.copy(circlePos).subtract(points[i]);

    // If the distance between the center of the circle and the point
    // is bigger than the radius, the polygon is definitely not fully in
    // the circle.
    if (response && point.squaredLength() > radius2) {
      response.aInB = false;
    }

    // Calculate which Vornoi region the center of the circle is in.
    var region = vornoiRegion(edge, point);
    // If it's the left region:
    if (region === LEFT_VORNOI_REGION) {
      // We need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge.
      edge.copy(polygon.shape.edges[prev]);
      // Calculate the center of the circle relative the starting point of the previous edge
      var point2 = T_VECTORS.pop().copy(circlePos).subtract(points[prev]);
      region = vornoiRegion(edge, point2);
      if (region === RIGHT_VORNOI_REGION) {
        // It's in the region we want.  Check if the circle intersects the point.
        var dist = point.length();
        if (dist > radius) {
          // No intersection
          T_VECTORS.push(circlePos);
          T_VECTORS.push(edge);
          T_VECTORS.push(point);
          T_VECTORS.push(point2);
          return false;
        }
        else if (response) {
          // It intersects, calculate the overlap.
          response.bInA = false;
          overlapN = point.normalize();
          overlap = radius - dist;
        }
      }
      T_VECTORS.push(point2);
    }
    // If it's the right region:
    else if (region === RIGHT_VORNOI_REGION) {
      // We need to make sure we're in the left region on the next edge
      edge.copy(polygon.shape.edges[next]);
      // Calculate the center of the circle relative to the starting point of the next edge.
      point.copy(circlePos).subtract(points[next]);
      region = vornoiRegion(edge, point);
      if (region === LEFT_VORNOI_REGION) {
        // It's in the region we want.  Check if the circle intersects the point.
        var dist = point.length();
        if (dist > radius) {
          // No intersection
          T_VECTORS.push(circlePos);
          T_VECTORS.push(edge);
          T_VECTORS.push(point);
          return false;
        }
        else if (response) {
          // It intersects, calculate the overlap.
          response.bInA = false;
          overlapN = point.normalize();
          overlap = radius - dist;
        }
      }
    }
    // Otherwise, it's the middle region:
    else {
      // Need to check if the circle is intersecting the edge,
      // Change the edge into its "edge normal".
      var normal = edge.perp().normalize();
      // Find the perpendicular distance between the center of the
      // circle and the edge.
      var dist = point.dot(normal);
      var distAbs = Math.abs(dist);
      // If the circle is on the outside of the edge, there is no intersection.
      if (dist > 0 && distAbs > radius) {
        // No intersection
        T_VECTORS.push(circlePos);
        T_VECTORS.push(normal);
        T_VECTORS.push(point);
        return false;
      }
      else if (response) {
        // It intersects, calculate the overlap.
        overlapN = normal;
        overlap = radius - dist;
        // If the center of the circle is on the outside of the edge, or part of the
        // circle is on the outside, the circle is not fully inside the polygon.
        if (dist >= 0 || overlap < 2 * radius) {
          response.bInA = false;
        }
      }
    }

    // If this is the smallest overlap we've seen, keep it.
    // (overlapN may be null if the circle was in the wrong Vornoi region).
    if (overlapN && response && Math.abs(overlap) < Math.abs(response.overlap)) {
      response.overlap = overlap;
      response.overlapN.copy(overlapN);
    }
  }

  // Calculate the final overlap vector - based on the smallest overlap.
  if (response) {
    response.a = polygon;
    response.b = circle;
    response.overlapV.copy(response.overlapN).multiply(response.overlap);
  }
  T_VECTORS.push(circlePos);
  T_VECTORS.push(edge);
  T_VECTORS.push(point);
  return true;
}

/**
 * Check if a circle and a polygon collide.
 *
 * **NOTE:** This is slightly less efficient than polygonCircle as it just
 * runs polygonCircle and reverses everything at the end.
 *
 * @param {Circle} circle The circle
 * @param {Polygon} polygon The polygon
 * @param {Response=} response Response object (optional) that will be populated if
 *   they interset
 * @return {Boolean} true if they intersect, false if they don't
 */
function testCirclePolygon(circle, polygon, response) {
  // Test the polygon against the circle.
  var result = testPolygonCircle(polygon, circle, response);
  if (result && response) {
    // Swap A and B in the response.
    var a = response.a;
    var aInB = response.aInB;
    response.overlapN.reverse();
    response.overlapV.reverse();
    response.a = response.b;
    response.b = a;
    response.aInB = response.bInA;
    response.bInA = aInB;
  }
  return result;
}

/**
 * Checks whether polygons collide.
 * @param {Polygon} a The first polygon
 * @param {Polygon} b The second polygon
 * @param {Response=} response Response object (optional) that will be populated if
 *   they interset
 * @return {Boolean} true if they intersect, false if they don't
 */
function testPolygonPolygon(a, b, response) {
  var aPoints = a.shape.calcPoints;
  var aLen = aPoints.length;
  var bPoints = b.shape.calcPoints;
  var bLen = bPoints.length;
  // If any of the edge normals of A is a separating axis, no intersection.
  for (var i = 0; i < aLen; i++) {
    if (isSeparatingAxis(a.position, b.position, aPoints, bPoints, a.shape.normals[i], response)) {
      return false;
    }
  }
  // If any of the edge normals of B is a separating axis, no intersection.
  for (var i = 0;i < bLen; i++) {
    if (isSeparatingAxis(a.position, b.position, aPoints, bPoints, b.shape.normals[i], response)) {
      return false;
    }
  }
  // Since none of the edge normals of A or B are a separating axis, there is an intersection
  // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
  // final overlap vector.
  if (response) {
    response.a = a;
    response.b = b;
    response.overlapV.copy(response.overlapN).multiply(response.overlap);
  }
  return true;
}

// Object Pools -----------------------------------------

/**
 * A pool of `Vector` objects that are used in calculations to avoid
 * allocating memory.
 * @type {Array<Vector>}
 */
var T_VECTORS = [];
for (var i = 0; i < 10; i++) { T_VECTORS.push(new Vector()); }

/**
 * A pool of arrays of numbers used in calculations to avoid allocating
 * memory.
 * @type {Array<Array<Bumber>>}
 */
var T_ARRAYS = [];
for (var i = 0; i < 5; i++) { T_ARRAYS.push([]); }

/**
 * Temporary response used for polygon hit detection.
 * @type {Response}
 */
var T_RESPONSE = new Response();

/**
 * Unit square polygon used for polygon hit detection.
 * @type {Polygon}
 */
var UNIT_SQUARE = new Body({
  position: new Vector(),
  shape: new Box(1, 1).toPolygon(),
});

Scene.registerSystem('Physics', {
  init: function init(scene) {
    scene.world = new World();
  },
  preUpdate: function preUpdate(scene, _, delta) {
    scene.world.preUpdate(delta);
  },
  update: function update(scene, _, delta) {
    scene.world.update(delta);
  },
  postUpdate: function postUpdate(scene) {
    scene.world.collisionChecks = 0;
  },
});

// Collision group helpers
function getGroupMask(idx) {
  if (idx < 31) {
    return 1 << idx;
  }
  else {
    console.log('Warning: only 0-30 indexed collisionGroups are supported!');
    return 0;
  }
}

module.exports = {
  getGroupMask: getGroupMask,

  World: World,
  Body: Body,

  Box: Box,
  Circle: Circle,

  UP: UP,
  DOWN: DOWN,
  LEFT: LEFT,
  RIGHT: RIGHT,
  OVERLAP: OVERLAP,
};
