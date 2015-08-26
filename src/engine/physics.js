/**
  @module physics
  @namespace game
**/
game.module(
  'engine.physics'
)
.require(
  'engine.geometry'
)
.body(function() {
  'use strict';

  /**
    Physics world.
    @class World
    @extends game.Class
    @constructor
    @param {Number} x Gravity x
    @param {Number} y Gravity y
  **/
  function World(x, y) {
    /**
      Gravity of physics world.
      @property {game.Vector} gravity
      @default 0,980
    **/
    this.gravity = null;
    /**
      @property {game.CollisionSolver} solver
    **/
    this.solver = null;
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

    x = typeof x === 'number' ? x : 0;
    y = typeof y === 'number' ? y : 980;
    this.gravity = new game.Vector(x, y);
    this.solver = new CollisionSolver();
  }

  /**
    Add body to world.
    @method addBody
    @param {game.Body} body
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
    @param {game.Body} body
  **/
  World.prototype.removeBody = function removeBody(body) {
    if (!body.world) return;
    body.world = null;
    body._remove = true;
  };

  /**
    Add body to collision group.
    @method addBodyCollision
    @param {game.Body} body
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
    @param {game.Body} body
  **/
  World.prototype.removeBodyCollision = function removeBodyCollision(body) {
    if (typeof body.collisionGroup !== 'number') return;
    if (!this.collisionGroups[body.collisionGroup]) return;
    if (this.collisionGroups[body.collisionGroup].indexOf(body) === -1) return;
    this.collisionGroups[body.collisionGroup].erase(body);
  };

  /**
    Collide body against it's `collideAgainst` groups.
    @method collide
    @param {game.Body} body
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
  World.prototype._update = function _update() {
    var i, j;
    for (i = this.bodies.length - 1; i >= 0; i--) {
      if (this.bodies[i]._remove) {
        this.removeBodyCollision(this.bodies[i]);
        this.bodies.splice(i, 1);
      } else {
        this.bodies[i].update();
      }
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

  game.World = World;

  /**
    Physics collision solver.
    @class CollisionSolver
    @extends game.Class
  **/
  function CollisionSolver() {}

  /**
    Hit test a versus b.
    @method hitTest
    @param {game.Body} a
    @param {game.Body} b
    @return {Boolean} return true, if bodies hit.
  **/
  CollisionSolver.prototype.hitTest = function hitTest(a, b) {
    if (a.shape.width && b.shape.width) {
      return !(
        a.position.y + a.shape.height / 2 <= b.position.y - b.shape.height / 2 ||
        a.position.y - a.shape.height / 2 >= b.position.y + b.shape.height / 2 ||
        a.position.x - a.shape.width / 2 >= b.position.x + b.shape.width / 2 ||
        a.position.x + a.shape.width / 2 <= b.position.x - b.shape.width / 2
      );
    }

    if (a.shape.radius && b.shape.radius) {
      return (a.shape.radius + b.shape.radius > a.position.distance(b.position));
    }

    if (a.shape.width && b.shape.radius || a.shape.radius && b.shape.width) {
      var rect = a.shape.width ? a : b;
      var circle = a.shape.radius ? a : b;

      var x = Math.max(rect.position.x - rect.shape.width / 2, Math.min(rect.position.x + rect.shape.width / 2, circle.position.x));
      var y = Math.max(rect.position.y - rect.shape.height / 2, Math.min(rect.position.y + rect.shape.height / 2, circle.position.y));

      var dist = Math.pow(circle.position.x - x, 2) + Math.pow(circle.position.y - y, 2);
      return dist < (circle.shape.radius * circle.shape.radius);
    }

    return false;
  };

  /**
    Hit response a versus b.
    @method hitResponse
    @param {game.Body} a
    @param {game.Body} b
    @return {Boolean}
  **/
  CollisionSolver.prototype.hitResponse = function hitResponse(a, b) {
    if (a.shape.width && b.shape.width) {
      if (a.last.y + a.shape.height / 2 <= b.last.y - b.shape.height / 2) {
        if (a.collide(b, 'DOWN')) {
          a.position.y = b.position.y - b.shape.height / 2 - a.shape.height / 2;
          return true;
        }
      } else if (a.last.y - a.shape.height / 2 >= b.last.y + b.shape.height / 2) {
        if (a.collide(b, 'UP')) {
          a.position.y = b.position.y + b.shape.height / 2 + a.shape.height / 2;
          return true;
        }
      } else if (a.last.x + a.shape.width / 2 <= b.last.x - b.shape.width / 2) {
        if (a.collide(b, 'RIGHT')) {
          a.position.x = b.position.x - b.shape.width / 2 - a.shape.width / 2;
          return true;
        }
      } else if (a.last.x - a.shape.width / 2 >= b.last.x + b.shape.width / 2) {
        if (a.collide(b, 'LEFT')) {
          a.position.x = b.position.x + b.shape.width / 2 + a.shape.width / 2;
          return true;
        }
      } else {
        // Inside
        if (a.collide(b)) return true;
      }
    } else if (a.shape.radius && b.shape.radius) {
      var angle = b.position.angle(a.position);
      if (a.collide(b, angle)) {
        var dist = a.shape.radius + b.shape.radius;
        a.position.x = b.position.x + Math.cos(angle) * dist;
        a.position.y = b.position.y + Math.sin(angle) * dist;
        return true;
      }
    }
  };

  game.CollisionSolver = CollisionSolver;

  /**
    Physics body.
    @class Body
    @extends game.Class
    @constructor
    @param {Object} [properties]
  **/
  function Body(properties) {
    /**
      Body's physic world.
      @property {game.World} world
    **/
    this.world = null;
    /**
      Body's shape.
      @property {game.Shape} shape
    **/
    this.shape = null;
    /**
      Position of body.
      @property {game.Vector} position
    **/
    this.position = new game.Vector();
    /**
      Last position of body.
      @property {game.Vector} last
    **/
    this.last = new game.Vector();
    /**
      Body's velocity.
      @property {game.Vector} velocity
    **/
    this.velocity = new game.Vector();
    /**
      Body's maximum velocity.
      @property {game.Vector} velocityLimit
      @default 0,0
    **/
    this.velocityLimit = new game.Vector();
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
      @property {game.Vector} force
      @default 0,0
    **/
    this.force = new game.Vector();
    /**
      Body's damping. Should be number between 0 and 1.
      @property {Number} damping
      @default 0
    **/
    this.damping = 0;
    this._collides = [];

    game.merge(this, properties);
  }

  /**
    Add shape to body.
    @method addShape
    @param {game.Shape} shape
  **/
  Body.prototype.addShape = function addShape(shape) {
    this.shape = shape;
    return this;
  };

  /**
    This is called, when body collides with another body.
    @method collide
    @param {game.Body} body body that it collided with.
    @return {Boolean} Return true, to apply hit response.
  **/
  Body.prototype.collide = function collide() {
    return true;
  };

  /**
    This is called after hit response.
    @method afterCollide
    @param {game.Body} bodyB body that it collided with.
  **/
  Body.prototype.afterCollide = function afterCollide() {
  };

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
    @param {game.World} world
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
  Body.prototype.update = function update() {
    this.last.copy(this.position);

    if (this.mass !== 0) {
      this.velocity.add(
        this.world.gravity.x * this.mass * game.system.delta,
        this.world.gravity.y * this.mass * game.system.delta
      );
    }

    this.velocity.add(this.force.x * game.system.delta, this.force.y * game.system.delta);
    if (this.damping > 0 && this.damping < 1) this.velocity.scale(Math.pow(1 - this.damping, game.system.delta));

    if (this.velocityLimit.x > 0) this.velocity.x = this.velocity.x.limit(-this.velocityLimit.x, this.velocityLimit.x);
    if (this.velocityLimit.y > 0) this.velocity.y = this.velocity.y.limit(-this.velocityLimit.y, this.velocityLimit.y);

    this.position.add(this.velocity.x * game.system.delta, this.velocity.y * game.system.delta);
  };

  game.Body = Body;

  /**
    Rectangle shape for physic body.
    @class Rectangle
    @constructor
    @param {Number} width
    @param {Number} height
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
  }

  game.Rectangle = Rectangle;

  /**
    Circle shape for physic body.
    @class Circle
    @constructor
    @param {Number} radius
  **/
  function Circle(radius) {
    /**
      Radius of circle.
      @property {Number} radius
      @default 50
    **/
    this.radius = radius || 50;
  }

  game.Circle = Circle;

});
