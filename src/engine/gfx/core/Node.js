const math = require('./math');
const { removeItems } = require('./utils');
const EventEmitter = require('engine/EventEmitter');
const RenderTexture = require('./textures/RenderTexture');
const CONST = require('../const');
const Vector = require('engine/Vector');

const _tempMatrix = new math.Matrix();
const _tempDisplayObjectParent = {
  worldTransform: new math.Matrix(),
  worldAlpha: 1,
  children: [],
};

const EMPTY_ARRAY = [];

/**
 * Node is the basic graphic element, that can be added to other nodes as children.
 * It is also the base class of all display objects.
 *
 *```js
 * var container = new Node();
 * container.addChild(some_sprite);
 * ```
 * @class
 * @extends EventEmitter
 */
class Node extends EventEmitter {
  get key() {
    return 'gfx';
  }
  /**
   * @constructor
   */
  constructor() {
    super();

    /**
     * The entity this node is attached to
     * @type {Entity}
     */
    this.entity = null;

    /**
     * The coordinate of the node relative to the local coordinates of the parent.
     *
     * @type {Vector}
     */
    this.position = Vector.create();

    /**
     * The scale factor of the node.
     *
     * @type {Vector}
     */
    this.scale = Vector.create(1, 1);

    /**
     * The pivot point of the node that it rotates around
     *
     * @type {Vector}
     */
    this.pivot = Vector.create(0, 0);


    /**
     * The skew factor for the node in radians.
     *
     * @type {Vector}
     */
    this.skew = Vector.create(0, 0);

    /**
     * The rotation of the node in radians.
     * @private
     * @type {Number}
     */
    this._rotation = 0;

    /**
     * The opacity of the node.
     *
     * @type {Number}
     */
    this.alpha = 1;

    /**
     * The visibility of the node. If false the node will not be drawn, and
     * the updateTransform function will not be called.
     *
     * @type {Boolean}
     */
    this.visible = true;

    /**
     * Can this node be rendered, if false the node will not be drawn but the updateTransform
     * methods will still be called.
     *
     * @type {Boolean}
     */
    this.renderable = true;

    /**
     * The node that contains this one.
     *
     * @type {Node}
     * @readonly
     */
    this.parent = null;

    /**
     * The list of children added to this node.
     *
     * @member {Node[]}
     * @readonly
     */
    this.children = [];

    /**
     * The multiplied alpha of the node
     *
     * @type {Number}
     * @readonly
     */
    this.worldAlpha = 1;

    /**
     * Current transform of the node based on world (parent) factors
     *
     * @type {Matrix}
     * @readonly
     */
    this.worldTransform = new math.Matrix();

    /**
     * The area the filter is applied to. This is used as more of an optimisation
     * rather than figuring out the dimensions of the node each frame you can set this rectangle
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
     * The original, cached bounds of the node
     *
     * @type {Rectangle}
     * @private
     */
    this._bounds = new math.Rectangle(0, 0, 1, 1);

    /**
     * The most up-to-date bounds of the node
     *
     * @type {Rectangle}
     * @private
     */
    this._currentBounds = null;

    /**
     * The original, cached mask of the node
     *
     * @type {Rectangle}
     * @private
     */
    this._mask = null;

    /**
     * Reference to the gfx system this node is renderer by
     * @type {SystemGfx}
     * @private
     */
    this._system = null;
  }

  attach(entity) {
    // Recycle vectors if this is not attached to Entity
    if (!this.entity) {
      Vector.recycle(this.position);
    }

    // Replace the vectors with the entity
    this.position = entity.position;

    this.entity = entity;
  }
  detach() {
    if (this.entity) {
      // De-reference to the entity's vectors
      this.position = this.position.clone();

      this.entity = null;
    }
  }

  /**
   * Overridable method that can be used by `Node` subclasses whenever the children list is modified
   * @memberof Node#
   * @private
   */
  onChildrenChange() {}

