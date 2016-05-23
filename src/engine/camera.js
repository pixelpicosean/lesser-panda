var engine = require('engine/core');
var Vector = require('engine/vector');
var Timer = require('engine/timer');
var utils = require('engine/utils');

/**
 * Camera with ability to follow, scale and shake.
 *
 * @class Camera
 *
 * @constructor
 */
function Camera() {
  /**
   * Camera acceleration speed.
   * @type {Vector}
   * @default (3, 3)
   */
  this.acceleration = Vector.create(3, 3);
  /**
   * Anchor of the camera, the same as `PIXI.Sprite``
   * @type {Vector}
   * @default (0.5, 0.5)
   */
  this.anchor = Vector.create(0.5, 0.5);
  /**
   * Container that the camera is added to.
   * @type {PIXI.Container}
   */
  this.container = null;
  /**
   * Whether the camera is currently shaking
   * @type {boolean}
   * @default false
   */
  this.isShaking = false;
  /**
   * Camera maximum move speed.
   * @type {number}
   * @default 200
   */
  this.maxSpeed = 200;

  /**
   * Camera position limit (right)
   * @type {null|number}
   * @default null
   */
  this.maxX = null;
  /**
   * Camera position limit (down)
   * @type {null|number}
   * @default null
   */
  this.maxY = null;
  /**
   * Camera position limit (left)
   * @type {null|number}
   * @default null
   */
  this.minX = null;
  /**
   * Camera position limit (up)
   * @type {null|number}
   * @default null
   */
  this.minY = null;
  /**
   * Camera position.
   * @type {Vector}
   * @default (0, 0)
   */
  this.position = Vector.create();
  /**
   * Use rounding on container position.
   * @type {boolean}
   * @default false
   */
  this.rounding = false;
  /**
   * Rotation of the camera.
   * @type {number}
   * @default 0
   */
  this.rotation = 0;
  /**
   * Reference of the scene added to.
   * @type {Scene}
   */
  this.scene = null;
  /**
   * Current speed of camera.
   * @type {Vector}
   */
  this.speed = Vector.create();
  /**
   * @private
   */
  this.delta = 0;
  /**
   * Sprite, that camera follows.
   * @type {PIXI.Sprite}
   */
  this.target = null;
  /**
   * @type {number}
   */
  this.threshold = 1;
  /**
   * Sensor box
   * @type {object}
   */
  this.sensor = {
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  };
  /**
   * Camera zoom.
   * (2, 2)      =>  2x
   * (0.5, 0.5)  =>  0.5x
   * @type {Vector}
   * @default (1, 1)
   */
  this.zoom = Vector.create(1, 1);

  // internal caches
  this._targetLeft = 0;
  this._targetRight = 0;
  this._targetTop = 0;
  this._targetBottom = 0;
  this._sensorLeft = 0;
  this._sensorRight = 0;
  this._sensorTop = 0;
  this._sensorBottom = 0;

  this._shakeOffset = Vector.create();
  this._shakeForce = Vector.create();
  this._shakeForward = false;
  this._shakeDelay = 0;
  this._shakeCount = 0;
  this._startShake = this._startShake.bind(this);

  this._numCache = 0;
}

/**
 * Add camera to container.
 * @memberof Camera#
 * @method addTo
 * @param {Scene}           scene
 * @param {PIXI.Container}  container
 */
Camera.prototype.addTo = function addTo(scene, container) {
  this.scene = scene;
  this.container = container;

  scene.on('update', this.update, this);

  this.position.set(engine.width, engine.height)
    .multiply(this.anchor);
  this.sensor.x = (engine.width - this.sensor.width) * 0.5;
  this.sensor.y = (engine.height - this.sensor.height) * 0.5;

  return this;
};

/**
 * Set target of camera.
 * @memberof Camera#
 * @method setTarget
 * @param {DisplayObject} target  The object to follow
 * @param {Boolean}            lerp    Whether lerp to target instead of reseting camera position
 */
Camera.prototype.setTarget = function setTarget(target, lerp) {
  this.target = target;

  if (!this.target) return;

  var bounds = target.getBounds();
  this.sensor.x = bounds.x + bounds.width * 0.5 - this.sensor.width * 0.5;
  this.sensor.y = bounds.y + bounds.height * 0.5 - this.sensor.height * 0.5;

  if (!lerp) {
    this._setPosition(target.position.x, target.position.y);
  }
};

/**
 * Set position of the camera
 * @memberof Camera#
 * @method setPosition
 */
Camera.prototype.setPosition = function setPosition(x, y) {
  this._setPosition(x, y);

  if (this.target) {
    this.sensor.x = x - this.sensor.width * 0.5;
    this.sensor.y = y - this.sensor.height * 0.5;
  }
};

