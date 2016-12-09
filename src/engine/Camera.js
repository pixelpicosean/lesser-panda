const engine = require('engine/core');
const Vector = require('engine/Vector');
const Timer = require('engine/Timer');
const { clamp } = require('engine/utils/math');

/**
 * Camera with ability to follow, scale and shake.
 *
 * @class Camera
 */
class Camera {
  /**
   * @constructor
   */
  constructor() {
    /**
     * Camera acceleration speed.
     * @type {Vector}
     * @default (3, 3)
     */
    this.acceleration = Vector.create(3, 3);
    /**
     * Anchor of the camera
     * @type {Vector}
     * @default (0.5, 0.5)
     */
    this.anchor = Vector.create(0.5, 0.5);
    /**
     * Container that the camera is added to.
     * @type {Container}
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
     * Reference of the game added to.
     * @type {Game}
     */
    this.game = null;
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
     * The Sprite this camera follows.
     * @type {Sprite}
     */
    this.target = null;
    /**
     * @type {number}
     */
    this.threshold = 1;
    /**
     * Sensor box
     * @type {Object}
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
   * @param {Game} game           Which game to add to
   * @param {Container} container Which container to add to
   * @return {Camera} This for chaining
   */
  addTo(game, container) {
    this.game = game;
    this.container = container;

    game.on('update', this.update, this);

    this.position.set(engine.width, engine.height)
      .multiply(this.anchor);
    this.sensor.x = (engine.width - this.sensor.width) * 0.5;
    this.sensor.y = (engine.height - this.sensor.height) * 0.5;

    return this;
  }

  /**
   * Set target of camera.
   * @memberof Camera#
   * @method setTarget
   * @param {DisplayObject} target  The object to follow
   * @param {Boolean} lerp          Whether lerp to target instead of reseting camera position
   */
  setTarget(target, lerp) {
    this.target = target;

    if (!this.target) {return;}

    let bounds = target.getBounds();
    this.sensor.x = bounds.x + bounds.width * 0.5 - this.sensor.width * 0.5;
    this.sensor.y = bounds.y + bounds.height * 0.5 - this.sensor.height * 0.5;

    if (!lerp) {
      this._setPosition(target.position.x, target.position.y);
    }
  }

  /**
   * Set position of the camera
   * @memberof Camera#
   * @method setPosition
   * @param {Number} x X coordinate
   * @param {Number} y Y coordinate
   */
  setPosition(x, y) {
    this._setPosition(x, y);

    if (this.target) {
      this.sensor.x = x - this.sensor.width * 0.5;
      this.sensor.y = y - this.sensor.height * 0.5;
    }
  }

  /**
   * Directly move this camera to a position.
   * @param {Number} x X coordinate
   * @param {Number} y Y coordinate
   * @private
   */
  _setPosition(x, y) {
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
    }
    else if (Number.isFinite(this.maxX) && this.position.x > this.maxX) {
      this.position.x = this.maxX;
      this.speed.x = 0;
    }

    if (Number.isFinite(this.minY) && this.position.y < this.minY) {
      this.position.y = this.minY;
      this.speed.y = 0;
    }
    else if (Number.isFinite(this.maxY) && this.position.y > this.maxY) {
      this.position.y = this.maxY;
      this.speed.y = 0;
    }

    if (this.container) {
      this.container.position.set(engine.width, engine.height)
        .multiply(this.anchor);
      this.container.pivot.copy(this.position);

      if (this.rounding) {
        this.container.position.round();
        this.container.pivot.round();
      }
    }
  }

  /**
   * Shake camera
   * @memberof Camera#
   * @method shake
   * @param {Vector|Number} force Max shake distance in pixel
   * @param {Number} duration  How long will the camera shake
   * @param {Number} count How many times will the camera shake
   * @param {Boolean} forward ONLY shake forward or not
   */
  shake(force, duration, count, forward) {
    if (Number.isFinite(force)) {
      this._shakeForce = this._shakeForce.set(force, force);
    }
    else {
      this._shakeForce = this._shakeForce.set(force.x, force.y);
    }

    this._shakeDelay = Math.floor(duration / count) || 20;
    this._shakeCount = count || 3;
    this._shakeForward = !!forward;

    this._startShake();
  }

  /** @private */
  _startShake() {
    this.isShaking = true;
    if (this._shakeCount > 0) {
      if (this._shakeForward) {
        this._shakeOffset.x = Math.random() * this._shakeForce.x;
        this._shakeOffset.y = Math.random() * this._shakeForce.y;
      }
      else {
        this._shakeOffset.x = (Math.random() * 2 - 1) * this._shakeForce.x;
        this._shakeOffset.y = (Math.random() * 2 - 1) * this._shakeForce.y;
      }

      // Next shake
      this._shakeCount -= 1;
      Timer.later(this._shakeDelay, this._startShake);
    }
    else {
      // Reset offset
      this._shakeOffset.set(0, 0);
      this._setPosition(this.position.x, this.position.y);
      this.isShaking = false;
    }
  }

  /**
   * @memberof Camera#
   * @method moveSensor
   * @private
   */
  moveSensor() {
    const targetBounds = this.target.getLocalBounds();

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
    }
    else if (this._targetRight > this._sensorRight) {
      this.sensor.x = this._targetRight - this.sensor.width;
    }

    if (this._targetTop < this._sensorTop) {
      this.sensor.y = this._targetTop;
    }
    else if (this._targetBottom > this._sensorBottom) {
      this.sensor.y = this._targetBottom - this.sensor.height;
    }
  }

  /**
   * @memberof Camera#
   * @method moveCamera
   * @param {Number} dt Delta time since last frame(in second)
   * @private
   */
  moveCamera(dt) {
    if (!this.target) {return;}

    this.speed.x = clamp(this.position.x - (this.sensor.x + this.sensor.width * 0.5), -this.maxSpeed, this.maxSpeed);
    this.speed.y = clamp(this.position.y - (this.sensor.y + this.sensor.height * 0.5), -this.maxSpeed, this.maxSpeed);

    if (this.speed.x > this.threshold ||
      this.speed.x < -this.threshold ||
      this.speed.y > this.threshold ||
      this.speed.y < -this.threshold
    ) {
      this._setPosition(
        this.position.x - this.speed.x * this.acceleration.x * dt,
        this.position.y - this.speed.y * this.acceleration.y * dt
      );
    }
    else {
      this.speed.set(0, 0);
    }

    if (this.isShaking && this.container) {
      this._setPosition(this.position.x, this.position.y);
      this.container.pivot.subtract(this._shakeOffset);
    }
  }

  /**
   * Remove camera from parent container.
   * @memberof Camera#
   * @method remove
   */
  remove() {
    this.game.off('update', this.update, this);
    this.container = null;
  }

  /**
   * Update method
   * @memberof Camera#
   * @method update
   * @param {Number} dt     Delta time in millisecond
   * @param {Number} delta  Delta time in second
   * @protected
   */
  update(dt, delta) {
    this.delta = delta;

    if (this.target) {
      this.moveSensor(this.delta);
    }
    this.moveCamera(this.delta);

    if (this.container) {
      this.container.scale.set(this.zoom.x, this.zoom.y);
      this.container.rotation = -this.rotation;
    }
  }
}

/**
 * Camera bounds left
 * @memberof Camera#
 * @type {Number}
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
 * @exports engine/Camera
 *
 * @see Camera
 *
 * @requires module:engine/core
 * @requires module:engine/Vector
 * @requires module:engine/utils/math
 */
module.exports = Camera;
