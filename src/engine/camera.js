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
  function Camera(x, y) {
    this.position = new game.Vector();
    /**
      Camera maximum move speed.
      @property {Number} maxSpeed
      @default 200
    **/
    this.maxSpeed = 200;
    /**
      Camera acceleration speed.
      @property {Number} acceleration
      @default 3
    **/
    this.acceleration = 3;
    /**
      Camera offset.
      @property {game.Vector} offset
      @default game.system.width / 2, game.system.height / 2
    **/
    this.offset = new game.Vector(game.system.width / 2, game.system.height / 2);
    /**
      Sprite, that camera follows.
      @property {game.Sprite} target
    **/
    this.target = null;
    /**
      Container, that the camera is moving.
      @property {game.Container} container
    **/
    this.container = null;
    /**
      Current speed of camera.
      @property {game.Vector} speed
    **/
    this.speed = new game.Vector();
    /**
      Scale value of camera.
      @property {Number} scale
      @default 1
    **/
    this.scale = 1;
    /**
      Use rounding on container position.
      @property {Boolean} rounding
      @default false
    **/
    this.rounding = false;

    this.sensorPosition = new game.Vector(this.offset.x, this.offset.y);
    this.sensorWidth = 200 * game.scale;
    this.sensorHeight = 200 * game.scale;
    this.threshold = 1;
    this.minX = null;
    this.maxX = null;
    this.minY = null;
    this.maxY = null;

    if (typeof x === 'number' && typeof y === 'number') {
      this.setPosition(x, y);
    }

    game.scene.addObject(this);
  }

  /**
    Add camera to container.
    @method addTo
    @param {game.Container} container
  **/
  Camera.prototype.addTo = function addTo(container) {
    this.container = container;
    this.container.position.set(-this.position.x, -this.position.y);
    return this;
  };

  /**
    Set target for camera.
    @method setTarget
    @param {game.Sprite} target
  **/
  Camera.prototype.setTarget = function setTarget(target) {
    this.target = target;
    this.sensorPosition.set(this.target.position.x * this.scale, this.target.position.y * this.scale);
  };

  Camera.prototype.setPosition = function setPosition(x, y) {
    this.position.set(x - this.offset.x, y - this.offset.y);

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
      this.container.position.x = -(this.rounding ? (this.position.x + 0.5) | 0 : this.position.x);
      this.container.position.y = -(this.rounding ? (this.position.y + 0.5) | 0 : this.position.y);
    }
  };

  Camera.prototype.setSensor = function setSensor(width, height) {
    this.sensorWidth = width;
    this.sensorHeight = height;
  };

  Camera.prototype.moveSensor = function moveSensor() {
    if (!this.target) return;

    var targetWidth = Math.abs(this.target.width) * this.scale;
    var targetHeight = Math.abs(this.target.height) * this.scale;
    var targetPosX = (this.target.position.x + this.target.width / 2) * this.scale;
    var targetPosY = (this.target.position.y + this.target.height / 2) * this.scale;

    if (this.sensorWidth < targetWidth || this.sensorHeight < targetHeight) this.setSensor(targetWidth, targetHeight);

    if (targetPosX < this.sensorPosition.x - this.sensorWidth / 2 + targetWidth / 2) {
      this.sensorPosition.x = targetPosX + this.sensorWidth / 2 - targetWidth / 2;
    } else if (targetPosX + (this.sensorWidth / 2 + targetWidth / 2) > this.sensorPosition.x + this.sensorWidth) {
      this.sensorPosition.x = targetPosX + (this.sensorWidth / 2 + targetWidth / 2) - this.sensorWidth;
    }

    if (targetPosY < this.sensorPosition.y - this.sensorHeight / 2 + targetHeight / 2) {
      this.sensorPosition.y = targetPosY + this.sensorHeight / 2 - targetHeight / 2;
    } else if (targetPosY + (this.sensorHeight / 2 + targetHeight / 2) > this.sensorPosition.y + this.sensorHeight) {
      this.sensorPosition.y = targetPosY + (this.sensorHeight / 2 + targetHeight / 2) - this.sensorHeight;
    }
  };

  Camera.prototype.moveCamera = function moveCamera() {
    this.speed.x = (this.position.x - this.sensorPosition.x + this.offset.x).limit(-this.maxSpeed, this.maxSpeed);
    this.speed.y = (this.position.y - this.sensorPosition.y + this.offset.y).limit(-this.maxSpeed, this.maxSpeed);

    if (this.speed.x > this.threshold ||
      this.speed.x < -this.threshold ||
      this.speed.y > this.threshold ||
      this.speed.y < -this.threshold
    ) {
      this.setPosition(
        this.position.x + this.offset.x - this.speed.x * this.acceleration * game.system.delta,
        this.position.y + this.offset.y - this.speed.y * this.acceleration * game.system.delta
      );
    } else {
      this.speed.set(0, 0);
    }
  };

  Camera.prototype.update = function update() {
    this.moveSensor();
    this.moveCamera();
  };

  game.Camera = Camera;

});
