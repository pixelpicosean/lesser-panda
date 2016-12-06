const math = require('../math');
const RenderTexture = require('../textures/RenderTexture');
const EventEmitter = require('engine/EventEmitter');
const Vector = require('engine/Vector');
const CONST = require('../../const');

const _tempMatrix = new math.Matrix();
const _tempDisplayObjectParent = {
  worldTransform: new math.Matrix(),
  worldAlpha: 1,
  children: [],
};


/**
 * The base class for all objects that are rendered on the screen.
 * This is an abstract class and should not be used on its own rather it should be extended.
 *
 * @class
 * @extends EventEmitter
 */
class DisplayObject extends EventEmitter {
  /**
   * @constructor
   */
  constructor() {
    super();

    /**
     * The coordinate of the object relative to the local coordinates of the parent.
     *
     * @type {Vector}
     */
    this.position = new Vector();

    /**
     * The scale factor of the object.
     *
     * @type {Vector}
     */
    this.scale = new Vector(1, 1);

    /**
     * The pivot point of the displayObject that it rotates around
     *
     * @type {Vector}
     */
    this.pivot = new Vector(0, 0);


    /**
     * The skew factor for the object in radians.
     *
     * @type {Vector}
     */
    this.skew = new Vector(0, 0);

    /**
     * The rotation of the object in radians.
     *
     * @type {Number}
     */
    this.rotation = 0;

    /**
     * The opacity of the object.
     *
     * @type {Number}
     */
    this.alpha = 1;

    /**
     * The visibility of the object. If false the object will not be drawn, and
     * the updateTransform function will not be called.
     *
     * @type {Boolean}
     */
    this.visible = true;

    /**
     * Can this object be rendered, if false the object will not be drawn but the updateTransform
     * methods will still be called.
     *
     * @type {Boolean}
     */
    this.renderable = true;

    /**
     * The display object container that contains this display object.
     *
     * @type {Container}
     * @readonly
     */
    this.parent = null;

    /**
     * The multiplied alpha of the displayObject
     *
     * @type {Number}
     * @readonly
     */
    this.worldAlpha = 1;

    /**
     * Current transform of the object based on world (parent) factors
     *
     * @type {Matrix}
     * @readonly
     */
    this.worldTransform = new math.Matrix();

    /**
     * The area the filter is applied to. This is used as more of an optimisation
     * rather than figuring out the dimensions of the displayObject each frame you can set this rectangle
     *
     * @type {Rectangle}
     */
    this.filterArea = null;

    /**
     * cached sin rotation
     *
     * @type {Number}
     * @private
     */
    this._sr = 0;

    /**
     * cached cos rotation
     *
     * @type {Number}
     * @private
     */
    this._cr = 1;

    /**
     * The original, cached bounds of the object
     *
     * @type {Rectangle}
     * @private
     */
    this._bounds = new math.Rectangle(0, 0, 1, 1);

    /**
     * The most up-to-date bounds of the object
     *
     * @type {Rectangle}
     * @private
     */
    this._currentBounds = null;

    /**
     * The original, cached mask of the object
     *
     * @type {Rectangle}
     * @private
     */
    this._mask = null;

    /**
     * Reference to the gfx system this object is added to
     * @type {SystemGfx}
     * @private
     */
    this._system = null;
  }

  /**
   * Returns the global position of the displayObject.
   *
   * @memberof DisplayObject#
   * @param {Vector} point the point to write the global value to. If null a new point will be returned
   * @return {Vector} Global position vector
   */
  getGlobalPosition(point) {
    point = point || Vector.create();

    if (this.parent) {
      this.displayObjectUpdateTransform();

      point.x = this.worldTransform.tx;
      point.y = this.worldTransform.ty;
    }
    else {
      point.x = this.position.x;
      point.y = this.position.y;
    }

    return point;
  }
}

Object.defineProperties(DisplayObject.prototype, {
  /**
   * The position of the displayObject on the x axis relative to the local coordinates of the parent.
   *
   * @member {Number}
   * @memberof DisplayObject#
   */
  x: {
    get: function() {
      return this.position.x;
    },
    set: function(value) {
      this.position.x = value;
    },
  },

  /**
   * The position of the displayObject on the y axis relative to the local coordinates of the parent.
   *
   * @member {Number}
   * @memberof DisplayObject#
   */
  y: {
    get: function() {
      return this.position.y;
    },
    set: function(value) {
      this.position.y = value;
    },
  },

  /**
   * Indicates if the sprite is globally visible.
   *
   * @member {boolean}
   * @memberof DisplayObject#
   * @readonly
   */
  worldVisible: {
    get: function() {
      var item = this;

      do {
        if (!item.visible) {
          return false;
        }

        item = item.parent;
      } while (item);

      return true;
    },
  },

  /**
   * Sets a mask for the displayObject. A mask is an object that limits the visibility of an object to the shape of the mask applied to it.
   * A regular mask must be a Graphics or a Sprite object. This allows for much faster masking in canvas as it utilises shape clipping.
   * To remove a mask, set this property to null.
   *
   * @todo For the moment, CanvasRenderer doesn't support Sprite as mask.
   *
   * @member {Graphics|Sprite}
   * @memberof DisplayObject#
   */
  mask: {
    get: function() {
      return this._mask;
    },
    set: function(value) {
      if (this._mask) {
        this._mask.renderable = true;
      }

      this._mask = value;

      if (this._mask) {
        this._mask.renderable = false;
      }
    },
  },

  /**
   * Sets the filters for the displayObject.
   * * IMPORTANT: This is a WebGL only feature and will be ignored by the canvas renderer.
   * To remove filters simply set this property to 'null'
   *
   * @member {AbstractFilter[]}
   * @memberof DisplayObject#
   */
  filters: {
    get: function() {
      return this._filters && this._filters.slice();
    },
    set: function(value) {
      this._filters = value && value.slice();
    },
  },

  system: {
    get: function() {
      return this._system;
    },
    set: function(value) {
      this._system = value;

      if (Array.isArray(this.children)) {
        for (var i = 0; i < this.children.length; i++) {
          this.children[i].system = value;
        }
      }
    },
  },

});

