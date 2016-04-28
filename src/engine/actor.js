var EventEmitter = require('engine/eventemitter3');
var Vector = require('engine/vector');
var PIXI = require('engine/pixi');
var physics = require('engine/physics');

var DEFAULT_POLYGON_VERTICES = [
  Vector.create(-4, -4),
  Vector.create( 4, -4),
  Vector.create( 4,  4),
  Vector.create(-4,  4),
];

/**
 * base object that may contain a PIXI.Container instance(as `sprite`)
 * and a physics.Body instance(as `body`).
 * The `sprite` and `body` share the same postion and rotation,
 * designed to be easy to use.
 *
 * @param {String} name   Name of this actor
 */
function Actor(name) {
  EventEmitter.call(this);

  /**
   * @type {Number}
   */
  this.id = Actor.uid++;

  /**
   * Name of this Actor, can be undefined
   * @type {String}
   */
  this.name = name;

  /**
   * Tag for updating
   * @type {String}
   */
  this.tag = null;

  /**
   * Whether this actor is removed from scene
   * @type {Boolean}
   */
  this.removed = false;

  /**
   * Want this actor to be updated?
   * @type {Boolean}
   */
  this.canEverTick = false;

  /**
   * Component for visual display, can be any sub-classes of `PIXI.Cotnainer` or null
   * @type {PIXI.Container}
   */
  this.sprite = null;

  /**
   * Component for physics simulation and collision detection or null.
   * @type {physics.Body}
   */
  this.body = null;

  /**
   * Position
   * @type {Vector}
   * @default (0, 0)
   */
  this.position = Vector.create();

  /**
   * Reference to the scene that actor is added to
   * @type {Scene}
   */
  this.scene = null;
  /**
   * Reference to the container that `sprite` is added to
   * @type {PIXI.Container}
   */
  this.layer = null;

  // @privates
  this._rotation = 0;
}
Actor.prototype = Object.create(EventEmitter.prototype);
Actor.prototype.constructor = Actor;

Actor.uid = 0;

/**
 * Rotation
 */
Object.defineProperty(Actor.prototype, 'rotation', {
  get: function() {
    return this._rotation;
  },
  set: function(val) {
    this._rotation = val;

    if (this.sprite) {
      this.sprite.rotation = this._rotation;
    }
    if (this.body) {
      this.body.rotation = this._rotation;
    }
  },
});

/**
 * Add to the scene and a container
 * @param {Scene} scene
 * @param {PIXI.Container} layer
 * @return {Actor} Actor itself for chaining
 */
Actor.prototype.addTo = function addTo(scene, layer) {
  this.scene = scene;
  this.layer = layer;

  if (this.sprite) {
    this.layer.addChild(this.sprite);
  }
  if (this.body) {
    this.scene.world.addBody(this.body);
  }

  this.prepare();

  return this;
};

/**
 * Will be called by `addTo` method after the Actor components are
 * properly added.
 */
Actor.prototype.prepare = function prepare() {};

/**
 * Update method to be called each frame
 * Nothing inside, no need to call `super.update`
 */
Actor.prototype.update = function update() {};

/**
 * Remove from current scene and layer container
 */
Actor.prototype.remove = function remove() {
  this.removed = true;

  if (this.sprite) {
    this.sprite.remove();
  }
  if (this.body) {
    this.body.remove();
  }

  this.scene = null;
  this.layer = null;
};

// Component factory methods

/**
 * Initialize `sprite` as Sprite
 * @param  {PIXI.Texture} texture
 * @return {Actor}        self for chainning
 */
Actor.prototype.initSprite = function(texture) {
  this.sprite = new PIXI.Sprite(texture);
  this.sprite.position = this.position;
  this.sprite.anchor.set(0.5);

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};

/**
 * Initialize `sprite` as Graphics
 * @param  {Object} settings
 * @param  [settings.shape] {String} default 'Box'
 * @param  [settings.width] {Number} default 8, for 'Box' shapes
 * @param  [settings.height] {Number} default 8, for 'Box' shapes
 * @param  [settings.radius] {Number} default 8, for 'Circle' shapes
 * @param  [settings.points] {Array<Vector>} vertices for 'Polygon' shapes
 * @return {Actor}  self for chainning
 */
Actor.prototype.initGraphics = function(settings_) {
  var settings = settings_ || {};

  this.sprite = new PIXI.Graphics();
  this.sprite.beginFill(settings.color || 0x000000);
  var shape = settings.shape || 'Box';
  if (shape === 'Circle') {
    this.sprite.drawCircle(0, 0, settings.radius || 8);
  }
  else if (shape === 'Box') {
    var w = settings.width || 8;
    var h = settings.height || 8;
    this.sprite.drawRect(-w * 0.5, -h * 0.5, w, h);
  }
  else if (shape === 'Polygon') {
    var points = settings.points || DEFAULT_POLYGON_VERTICES;
    this.sprite.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      this.sprite.lineTo(points[i].x, points[i].y);
    }
  }
  this.sprite.endFill();

  this.sprite.position = this.position;

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};

/**
 * Initialize `sprite` as AnimatedSprite
 * @param settings {Object}
 * @param settings.textures {Array<PIXI.Texture>}
 * @param settings.anims {Array<{ name, frames, settings }>}
 * @return {Actor}  self for chainning
 */
Actor.prototype.initAnimation = function(settings_) {
  var settings = settings_ || {};

  this.sprite = new PIXI.extras.AnimatedSprite(settings.textures);
  this.sprite.anchor.set(0.5);

  var anims = settings.anims;
  if (Array.isArray(anims)) {
    for (var i = 0; i < anims.length; i++) {
      this.sprite.addAnim(anims[i].name, anims[i].frames, anims[i].settings);
    }
  }

  this.sprite.position = this.position;

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};

/**
 * Initialize `body`
 * @param  {Object} settings
 * @param  [settings.shape] {String} default 'Box'
 * @param  [settings.width] {Number} default 8, for 'Box' shapes
 * @param  [settings.height] {Number} default 8, for 'Box' shapes
 * @param  [settings.radius] {Number} default 8, for 'Circle' shapes
 * @param  [settings.points] {Array<Vector>} vertices for 'Polygon' shapes
 * @return {Actor}  self for chainning
 */
Actor.prototype.initBody = function(settings_) {
  var settings = settings_ || {};

  // Create shape
  var shapeInst, shape = settings.shape || 'Box';
  if (shape === 'Circle') {
    var r = settings.radius;
    if (!Number.isFinite(r)) {
      if (this.sprite) {
        r = this.sprite.width / 2;
      }
    }
    shape = new physics.Circle(r);
  }
  else if (shape === 'Box') {
    var w = settings.width, h = settings.height;
    if (!Number.isFinite(w)) {
      if (this.sprite) {
        w = this.sprite.width;
        h = this.sprite.height;
      }
      else {
        w = h = 8;
      }
    }
    else {
      if (!Number.isFinite(h)) {
        h = w;
      }
    }

    shape = new physics.Box(w, h);
  }
  else if (shape === 'Polygon') {
    shape = new physics.Polygon(settings.points || DEFAULT_POLYGON_VERTICES);
  }

  // Cleanup settings
  var bodySettings = Object.assign({}, settings);
  delete bodySettings.shape;
  delete bodySettings.radius;
  delete bodySettings.width;
  delete bodySettings.height;
  delete bodySettings.points;
  bodySettings.shape = shape;

  // Create body
  this.body = new physics.Body(bodySettings);
  this.body.position = this.position;

  if (this.scene) {
    this.scene.world.addBody(this.body);
  }

  return this;
};

module.exports = exports = Actor;