Camera.prototype._setPosition = function _setPosition(x, y) {
  this.position.set(x, y);

  // Make sure position constrains are correct
  if (Number.isFinite(this.minX) && Number.isFinite(this.maxX) && this.minX > this.maxX) {
    this._numCache = this.maxX;
    this.maxX = this.minX;
    this.minX = this._numCache;
  }
  if (Number.isFinite(this.minY) && Number.isFinite(this.maxY) && this.minY > this.maxY) {
    this._numCache = this.maxY;
    this.maxY = this.minY;
    this.minY = this._numCache;
  }

  // Apply constrains
  if (Number.isFinite(this.minX) && this.position.x < this.minX) {
    this.position.x = this.minX;
    this.speed.x = 0;
  } else if (Number.isFinite(this.maxX) && this.position.x > this.maxX) {
    this.position.x = this.maxX;
    this.speed.x = 0;
  }

  if (Number.isFinite(this.minY) && this.position.y < this.minY) {
    this.position.y = this.minY;
    this.speed.y = 0;
  } else if (Number.isFinite(this.maxY) && this.position.y > this.maxY) {
    this.position.y = this.maxY;
    this.speed.y = 0;
  }

  if (this.container) {
    this.container.position.set(engine.width, engine.height)
      .multiply(this.anchor);
    this.container.pivot.copy(this.position);
  }
};

/**
 * Shake camera
 * @memberof Camera#
 * @method shake
 * @param {Vector|Number} force Max shake distance in pixel
 * @param {Number} duration  How long will the camera shake
 * @param {Number} count How many times will the camera shake
 * @param {Boolean} forward ONLY shake forward or not
 */
Camera.prototype.shake = function shake(force, duration, count, forward) {
  if (Number.isFinite(force)) {
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
    Timer.later(this._shakeDelay, this._startShake);
  } else {
    // Reset offset
    this._shakeOffset.set(0, 0);
    this._setPosition(this.position.x, this.position.y);
    this.isShaking = false;
  }
};

/**
 * @memberof Camera#
 * @method moveSensor
 * @private
 */
Camera.prototype.moveSensor = function moveSensor() {
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

/**
 * @memberof Camera#
 * @method moveCamera
 * @private
 */
Camera.prototype.moveCamera = function moveCamera(dt) {
  if (!this.target) return;

  this.speed.x = utils.clamp(this.position.x - (this.sensor.x + this.sensor.width * 0.5), -this.maxSpeed, this.maxSpeed);
  this.speed.y = utils.clamp(this.position.y - (this.sensor.y + this.sensor.height * 0.5), -this.maxSpeed, this.maxSpeed);

  if (this.speed.x > this.threshold ||
    this.speed.x < -this.threshold ||
    this.speed.y > this.threshold ||
    this.speed.y < -this.threshold
  ) {
    this._setPosition(
      this.position.x - this.speed.x * this.acceleration.x * dt,
      this.position.y - this.speed.y * this.acceleration.y * dt
    );
  } else {
    this.speed.set(0, 0);
  }

  if (this.isShaking && this.container) {
    this._setPosition(this.position.x, this.position.y);
    this.container.pivot.subtract(this._shakeOffset);
  }
};

/**
 * Remove camera from parent container.
 * @memberof Camera#
 * @method remove
 */
Camera.prototype.remove = function remove() {
  scene.off('update', this.update, this);
  this.container = null;
};

/**
 * Update method
 * @memberof Camera#
 * @method update
 * @protected
 */
Camera.prototype.update = function update(_, delta) {
  this.delta = delta;

  if (this.target) {
    this.moveSensor(this.delta);
  }
  this.moveCamera(this.delta);

  if (this.container) {
    this.container.scale.set(1 / this.zoom.x, 1 / this.zoom.y);
    this.container.rotation = -this.rotation;
  }
};

/**
 * Camera bounds left
 * @memberof Camera#
 * @type {number}
 * @readonly
 */
Object.defineProperty(Camera.prototype, 'left', {
  get: function() {
    return this.position.x - engine.width * this.anchor.x;
  },
});
/**
 * Camera bounds right
 * @memberof Camera#
 * @type {number}
 * @readonly
 */
Object.defineProperty(Camera.prototype, 'right', {
  get: function() {
    return this.position.x + engine.width * (1 - this.anchor.x);
  },
});
/**
 * Camera bounds top
 * @memberof Camera#
 * @type {number}
 * @readonly
 */
Object.defineProperty(Camera.prototype, 'top', {
  get: function() {
    return this.position.y - engine.height * this.anchor.y;
  },
});
/**
 * Camera bounds bottom
 * @memberof Camera#
 * @type {number}
 * @readonly
 */
Object.defineProperty(Camera.prototype, 'bottom', {
  get: function() {
    return this.position.y + engine.height * (1 - this.anchor.y);
  },
});

/**
 * @exports engine/camera
 *
 * @see Camera
 *
 * @requires module:engine/core
 * @requires module:engine/vector
 * @requires module:engine/timer
 * @requires module:engine/utils
 */
module.exports = Camera;
