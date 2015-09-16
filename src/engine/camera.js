/**
  @module camera
  @namespace game
**/
game.module(
  'engine.camera'
)
.body(function() {
  'use strict';

  /**
    @class Camera
  **/
  function Camera() {
    /**
      Camera acceleration speed.
      @property {Number} acceleration
      @default 3
    **/
    this.acceleration = 3;
    /**
      Anchor
      @property {game.Vector} anchor
      @default (0.5, 0.5)
    **/
    this.anchor = new game.Vector(0.5, 0.5);
    /**
      Container, that the camera is moving.
      @property {game.Container} container
    **/
    this.container = null;
    this.isShaking = false;
    /**
      Camera maximum move speed.
      @property {Number} maxSpeed
      @default 200
    **/
    this.maxSpeed = 200;
    this.maxX = null;
    this.maxY = null;
    this.minX = null;
    this.minY = null;
    this.position = new game.Vector();
    /**
      Use rounding on container position.
      @property {Boolean} rounding
      @default false
    **/
    this.rounding = false;
    this.rotation = 0;
    /**
      Current speed of camera.
      @property {game.Vector} speed
    **/
    this.speed = new game.Vector();
    /**
      Sprite, that camera follows.
      @property {game.Sprite} target
    **/
    this.target = null;
    this.threshold = 1;
    this.sensor = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    };
    /**
      Camera zoom
      (2, 2)      =>  2x
      (0.5, 0.5)  =>  0.5x
      @property {game.Vector} zoom
      @default (1, 1)
    **/
    this.zoom = new game.Vector(1, 1);

    /* @privates */
    this._targetLeft = 0;
    this._targetRight = 0;
    this._targetTop = 0;
    this._targetBottom = 0;
    this._sensorLeft = 0;
    this._sensorRight = 0;
    this._sensorTop = 0;
    this._sensorBottom = 0;

    this._shakeOffset = new game.Vector();
    this._shakeForce = new game.Vector();
    this._shakeForward = false;
    this._shakeDelay = 0;
    this._shakeCount = 0;
    this._startShake = this._startShake.bind(this);

    game.scene.addObject(this);
  }

  /**
    Add camera to container.
    @method addTo
    @param {game.Container} container
  **/
  Camera.prototype.addTo = function addTo(container) {
    // Request updates if not added to any containers yet
    if (!this.container) {
      game.scene.addObject(this);
    }

    this.container = container;

    this.position.set(game.system.width, game.system.height)
      .multiply(this.anchor);
    this.sensor.x = (game.system.width - this.sensor.width) * 0.5;
    this.sensor.y = (game.system.height - this.sensor.height) * 0.5;

    return this;
  };

  /**
    Set target for camera.
    @method setTarget
    @param {game.DisplayObject} target  The object to follow
    @param {Boolean}            lerp    Whether lerp to target instead of reseting camera position
  **/
  Camera.prototype.setTarget = function setTarget(target, lerp) {
    this.target = target;

    var bounds = target.getBounds();
    this.sensor.x = bounds.x + bounds.width * 0.5 - this.sensor.width * 0.5;
    this.sensor.y = bounds.y + bounds.height * 0.5 - this.sensor.height * 0.5;

    if (!lerp) {
      this.setPosition(target.position.x, target.position.y);
    }
  };

  Camera.prototype.setPosition = function setPosition(x, y) {
    this.position.set(x, y);

    if (typeof this.minX === 'number' && this.position.x < this.minX) {
      this.position.x = this.minX;
      this.speed.x = 0;
    } else if (typeof this.maxX === 'number' && this.position.x > this.maxX) {
      this.position.x = this.maxX;
      this.speed.x = 0;
    }

    if (typeof this.minY === 'number' && this.position.y < this.minY) {
      this.position.y = this.minY;
      this.speed.y = 0;
    } else if (typeof this.maxY === 'number' && this.position.y > this.maxY) {
      this.position.y = this.maxY;
      this.speed.y = 0;
    }

    if (this.container) {
      this.container.position.set(game.system.width, game.system.height)
        .multiply(this.anchor);
      this.container.pivot.copy(this.position);
    }
  };

  /**
   * Shake camera
   * @param {game.Vector|Number} force Max shake distance in pixel
   * @param {Number} duration  How long will the camera shake
   * @param {Number} count How many times will the camera shake
   * @param {Boolean} forward ONLY shake forward or not
   */
  Camera.prototype.shake = function shake(force, duration, count, forward) {
    if (typeof force === 'number') {
      this._shakeForce = this._shakeForce.set(force, force);
    } else {
      this._shakeForce = this._shakeForce.set(force.x, force.y);
    }

    this._shakeDelay = Math.floor(duration / count) || 20;
    this._shakeCount = count || 3;
    this._shakeForward = !!forward;

    this._startShake();
  };

  /** @private */
  Camera.prototype._startShake = function _startShake() {
    this.isShaking = true;
    if (this._shakeCount > 0) {
      if (this._shakeForward) {
        this._shakeOffset.x = Math.random() * this._shakeForce.x;
        this._shakeOffset.y = Math.random() * this._shakeForce.y;
      } else {
        this._shakeOffset.x = (Math.random() * 2 - 1) * this._shakeForce.x;
        this._shakeOffset.y = (Math.random() * 2 - 1) * this._shakeForce.y;
      }

      // Next shake
      this._shakeCount -= 1;
      game.scene.addTimer(this._shakeDelay, this._startShake);
    } else {
      // Reset offset
      this._shakeOffset.set(0, 0);
      this.setPosition(this.position.x, this.position.y);
      this.isShaking = false;
    }
  };

  Camera.prototype.moveSensor = function moveSensor() {
    if (!this.target) return;

    var targetBounds = this.target.getLocalBounds();

    // Resize sensor to fit the target
    if (this.sensor.width < targetBounds.width) {
      this.sensor.width = targetBounds.width;
    }
    if (this.sensor.height < targetBounds.height) {
      this.sensor.height = targetBounds.height;
    }

    this._targetLeft = this.target.position.x + targetBounds.x;
    this._targetRight = this._targetLeft + targetBounds.width;
    this._targetTop = this.target.position.y + targetBounds.y;
    this._targetBottom = this._targetTop + targetBounds.height;

    this._sensorLeft = this.sensor.x;
    this._sensorRight = this.sensor.x + this.sensor.width;
    this._sensorTop = this.sensor.y;
    this._sensorBottom = this.sensor.y + this.sensor.height;

    if (this._targetLeft < this._sensorLeft) {
      this.sensor.x = this._targetLeft;
    } else if (this._targetRight > this._sensorRight) {
      this.sensor.x = this._targetRight - this.sensor.width;
    }

    if (this._targetTop < this._sensorTop) {
      this.sensor.y = this._targetTop;
    } else if (this._targetBottom > this._sensorBottom) {
      this.sensor.y = this._targetBottom - this.sensor.height;
    }
  };

  Camera.prototype.moveCamera = function moveCamera() {
    this.speed.x = Math.clamp(this.position.x - (this.sensor.x + this.sensor.width * 0.5), -this.maxSpeed, this.maxSpeed);
    this.speed.y = Math.clamp(this.position.y - (this.sensor.y + this.sensor.height * 0.5), -this.maxSpeed, this.maxSpeed);

    if (this.speed.x > this.threshold ||
      this.speed.x < -this.threshold ||
      this.speed.y > this.threshold ||
      this.speed.y < -this.threshold
    ) {
      this.setPosition(
        this.position.x - this.speed.x * this.acceleration * game.system.delta,
        this.position.y - this.speed.y * this.acceleration * game.system.delta
      );
    } else {
      this.speed.set(0, 0);
    }

    if (this.isShaking && this.container) {
      this.setPosition(this.position.x, this.position.y);
      this.container.pivot.subtract(this._shakeOffset);
    }
  };

  Camera.prototype.remove = function remove() {
    this.container = null;
    game.scene.removeObject(this);
  };

  Camera.prototype.update = function update() {
    this.moveSensor();
    this.moveCamera();
    this.container.scale.set(1 / this.zoom.x, 1 / this.zoom.y);
    this.container.rotation = -this.rotation;
  };

  game.Camera = Camera;

});
