var Vector = require('engine/vector');
var Scene = require('engine/scene');
var utils = require('engine/utils');

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

// Update bounds of a Rectangle body on last frame
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
  /**:
    @property {CollisionSolver} solver
  **/
  this.solver = new CollisionSolver();
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
  @class CollisionSolver
**/
function CollisionSolver() {}

/**
  Hit test a versus b.
  @method hitTest
  @param {Body} a
  @param {Body} b
  @return {Boolean} return true, if bodies hit.
**/
CollisionSolver.prototype.hitTest = function hitTest(a, b) {
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
CollisionSolver.prototype.hitResponse = function hitResponse(a, b) {
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
  // TODO: Circle vs Rectangle
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
    @property {Rectangle|Circle} shape
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

/**
  Rectangle shape for physic body.
  @class Rectangle
  @constructor
  @param {Number} [width]
  @param {Number} [height]
**/
function Rectangle(width, height) {
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

  this.type = RECT;
}

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

  this.type = CIRC;
}

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
  Rectangle: Rectangle,
  Circle: Circle,
};