  /**
   * Adds a child to this node.
   * You can also add multple items like so: myContainer.addChild(thinkOne, thingTwo, thingThree)
   * @memberof Node#
   * @param {Node} child The Node to add to the container
   * @return {Node} The child that was added
   */
  addChild(child) {
    var argumentsLength = arguments.length;

    // if there is only one argument we can bypass looping through the them
    if (argumentsLength > 1) {
      // loop through the arguments property and add all children
      // use it the right way (.length and [i]) so that this function can still be optimised by JS runtimes
      for (var i = 0; i < argumentsLength; i++) {
        this.addChild(arguments[i]);
      }
    }
    else {
      // if the child has a parent then lets remove it as nodes can only exist in one place
      if (child.parent) {
        child.parent.removeChild(child);
      }

      child.parent = this;
      child.system = this.system;

      this.children.push(child);

      // TODO - lets either do all callbacks or all events.. not both!
      this.onChildrenChange(this.children.length - 1);
      child.emit('added', this);
    }

    return child;
  }

  /**
   * Adds a child to this node at a specified index. If the index is out of bounds an error will be thrown
   * @memberof Node#
   * @param {Node} child      The child to add
   * @param {Number} index    The index to place the child at
   * @return {Node} The child that was just added
   */
  addChildAt(child, index) {
    if (index >= 0 && index <= this.children.length) {
      if (child.parent) {
        child.parent.removeChild(child);
      }

      child.parent = this;
      child.system = this.system;

      this.children.splice(index, 0, child);

      // TODO - lets either do all callbacks or all events.. not both!
      this.onChildrenChange(index);
      child.emit('added', this);

      return child;
    }
    else {
      throw new Error(child + 'addChildAt: The index ' + index + ' supplied is out of bounds ' + this.children.length);
    }
  }

  /**
   * Swaps the position of 2 children within this node.
   * @memberof Node#
   * @param {Node} child   Child to swap
   * @param {Node} child2  Child to swap
   */
  swapChildren(child, child2) {
    if (child === child2) {
      return;
    }

    var index1 = this.getChildIndex(child);
    var index2 = this.getChildIndex(child2);

    if (index1 < 0 || index2 < 0) {
      throw new Error('swapChildren: Both the supplied Node must be children of the caller.');
    }

    this.children[index1] = child2;
    this.children[index2] = child;
    this.onChildrenChange(index1 < index2 ? index1 : index2);
  }

  /**
   * Returns the index position of a child Node instance
   * @memberof Node#
   * @param {Node} child The node instance to identify
   * @return {Number} The index position of the child node to identify
   */
  getChildIndex(child) {
    var index = this.children.indexOf(child);

    if (index === -1) {
      throw new Error('The supplied Node must be a child of the caller');
    }

    return index;
  }

  /**
   * Changes the position of an existing child in the display object container
   * @memberof Node#
   * @param {Node} child      The child Node instance for which you want to change the index number
   * @param {Number} index    The resulting index number for the child node
   */
  setChildIndex(child, index) {
    if (index < 0 || index >= this.children.length) {
      throw new Error('The supplied index is out of bounds');
    }

    var currentIndex = this.getChildIndex(child);

    removeItems(this.children, currentIndex, 1); // remove from old position
    this.children.splice(index, 0, child); // add at new position
    this.onChildrenChange(index);
  }

  /**
   * Returns the child at the specified index
   * @memberof Node#
   * @param {Number} index The index to get the child at
   * @return {Node} The child at the given index, if any.
   */
  getChildAt(index) {
    if (index < 0 || index >= this.children.length) {
      throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied Node is not a child of the caller');
    }

    return this.children[index];
  }

  /**
   * Removes a child from this node.
   * @memberof Node#
   * @param {Node} child The Node to remove
   * @return {Node} The child that was removed.
   */
  removeChild(child) {
    var argumentsLength = arguments.length;

    // if there is only one argument we can bypass looping through the them
    if (argumentsLength > 1) {
      // loop through the arguments property and add all children
      // use it the right way (.length and [i]) so that this function can still be optimised by JS runtimes
      for (var i = 0; i < argumentsLength; i++) {
        this.removeChild(arguments[i]);
      }
    }
    else {
      var index = this.children.indexOf(child);

      if (index === -1) {
        return;
      }

      child.parent = null;
      child.system = null;
      removeItems(this.children, index, 1);

      // TODO - lets either do all callbacks or all events.. not both!
      this.onChildrenChange(index);
      child.emit('removed', this);
    }

    return child;
  }