DisplayObject.prototype.remove = function() {
  if (this.parent) {
    this.parent.removeChild(this);
  }
};

DisplayObject.prototype.addTo = function(container) {
  container.addChild(this);
  return this;
};

/*
 * Updates the object transform for rendering
 *
 * TODO - Optimization pass!
 */
DisplayObject.prototype.updateTransform = function() {
  // create some matrix refs for easy access
  var pt = this.parent.worldTransform;
  var wt = this.worldTransform;

  // temporary matrix variables
  var a, b, c, d, tx, ty;

  // looks like we are skewing
  if (this.skew.x || this.skew.y) {
    // I'm assuming that skewing is not going to be very common
    // With that in mind, we can do a full setTransform using the temp matrix
    _tempMatrix.setTransform(
            this.position.x,
            this.position.y,
            this.pivot.x,
            this.pivot.y,
            this.scale.x,
            this.scale.y,
            this.rotation,
            this.skew.x,
            this.skew.y
        );

    // now concat the matrix (inlined so that we can avoid using copy)
    wt.a = _tempMatrix.a * pt.a + _tempMatrix.b * pt.c;
    wt.b = _tempMatrix.a * pt.b + _tempMatrix.b * pt.d;
    wt.c = _tempMatrix.c * pt.a + _tempMatrix.d * pt.c;
    wt.d = _tempMatrix.c * pt.b + _tempMatrix.d * pt.d;
    wt.tx = _tempMatrix.tx * pt.a + _tempMatrix.ty * pt.c + pt.tx;
    wt.ty = _tempMatrix.tx * pt.b + _tempMatrix.ty * pt.d + pt.ty;
  }
  else {
    // so if rotation is between 0 then we can simplify the multiplication process...
    if (this.rotation % CONST.PI_2) {
      // check to see if the rotation is the same as the previous render. This means we only need to use sin and cos when rotation actually changes
      if (this.rotation !== this.rotationCache) {
        this.rotationCache = this.rotation;
        this._sr = Math.sin(this.rotation);
        this._cr = Math.cos(this.rotation);
      }

      // get the matrix values of the displayobject based on its transform properties..
      a = this._cr * this.scale.x;
      b = this._sr * this.scale.x;
      c = -this._sr * this.scale.y;
      d = this._cr * this.scale.y;
      tx = this.position.x;
      ty = this.position.y;

      // check for pivot.. not often used so geared towards that fact!
      if (this.pivot.x || this.pivot.y) {
        tx -= this.pivot.x * a + this.pivot.y * c;
        ty -= this.pivot.x * b + this.pivot.y * d;
      }

      // concat the parent matrix with the objects transform.
      wt.a = a * pt.a + b * pt.c;
      wt.b = a * pt.b + b * pt.d;
      wt.c = c * pt.a + d * pt.c;
      wt.d = c * pt.b + d * pt.d;
      wt.tx = tx * pt.a + ty * pt.c + pt.tx;
      wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    }
    else {
      // lets do the fast version as we know there is no rotation..
      a = this.scale.x;
      d = this.scale.y;

      tx = this.position.x - this.pivot.x * a;
      ty = this.position.y - this.pivot.y * d;

      wt.a = a * pt.a;
      wt.b = a * pt.b;
      wt.c = d * pt.c;
      wt.d = d * pt.d;
      wt.tx = tx * pt.a + ty * pt.c + pt.tx;
      wt.ty = tx * pt.b + ty * pt.d + pt.ty;
    }
  }

  // multiply the alphas..
  this.worldAlpha = this.alpha * this.parent.worldAlpha;

  // reset the bounds each time this is called!
  this._currentBounds = null;
};

// performance increase to avoid using call.. (10x faster)
DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;

/**
 *
 *
 * Retrieves the bounds of the displayObject as a rectangle object
 *
 * @param {Matrix} matrix Matrix to calculate bounds from.
 * @return {Rectangle} the rectangular bounding area
 */
