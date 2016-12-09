const core = require('engine/core');
const System = require('engine/system');
const Vector = require('engine/Vector');
const { removeItems } = require('engine/utils/array');
const WebGLRenderer = require('./core/renderers/webgl/WebGLRenderer');
const CanvasRenderer = require('./core/renderers/canvas/CanvasRenderer');
const { isWebGLSupported } = require('./core/utils');
const CONST = require('./const');
const Node = require('./Node');
const config = require('game/config');

// General asset middlewares (including texture support)
const loader = require('engine/loader');
const { Resource } = loader;
const blobMiddlewareFactory = require('engine/loader/middlewares/parsing/blob').blobMiddlewareFactory;
const textureParser = require('./loaders/textureParser');
const spritesheetParser = require('./loaders/spritesheetParser');
const bitmapFontParser = require('./loaders/bitmapFontParser');
Resource.setExtensionXhrType('fnt', Resource.XHR_RESPONSE_TYPE.DOCUMENT);

// - parse any blob into more usable objects (e.g. Image)
loader.use(blobMiddlewareFactory());
// - parse any Image objects into textures
loader.use(textureParser());
// - parse any spritesheet data into multiple textures
loader.use(spritesheetParser());
// - parse any spritesheet data into multiple textures
loader.use(bitmapFontParser());

// System
let sharedRenderer = null;
const Zero = Vector.create(0, 0);

/**
 * Graphic system.
 */
class SystemGfx extends System {
  /**
   * @constructor
   */
  constructor() {
    super();

    /**
     * Name of this system.
     * @memberof SystemGfx#
     * @type {String}
     */
    this.name = 'Gfx';

    if (!sharedRenderer) {
      let options = {
        view: core.view,
        transparent: config.gfx.transparent,
        antialias: config.gfx.antialias,
        preserveDrawingBuffer: config.gfx.preserveDrawingBuffer,
        resolution: core.resolution,
        roundPixels: true,
      };

      if (config.gfx.webgl && isWebGLSupported()) {
        sharedRenderer = new WebGLRenderer(config.width || 320, config.height || 200, options);
      }
      else {
        sharedRenderer = new CanvasRenderer(config.width || 320, config.height || 200, options);
      }

      // Setup default scale mode
      CONST.SCALE_MODES.DEFAULT = CONST.SCALE_MODES[config.gfx.scaleMode.toUpperCase()];
    }

    /**
     * Shared renderer instance.
     * @memberof SystemGfx#
     * @type {Renderer}
     */
    this.renderer = sharedRenderer;

    /**
     * Root drawing element.
     * @memberof SystemGfx#
     * @type {Node}
     */
    this.root = Node();
    this.root.system = this;

    /**
     * Map of layer containers.
     * @memberof SystemGfx#
     * @type {Object}
     */
    this.layers = {};

    /**
     * Background color cache
     * @type {Number|String}
     * @private
     */
    this._backgroundColor = 0x000000;

    this.timestamp = 0;
    this.delta = 0;

    this.animList = [];
  }

  /**
   * Background color setter
   * @param  {Number} c Color to set
   */
  set backgroundColor(c) {
    this.renderer.backgroundColor = this._backgroundColor = c;
  }
  /**
   * Background color getter
   * @return {Number} Background color as number
   */
  get backgroundColor() {
    return this._backgroundColor;
  }

  /**
   * Mouse position getter. Require the `engine/gfx/interaction` before
   * using.
   * @return {Vector} Mouse position
   */
  get mouse() {
    if (this.renderer.plugins.interaction) {
      return this.renderer.plugins.interaction.mouse.global;
    }
    else {
      return Zero.set(0, 0);
    }
  }

  /**
   * Request animating an item
   * @param  {Node} item Item to be animated
   * @private
   */
  requestAnimate(item) {
    let idx = this.animList.indexOf(item);
    if (idx < 0) {
      this.animList.push(item);
    }
  }
  /**
   * Cancel the request of an animating
   * @param  {Node} item Item to be canceled
   * @private
   */
  cancelAnimate(item) {
    let idx = this.animList.indexOf(item);
    if (idx >= 0) {
      removeItems(this.animList, idx, 1);
    }
  }

  /**
   * Awake callback
   */
  awake() {
    this.renderer.backgroundColor = this._backgroundColor;
    this.timestamp = performance.now();
  }
  /**
   * Update callback
   */
  update() {
    this.renderer.render(this.root);
  }
  /**
   * Fixed update callback
   * @param {Number} delta Delta time in ms
   */
  fixedUpdate(delta) {
    this.delta = delta;

    for (let i = this.animList.length - 1; i >= 0; i--) {
      this.animList[i].update(this.delta);
    }
  }

  /**
   * Create a layer
   * @param  {String} name   Name of this layer
   * @param  {String} parent Which layer to add this into
   * @return {SystemGfx}     Self for chaining
   */
  createLayer(name, parent) {
    if (this.layers[name]) {
      console.log(`Layer "${name}" already exist!`);
      return this;
    }

    let c;
    if (!parent) {
      c = this.root;
    }
    else if (this.layers.hasOwnProperty(parent)) {
      c = this.layers[parent];
    }
    else {
      console.log(`Parent layer "${parent}" does not exist!`);
      return this;
    }

    this.layers[name] = Node().addTo(c);

    return this;
  }

  /**
   * Entity spawn callback
   * @param {Entity} ent Entity to be spawned
   */
  onEntitySpawn(ent) {
    let name = ent.layer;
    if (ent.gfx) {
      ent.gfx.entity = ent;
      // Default layer is the root
      if (!name) {
        this.root.addChild(ent.gfx);
      }
      // Find the layer and add this entitiy into it
      else if (this.layers.hasOwnProperty(name)) {
        this.layers[name].addChild(ent.gfx);
      }
      // Override gfx's position with the entity's
      ent.gfx.position = ent.position;
    }
  }
  /**
   * Entity remove callback
   * @param {Entity} ent Entity to be removed
   */
  onEntityRemove(ent) {
    if (ent.gfx) {
      ent.gfx.remove();
      ent.gfx.entity = null;
    }
  }
}

module.exports = SystemGfx;