  /**
   * Removes a child from the specified index position.
   * @memberof Node#
   * @param {Number} index The index to get the child from
   * @return {Node} The child that was removed.
   */
  removeChildAt(index) {
    var child = this.getChildAt(index);

    child.parent = null;
    child.system = null;
    removeItems(this.children, index, 1);

    // TODO - lets either do all callbacks or all events.. not both!
    this.onChildrenChange(index);
    child.emit('removed', this);

    return child;
  }

  /**
   * Removes all children from this node that are within the begin and end indexes.
   * @memberof Node#
   * @param {Number} beginIndex The beginning position. Default value is 0.
   * @param {Number} endIndex   The ending position. Default value is size of this node.
   * @return {Array} Children removed from this node.
   */
  removeChildren(beginIndex, endIndex) {
    var begin = beginIndex || 0;
    var end = typeof endIndex === 'number' ? endIndex : this.children.length;
    var range = end - begin;
    var removed, i;

    if (range > 0 && range <= end) {
      removed = this.children.splice(begin, range);

      for (i = 0; i < removed.length; ++i) {
        removed[i].parent = null;
        removed[i].system = null;
      }

      this.onChildrenChange(beginIndex);

      for (i = 0; i < removed.length; ++i) {
        removed[i].emit('removed', this);
      }

      return removed;
    }
    else if (range === 0 && this.children.length === 0) {
      return EMPTY_ARRAY;
    }
    else {
      throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
    }
  }

  /**
   * Remove this node from its parent (if exist)
   * @memberof Node#
   */
  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  /**
   * Add this object to another node
   * @memberof Node#
   * @param {Node} container Node to add to
   * @return {Node} Self for chaining
   */
  addTo(container) {
    container.addChild(this);
    return this;
  }

  /**
   * Useful function that returns a texture of the node that can then be used to create sprites
   * This can be quite useful if your Node is static / complicated and needs to be reused multiple times.
   * @memberof Node#
   * @param {CanvasRenderer|WebGLRenderer} renderer The renderer used to generate the texture
   * @param {Number} resolution                     The resolution of the texture being generated
   * @param {Number} scaleMode                      See {@link SCALE_MODES} for possible values
   * @return {Texture} a texture of the node
   */
  generateTexture(renderer, resolution, scaleMode) {
    var bounds = this.getLocalBounds();

    var renderTexture = new RenderTexture(renderer, bounds.width | 0, bounds.height | 0, scaleMode, resolution);

    _tempMatrix.tx = -bounds.x;
    _tempMatrix.ty = -bounds.y;

    renderTexture.render(this, _tempMatrix);

    return renderTexture;
  }