DisplayObject.prototype.getBounds = function(matrix) { /* eslint no-unused-vars:0 */
  return math.Rectangle.EMPTY;
};

/**
 * Retrieves the local bounds of the displayObject as a rectangle object
 *
 * @return {Rectangle} the rectangular bounding area
 */
DisplayObject.prototype.getLocalBounds = function() {
  return this.getBounds(math.Matrix.IDENTITY);
};

/**
 * Calculates the global position of the display object
 *
 * @param {Vector} position The world origin to calculate from
 * @return {Vector} A point object representing the position of this object
 */
DisplayObject.prototype.toGlobal = function(position) {
    // this parent check is for just in case the item is a root object.
    // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
    // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
  if (!this.parent) {
    this.parent = _tempDisplayObjectParent;
    this.displayObjectUpdateTransform();
    this.parent = null;
  }
  else {
    this.displayObjectUpdateTransform();
  }

    // don't need to update the lot
  return this.worldTransform.apply(position);
};

/**
 * Calculates the local position of the display object relative to another point
 *
 * @param {Vector} position       The world origin to calculate from
 * @param {DisplayObject} [from]  The DisplayObject to calculate the global position from
 * @param {Vector} [point]        A Point object in which to store the value, optional (otherwise will create a new Point)
 * @return {Vector} A point object representing the position of this object
 */
DisplayObject.prototype.toLocal = function(position, from, point) {
  if (from) {
    position = from.toGlobal(position);
  }

  // this parent check is for just in case the item is a root object.
  // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
  // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
  if (!this.parent) {
    this.parent = _tempDisplayObjectParent;
    this.displayObjectUpdateTransform();
    this.parent = null;
  }
  else {
    this.displayObjectUpdateTransform();
  }

  // simply apply the matrix..
  return this.worldTransform.applyInverse(position, point);
};

/**
 * Renders the object using the WebGL renderer
 *
 * @param {WebGLRenderer} renderer The renderer
 * @private
 */
DisplayObject.prototype.renderWebGL = function(renderer) { /* eslint no-unused-vars:0 */
  // OVERWRITE;
};

/**
 * Renders the object using the Canvas renderer
 *
 * @param {CanvasRenderer} renderer The renderer
 * @private
 */
DisplayObject.prototype.renderCanvas = function(renderer) { /* eslint no-unused-vars:0 */
  // OVERWRITE;
};
/**
 * Useful function that returns a texture of the display object that can then be used to create sprites
 * This can be quite useful if your displayObject is static / complicated and needs to be reused multiple times.
 *
 * @param {CanvasRenderer|WebGLRenderer} renderer The renderer used to generate the texture.
 * @param {Number} scaleMode                      See {@link SCALE_MODES} for possible values
 * @param {Number} resolution                     The resolution of the texture being generated
 * @return {Texture} a texture of the display object
 */
DisplayObject.prototype.generateTexture = function(renderer, scaleMode, resolution) {
  var bounds = this.getLocalBounds();

  var renderTexture = new RenderTexture(renderer, bounds.width | 0, bounds.height | 0, scaleMode, resolution);

  _tempMatrix.tx = -bounds.x;
  _tempMatrix.ty = -bounds.y;

  renderTexture.render(this, _tempMatrix);

  return renderTexture;
};

/**
 * Set the parent Container of this DisplayObject
 *
 * @param {Container} container   The Container to add this DisplayObject to
 * @return {Container} The Container that this DisplayObject was added to
 */
DisplayObject.prototype.setParent = function(container) {
  if (!container || !container.addChild) {
    throw new Error('setParent: Argument must be a Container');
  }

  container.addChild(this);
  return container;
};

/**
 * Convenience function to set the postion, scale, skew and pivot at once.
 *
 * @param {Number} [x=0]        The X position
 * @param {Number} [y=0]        The Y position
 * @param {Number} [scaleX=1]   The X scale value
 * @param {Number} [scaleY=1]   The Y scale value
 * @param {Number} [rotation=0] The rotation
 * @param {Number} [skewX=0]    The X skew value
 * @param {Number} [skewY=0]    The Y skew value
 * @param {Number} [pivotX=0]   The X pivot value
 * @param {Number} [pivotY=0]   The Y pivot value
 * @return {DisplayObject} This for chaining.
 */
DisplayObject.prototype.setTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY) {
  this.position.x = x || 0;
  this.position.y = y || 0;
  this.scale.x = !scaleX ? 1 : scaleX;
  this.scale.y = !scaleY ? 1 : scaleY;
  this.rotation = rotation || 0;
  this.skew.x = skewX || 0;
  this.skew.y = skewY || 0;
  this.pivot.x = pivotX || 0;
  this.pivot.y = pivotY || 0;
  return this;
};

/**
 * Base destroy method for generic display objects
 */
DisplayObject.prototype.destroy = function() {

  this.position = null;
  this.scale = null;
  this.pivot = null;
  this.skew = null;

  this.parent = null;

  this._bounds = null;
  this._currentBounds = null;
  this._mask = null;

  this.worldTransform = null;
  this.filterArea = null;
};

module.exports = DisplayObject;
