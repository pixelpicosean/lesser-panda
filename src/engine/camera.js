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
    /**
      Camera maximum move speed.
      @property {Number} maxSpeed
      @default 200
    **/
    this.maxSpeed = 200;
    this.position = new game.Vector();
    /**
      Use rounding on container position.
      @property {Boolean} rounding
      @default false
    **/
    this.rounding = false;
    this.rotation = 0;
    /**
      Camera zoom
      (2, 2)      =>  2x
      (0.5, 0.5)  =>  0.5x
      @property {game.Vector} zoom
      @default (1, 1)
    **/
    this.zoom = new game.Vector(1, 1);
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

    this.sensor = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    };

    this.threshold = 1;
    this.minX = null;
    this.maxX = null;
    this.minY = null;
    this.maxY = null;

    /* @privates */
    this._targetLeft = 0;
    this._targetRight = 0;
    this._targetTop = 0;
    this._targetBottom = 0;
    this._sensorLeft = 0;
    this._sensorRight = 0;
    this._sensorTop = 0;
    this._sensorBottom = 0;

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