  /**
   * Updates the transform on all children of this node for rendering
   * @memberof Node#
   * @private
   */
  updateTransform() {
    if (!this.visible) {
      return;
    }

    this.displayObjectUpdateTransform();

    for (var i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].updateTransform();
    }
  }

  /*
   * Updates the object transform for rendering
   *
   * TODO - Optimization pass!
   */
  displayObjectUpdateTransform() {
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
  }

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
   * @return {Node} This for chaining.
   */
  setTransform(x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY) {
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
  }

  /**
   * Retrieves the bounds of the Node as a rectangle. The bounds calculation takes all visible children into consideration.
   * @memberof Node#
   * @return {Rectangle} The rectangular bounding area
   */
  getBounds() {
    if (!this._currentBounds) {

      if (this.children.length === 0) {
        return math.Rectangle.EMPTY;
      }

      // TODO the bounds have already been calculated this render session so return what we have

      var minX = Infinity;
      var minY = Infinity;

      var maxX = -Infinity;
      var maxY = -Infinity;

      var childBounds;
      var childMaxX;
      var childMaxY;

      var childVisible = false;

      for (var i = 0, j = this.children.length; i < j; ++i) {
        var child = this.children[i];

        if (!child.visible) {
          continue;
        }

        childVisible = true;

        childBounds = this.children[i].getBounds();

        minX = minX < childBounds.x ? minX : childBounds.x;
        minY = minY < childBounds.y ? minY : childBounds.y;

        childMaxX = childBounds.width + childBounds.x;
        childMaxY = childBounds.height + childBounds.y;

        maxX = maxX > childMaxX ? maxX : childMaxX;
        maxY = maxY > childMaxY ? maxY : childMaxY;
      }

      if (!childVisible) {
        return math.Rectangle.EMPTY;
      }

      var bounds = this._bounds;

      bounds.x = minX;
      bounds.y = minY;
      bounds.width = maxX - minX;
      bounds.height = maxY - minY;

      this._currentBounds = bounds;
    }

    return this._currentBounds;
  }

  /**
   * Retrieves the non-global local bounds of the Node as a rectangle.
   * The calculation takes all visible children into consideration.
   * @memberof Node#
   * @return {Rectangle} The rectangular bounding area
   */
  getLocalBounds() {
    var matrixCache = this.worldTransform;

    this.worldTransform = math.Matrix.IDENTITY;

    for (var i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].updateTransform();
    }

    this.worldTransform = matrixCache;

    this._currentBounds = null;

    return this.getBounds(math.Matrix.IDENTITY);
  }

  /**
   * Returns the global position of the displayObject.
   *
   * @memberof Node#
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

  /**
   * Calculates the global position of this node
   *
   * @param {Vector} position The world origin to calculate from
   * @return {Vector} A point representing the position of this node
   */
  toGlobal(position) {
    // this parent check is for just in case the item is a root node.
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
  }

  /**
   * Calculates the local position of this node relative to another point
   *
   * @param {Vector} position       The world origin to calculate from
   * @param {Node} [from]  The Node to calculate the global position from
   * @param {Vector} [point]        A Point in which to store the value, optional (otherwise will create a new Point)
   * @return {Vector} A point representing the position of this node
   */
  toLocal(position, from, point) {
    if (from) {
      position = from.toGlobal(position);
    }

    // this parent check is for just in case the item is a root node.
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
  }

  /**
   * Renders the object using the WebGL renderer
   * @memberof Node#
   * @param {WebGLRenderer} renderer The renderer
   */
  renderWebGL(renderer) {

    // if the object is not visible or the alpha is 0 then no need to render this element
    if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
      return;
    }

    var i, j;

    // do a quick check to see if this element has a mask or a filter.
    if (this._mask || this._filters) {
      renderer.currentRenderer.flush();

      // push filter first as we need to ensure the stencil buffer is correct for any masking
      if (this._filters && this._filters.length) {
        renderer.filterManager.pushFilter(this, this._filters);
      }

      if (this._mask) {
        renderer.maskManager.pushMask(this, this._mask);
      }

      renderer.currentRenderer.start();

      // add this object to the batch, only rendered if it has a texture.
      this._renderWebGL(renderer);

      // now loop through the children and make sure they get rendered
      for (i = 0, j = this.children.length; i < j; i++) {
        this.children[i].renderWebGL(renderer);
      }

      renderer.currentRenderer.flush();

      if (this._mask) {
        renderer.maskManager.popMask(this, this._mask);
      }

      if (this._filters) {
        renderer.filterManager.popFilter();

      }
      renderer.currentRenderer.start();
    }
    else {
      this._renderWebGL(renderer);

      // simple render children!
      for (i = 0, j = this.children.length; i < j; ++i) {
        this.children[i].renderWebGL(renderer);
      }
    }
  }

  /**
   * To be overridden by the subclass
   * @memberof Node#
   * @param {WebGLRenderer} renderer The renderer
   * @private
   */
  _renderWebGL(renderer) {/* eslint no-unused-vars:0 */
    // this is where content itself gets rendered...
  }

  /**
   * To be overridden by the subclass
   * @memberof Node#
   * @param {CanvasRenderer} renderer The renderer
   * @private
   */
  _renderCanvas(renderer) { /* eslint no-unused-vars:0 */
    // this is where content itself gets rendered...
  }


  /**
   * Renders this node using the Canvas renderer
   * @memberof Node#
   * @param {CanvasRenderer} renderer The renderer
   */
  renderCanvas(renderer) {
    // if not visible or the alpha is 0 then no need to render this
    if (!this.visible || this.alpha <= 0 || !this.renderable) {
      return;
    }

    if (this._mask) {
      renderer.maskManager.pushMask(this._mask, renderer);
    }

    this._renderCanvas(renderer);
    for (var i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].renderCanvas(renderer);
    }

    if (this._mask) {
      renderer.maskManager.popMask(renderer);
    }
  }

  /**
   * Destroys the node
   * @memberof Node#
   * @param {Boolean} [destroyChildren=false] if set to true, all the children will have their destroy method called as well
   */
  destroy(destroyChildren) {
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

    if (destroyChildren) {
      for (var i = 0, j = this.children.length; i < j; ++i) {
        this.children[i].destroy(destroyChildren);
      }
    }

    this.removeChildren();

    this.children = null;
  }
}

