/**
  @module particle
  @namespace game
**/
game.module(
  'engine.particle'
)
.body(function() {
  'use strict';

  /**
    @class Particle
    @extends game.Class
  **/
  function Particle() {
    /**
      @property {game.Vector} position
    **/
    this.position = new game.Vector();
    /**
      @property {game.Vector} velocity
    **/
    this.velocity = new game.Vector();
    /**
      @property {game.Sprite} sprite
    **/
    sprite: null,
    /**
      @property {game.Vector} accel
    **/
    this.accel = new game.Vector();
  }

  /**
    @method setVelocity
    @param {Number} angle
    @param {Number} speed
  **/
  Particle.prototype.setVeloctity = function setVeloctity(angle, speed) {
    this.velocity.x = Math.cos(angle) * speed;
    this.velocity.y = Math.sin(angle) * speed;
  };

  /**
    @method setAccel
    @param {Number} angle
    @param {Number} speed
  **/
  Particle.prototype.setAccel = function setAccel(angle, speed) {
    this.accel.x = Math.cos(angle) * speed;
    this.accel.y = Math.sin(angle) * speed;
  };

  game.Particle = Particle;

  /**
    Particle emitter.
    @class Emitter
    @extends game.Class
    @constructor
    @param {Object} [settings]
  **/
  function Emitter(settings) {
    /**
      Pool name for particles.
      @property {String} poolName
      @default emitter
    **/
    this.poolName = 'emitter';
    /**
      @property {Array} particles
    **/
    this.particles = [];
    /**
      List of texture paths.
      @property {Array} textures
    **/
    this.textures = [];
    /**
      Container for particle sprites.
      @property {game.Container} container
    **/
    this.container = null;
    /**
      @property {game.Vector} position
    **/
    this.position = new game.Vector();
    /**
      @property {game.Vector} positionVar
    **/
    this.positionVar = new game.Vector();
    /**
      Emit angle in radians.
      @property {Number} angle
      @default 0
    **/
    this.angle = 0;
    /**
      Variance of emit angle in radians.
      @property {Number} angleVar
      @default 0
    **/
    this.angleVar = 0;
    /**
      Particle's initial speed.
      @property {Number} speed
      @default 100
    **/
    this.speed = 100;
    /**
      Variance for particle's initial speed.
      @property {Number} speedVar
      @default 0
    **/
    this.speedVar = 0;
    /**
      Particle's life in ms (0 is forever).
      @property {Number} life
      @default 2000
    **/
    this.life = 2000;
    /**
      Particle's life variance.
      @property {Number} lifeVar
      @default 0
    **/
    this.lifeVar = 0;
    /**
      Emitter duration in ms (0 is forever).
      @property {Number} duration
      @default 0
    **/
    this.duration = 0;
    this.durationTimer = 0;
    /**
      How often to emit new particles in ms.
      @property {Number} rate
      @default 100
    **/
    this.rate = 100;
    this.rateTimer = 0;
    /**
      Emit count of particles.
      @property {Number} count
      @default 10
    **/
    this.count = 10;
    /**
      Is emitter active.
      @property {Boolean} active
      @default true
    **/
    this.active = true;
    /**
      Particle's velocity rotation speed.
      @property {Number} velRotate
      @default 0
    **/
    this.velRotate = 0;
    /**
      Variance for particle's velocity rotation speed.
      @property {Number} velRotateVar
      @default 0
    **/
    this.velRotateVar = 0;
    /**
      Particle's sprite rotation speed.
      @property {Number} rotate
      @default 0
    **/
    this.rotate = 0;
    /**
      Variance for particle's sprite rotation speed.
      @property {Number} rotateVar
      @default 0
    **/
    this.rotateVar = 0;
    /**
      Starting alpha for particle.
      @property {Number} startAlpha
      @default 1
    **/
    this.startAlpha = 1;
    /**
      End alpha for particle.
      @property {Number} endAlpha
      @default 0
    **/
    this.endAlpha = 1;
    /**
      Starting scale for particle.
      @property {Number} startScale
      @default 1
    **/
    this.startScale = 1;
    /**
      @property {Number} startScaleVar
      @default 0
    **/
    this.startScaleVar = 0;
    /**
      @property {Number} endScale
      @default 1
    **/
    this.endScale = 1;
    /**
      @property {Number} endScaleVar
      @default 0
    **/
    this.endScaleVar = 0;
    /**
      Target position for particles.
      @property {game.Vector} target
    **/
    this.target = new game.Vector();
    /**
      Target positions force.
      @property {Number} targetForce
      @default 0
    **/
    this.targetForce = 0;
    /**
      Acceleration angle in radians.
      @property {Number} accelAngle
      @default Math.PI / 2
    **/
    this.accelAngle = Math.PI / 2;
    /**
      @property {Number} accelAngleVar
      @default 0
    **/
    this.accelAngleVar = 0;
    /**
      Acceleration speed.
      @property {Number} accelSpeed
      @default 0
    **/
    this.accelSpeed = 0;
    /**
      @property {Number} accelSpeedVar
      @default 0
    **/
    this.accelSpeedVar = 0;
    /**
      Settings to apply on particle sprite.
      @property {Object} spriteSettings
    **/
    this.spriteSettings = {};
    this.anchor = new game.Vector(0.5, 0.5);
    /**
      @property {game.Vector} velocityLimit
      @default 0
    **/
    this.velocityLimit = new game.Vector();
    this.callback = null;

    game.pool.create(this.poolName);
    game.merge(this, settings);
  }

  Emitter.prototype.onComplete = function onComplete(callback) {
    this.callback = callback;
  };

  /**
    Reset emitter values to defaults.
    @method reset
    @param {Boolean} resetVec Reset vector values.
  **/
  Emitter.prototype.reset = function reset(resetVec) {
    for (var name in this) {
      if (typeof this[name] === 'number') {
        this[name] = Emitter.prototype[name];
      }

      if (this[name] instanceof game.Vector && resetVec) {
        this[name].set(0, 0);
      }
    }
  };

  /**
    Get value with variance.
    Example: if you have value 100 with variance of 50, you will get value between 50 to 150.
    @method getVariance
    @return {Number}
  **/
  Emitter.prototype.getVariance = function getVariance(value) {
    return (Math.random() * value) * (Math.random() > 0.5 ? -1 : 1);
  };

  /**
    Add particle to emitter.
    @method addParticle
  **/
  Emitter.prototype.addParticle = function addParticle() {
    var particle = game.pool.get(this.poolName);
    if (!particle) particle = new Particle();

    particle.position.x = this.position.x + this.getVariance(this.positionVar.x);
    particle.position.y = this.position.y + this.getVariance(this.positionVar.y);

    var angleVar = this.getVariance(this.angleVar);
    var angle = this.angle + angleVar;
    var speed = this.speed + this.getVariance(this.speedVar);

    particle.setVeloctity(angle, speed);

    if (this.angleVar !== this.accelAngleVar) angleVar = this.getVariance(this.accelAngleVar);

    angle = this.accelAngle + angleVar;
    speed = this.accelSpeed + this.getVariance(this.accelSpeedVar);

    particle.setAccel(angle, speed);

    particle.life = this.life + this.getVariance(this.lifeVar);

    if (!particle.sprite) {
      particle.sprite = new game.Sprite(this.textures.random(), particle.position.x, particle.position.y, this.spriteSettings);
    } else {
      particle.sprite.texture = this.textures.random();
      particle.sprite.position.x = particle.position.x;
      particle.sprite.position.y = particle.position.y;
      particle.sprite.rotation = 0;
    }

    particle.rotate = this.rotate + this.getVariance(this.rotateVar);
    particle.velRotate = this.velRotate + this.getVariance(this.velRotateVar);

    if (this.startAlpha !== this.endAlpha) {
      particle.deltaAlpha = this.endAlpha - this.startAlpha;
      particle.deltaAlpha /= particle.life / 1000;
    } else particle.deltaAlpha = 0;

    particle.sprite.alpha = this.startAlpha;

    var startScale = this.startScale + this.getVariance(this.startScaleVar);
    if (this.startScale !== this.endScale) {
      particle.deltaScale = (this.endScale + this.getVariance(this.endScaleVar)) - startScale;
      particle.deltaScale /= particle.life / 1000;
    } else particle.deltaScale = 0;
    particle.sprite.scale.x = particle.sprite.scale.y = startScale;

    if (this.container) this.container.addChild(particle.sprite);

    this.particles.push(particle);
  };

  /**
    Update particle.
    @method updateParticle
  **/
  Emitter.prototype.updateParticle = function updateParticle(particle) {
    if (particle.life > 0) {
      particle.life -= game.system.delta * 1000;
      if (particle.life <= 0) return this.removeParticle(particle);
    }

    if (this.targetForce > 0) {
      particle.accel.set(this.target.x - particle.position.x, this.target.y - particle.position.y);
      var len = Math.sqrt(particle.accel.x * particle.accel.x + particle.accel.y * particle.accel.y);
      particle.accel.x /= len || 1;
      particle.accel.y /= len || 1;
      particle.accel.x *= this.targetForce;
      particle.accel.y *= this.targetForce;
    }

    particle.velocity.x += particle.accel.x * game.system.delta;
    particle.velocity.y += particle.accel.y * game.system.delta;

    if (this.velocityLimit.x > 0 || this.velocityLimit.y > 0) {
      particle.velocity.x = particle.velocity.x.limit(-this.velocityLimit.x, this.velocityLimit.x);
      particle.velocity.y = particle.velocity.y.limit(-this.velocityLimit.y, this.velocityLimit.y);
    }

    if (particle.velRotate) {
      var c = Math.cos(particle.velRotate * game.system.delta);
      var s = Math.sin(particle.velRotate * game.system.delta);

      var x = particle.velocity.x * c - particle.velocity.y * s;
      var y = particle.velocity.y * c + particle.velocity.x * s;

      particle.velocity.set(x, y);
    }

    particle.position.x += particle.velocity.x * game.scale * game.system.delta;
    particle.position.y += particle.velocity.y * game.scale * game.system.delta;

    if (particle.deltaAlpha) particle.sprite.alpha = Math.max(0, particle.sprite.alpha + particle.deltaAlpha * game.system.delta);
    if (particle.deltaScale) particle.sprite.scale.x = particle.sprite.scale.y += particle.deltaScale * game.system.delta;
    particle.sprite.rotation += particle.rotate * game.system.delta;
    particle.sprite.position.x = particle.position.x;
    particle.sprite.position.y = particle.position.y;
  };

  /**
    Remove particle from emitter.
    @method removeParticle
  **/
  Emitter.prototype.removeParticle = function removeParticle(particle) {
    if (particle.sprite.parent) particle.sprite.parent.removeChild(particle.sprite);
    game.pool.put(this.poolName, particle);
    this.particles.erase(particle);
  };

  /**
    Emit particles to emitter.
    @method emit
    @param {Number} count
  **/
  Emitter.prototype.emit = function emit(count) {
    count = count || 1;
    for (var i = 0; i < count; i++) {
      this.addParticle();
    }
  };

  /**
    Update particles.
    @method _update
  **/
  Emitter.prototype._update = function _update() {
    if (this._remove) {
      for (var i = this.particles.length - 1; i >= 0; i--) {
        this.removeParticle(this.particles[i]);
      }

      return;
    }

    this.durationTimer += game.system.delta * 1000;
    if (this.duration > 0) {
      this.active = this.durationTimer < this.duration;
      if (!this.active && this.particles.length === 0 && typeof this.callback === 'function') {
        this.callback();
        this.callback = null;
      }
    }

    if (this.rate && this.active) {
      this.rateTimer += game.system.delta * 1000;
      if (this.rateTimer >= this.rate) {
        this.rateTimer = 0;
        this.emit(this.count);
      }
    }

    for (var i = this.particles.length - 1; i >= 0; i--) {
      this.updateParticle(this.particles[i]);
    }
  };

  /**
    Remove emitter from scene.
    @method remove
  **/
  Emitter.prototype.remove = function remove() {
    this._remove = true;
  };

  /**
    Add emitter to container.
    @method addTo
    @param {game.Container} container
  **/
  Emitter.prototype.addTo = function addTo(container) {
    this.container = container;
  };

  game.Emitter = Emitter;

});
