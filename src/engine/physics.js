var Vector = require('engine/vector');
var Scene = require('engine/scene');
var utils = require('engine/utils');

var config = require('game/config').default;

// Constants
var ESP = 0.000001;

var UP = 'UP';
var DOWN = 'DOWN';
var LEFT = 'LEFT';
var RIGHT = 'RIGHT';
var OVERLAP = 'OVERLAP';

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
var RECT = 0;
var CIRC = 1;

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
    Gravity of physics world.
    @property {Vector} gravity
    @default 0, 980
  **/
  this.gravity = Vector.create(x || 0, y || 980);
  /**
   * Collision solver instance
   */
  this.solver = (config.solver === 'SAT') ? new SATSolver() : new AABBSolver();
  /**
    List of bodies in world.
    @property {Array} bodies
  **/
  this.bodies = [];
  /**
    List of collision groups.
    @property {Object} collisionGroups
  **/
  this.collisionGroups = {};
}

/**
  Add body to world.
  @method addBody
  @param {Body} body
**/
World.prototype.addBody = function addBody(body) {
  body.world = this;
  body._remove = false;
  this.bodies.push(body);
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

  // Before each collision detection
  body.beforeCollide();

  for (g = 0; g < body.collideAgainst.length; g++) {
    body._collides.length = 0;
    group = this.collisionGroups[body.collideAgainst[g]];

    if (!group) continue;

    for (i = group.length - 1; i >= 0; i--) {
      if (!group) break;
      b = group[i];
      if (body !== b) {
        if (this.solver.hitTest(body, b)) {
          body._collides.push(b);
        }
      }
    }

    for (i = body._collides.length - 1; i >= 0; i--) {
      if (this.solver.hitResponse(body, body._collides[i])) {
        body.afterCollide(body._collides[i]);
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
};

/**
  Update physics world.
  @method update
**/
World.prototype.update = function update(delta) {
  var i, j;
  for (i = 0; i < this.bodies.length; i++) {
    this.bodies[i].update(delta);
  }

  for (i in this.collisionGroups) {
    // Remove empty collision group
    if (this.collisionGroups[i].length === 0) {
      delete this.collisionGroups[i];
      continue;
    }

    for (j = this.collisionGroups[i].length - 1; j >= 0; j--) {
      if (this.collisionGroups[i][j] && this.collisionGroups[i][j].collideAgainst.length > 0) {
        this.collide(this.collisionGroups[i][j]);
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

  if (a.shape.type === RECT && b.shape.type === RECT) {
    return !(
      a._bottom <= b._top ||
      a._top >= b._bottom ||
      a._left >= b._right ||
      a._right <= b._left
    );
  }

  if (a.shape.type === CIRC && b.shape.type === CIRC) {
    return (a.shape.radius + b.shape.radius > a.position.distance(b.position));
  }

  if ((a.shape.type === RECT && b.shape.type === CIRC) || (a.shape.type === CIRC && b.shape.type === RECT)) {
    var rect = (a.shape.type === RECT) ? a : b;
    var circle = (a.shape.type === CIRC) ? a : b;

    var x = Math.max(rect._left, Math.min(rect._right, circle.position.x));
    var y = Math.max(rect._top, Math.min(rect._bottom, circle.position.y));

    var dist = (circle.position.x - x) * (circle.position.x - x) + (circle.position.y - y) * (circle.position.y - y);
    return dist < (circle.shape.radius * circle.shape.radius);
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
  if (a.shape.type === RECT && b.shape.type === RECT) {
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
  // TODO: Circle vs Box
  else if ((a.shape.type === CIRC && b.shape.type === RECT) || (a.shape.type === RECT && b.shape.type === CIRC)) {
  }
};

/**
  Physics body.
  @class Body
  @constructor
  @param {Object} [properties]
**/
function Body(properties) {
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
    Group numbers that body collides against.
    @property {Array} collideAgainst
    @default []
  **/
  this.collideAgainst = [];
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
  this._collides = [];

  this._left = 0;
  this._right = 0;
  this._top = 0;
  this._bottom = 0;

  this._lastLeft = 0;
  this._lastRight = 0;
  this._lastTop = 0;
  this._lastBottom = 0;

  Object.assign(this, properties);
}

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
 * This will be called before collision checking.
 * You can clean up collision related flags here.
 */
Body.prototype.beforeCollide = function beforeCollide() {};

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
  Set body's collideAgainst groups.
  @method setCollideAgainst
  @param {Number} groups
**/
Body.prototype.setCollideAgainst = function setCollideAgainst() {
  this.collideAgainst.length = 0;
  for (var i = 0; i < arguments.length; i++) {
    this.collideAgainst.push(arguments[i]);
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
  if (this.damping > 0 && this.damping < 1) this.velocity.scale(Math.pow(1 - this.damping, delta));

  if (this.velocityLimit.x > 0) this.velocity.x = utils.clamp(this.velocity.x, -this.velocityLimit.x, this.velocityLimit.x);
  if (this.velocityLimit.y > 0) this.velocity.y = utils.clamp(this.velocity.y, -this.velocityLimit.y, this.velocityLimit.y);

  this.position.add(this.velocity.x * delta, this.velocity.y * delta);

  if (this.shape && this.shape.type === RECT) {
    updateBounds(this);
  }
};

function Polygon(points) {
  this.points = [];
  this.calcPoints = [];
  this.edges = [];
  this.normals = [];
  this._rotation = 0;
  this.offset = new Vector();
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
  for (i = 0; i < len; i++) {
    var calcPoint = calcPoints[i].copy(points[i]);
    calcPoint.x += offset.x;
    calcPoint.y += offset.y;
    if (rotation !== 0) {
      calcPoint.rotate(rotation);
    }
  }
  // Calculate the edges/normals
  for (i = 0; i < len; i++) {
    var p1 = calcPoints[i];
    var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
    var e = edges[i].copy(p2).subtract(p1);
    normals[i].copy(e).perp().normalize();
  }
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

  this.type = RECT;
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
  this.a = null;
  this.b = null;
  this.aInB = true;
  this.bInA = true;
  this.overlap = Number.MAX_VALUE;
  this.overlapN = new Vector();
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

Scene.registerSystem('Physics', {
  init: function init(scene) {
    scene.world = new World();
  },
  preUpdate: function preUpdate(scene, delta) {
    scene.world.preUpdate(delta * 0.001);
  },
  update: function update(scene, delta) {
    scene.world.update(delta * 0.001);
  },
});

module.exports = {
  World: World,
  Body: Body,
  Box: Box,
  Circle: Circle,
};