// performance increase to avoid using call.. (10x faster)
Node.prototype.containerUpdateTransform = Node.prototype.updateTransform;
Node.prototype.containerGetBounds = Node.prototype.getBounds;

Object.defineProperties(Node.prototype, {
  /**
   * The position of this Node on the x axis relative to the local coordinates of the parent.
   *
   * @member {Number}
   * @memberof Node#
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
   * The position of this Node on the y axis relative to the local coordinates of the parent.
   *
   * @member {Number}
   * @memberof Node#
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
   * The rotation of the node in radians.
   * @type {Number}
   */
  rotation: {
    get: function() {
      return (this.entity) ? this.entity.rotation : this._rotation;
    },
    set: function(value) {
      this._rotation = value;
      if (this.entity) {
        this.entity.rotation = value;
      }
    },
  },

  /**
   * Indicates if this node is globally visible.
   *
   * @member {Boolean}
   * @memberof Node#
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
   * Sets a mask for this Node. A mask is an object that limits the visibility of an object to the shape of the mask applied to it.
   * A regular mask must be a Graphics or a Sprite object. This allows for much faster masking in canvas as it utilises shape clipping.
   * To remove a mask, set this property to null.
   *
   * @todo For the moment, CanvasRenderer doesn't support Sprite as mask.
   *
   * @member {Graphics|Sprite}
   * @memberof Node#
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
   * Sets the filters for this Node.
   * * IMPORTANT: This is a WebGL only feature and will be ignored by the canvas renderer.
   * To remove filters simply set this property to 'null'
   *
   * @member {AbstractFilter[]}
   * @memberof Node#
   */
  filters: {
    get: function() {
      return this._filters && this._filters.slice();
    },
    set: function(value) {
      this._filters = value && value.slice();
    },
  },

  /**
   * Sets the gfx system this node will be rendered with
   *
   * @member {SystemGfx}
   * @memberof Node#
   */
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

  /**
   * The width of the Node, setting this will actually modify the scale to achieve the value set
   *
   * @member {Number}
   * @memberof Node#
   */
  width: {
    get: function() {
      return this.scale.x * this.getLocalBounds().width;
    },
    set: function(value) {
      var width = this.getLocalBounds().width;

      if (width !== 0) {
        this.scale.x = value / width;
      }
      else {
        this.scale.x = 1;
      }
    },
  },

  /**
   * The height of the Node, setting this will actually modify the scale to achieve the value set
   *
   * @member {Number}
   * @memberof Node#
   */
  height: {
    get: function() {
      return this.scale.y * this.getLocalBounds().height;
    },
    set: function(value) {
      var height = this.getLocalBounds().height;

      if (height !== 0) {
        this.scale.y = value / height;
      }
      else {
        this.scale.y = 1;
      }
    },
  },
});

/**
 * @module engine/gfx/core/Node
 */
module.exports = Node;
