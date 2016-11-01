// - parse any spritesheet data into multiple textures
// var bitmapFontParser = require('./loaders/bitmapFontParser');
// loader.use(bitmapFontParser());
// Resource.setExtensionXhrType('fnt', Resource.XHR_RESPONSE_TYPE.DOCUMENT);

// Export classes
// var core = require('./core');
// core.extras         = require('./extras');
// core.interaction    = require('./interaction');
// core.filters        = require('./filters');
// core.mesh           = require('./mesh');


const core = require('engine/core');
const System = require('engine/system');
const WebGLRenderer = require('./core/renderers/webgl/WebGLRenderer');
const CanvasRenderer = require('./core/renderers/canvas/CanvasRenderer');
const { isWebGLSupported } = require('./core/utils');
const container = require('./container');
const config = require('game/config');

let sharedRenderer = null;

class SystemGfx extends System {
  constructor(settings) {
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
      };

      if (config.gfx.webgl && isWebGLSupported()) {
        sharedRenderer = new WebGLRenderer(config.width || 320, config.height || 200, options);
      }
      else {
        sharedRenderer = new CanvasRenderer(config.width || 320, config.height || 200, options);
      }
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
     * @type {Container}
     */
    this.root = container();

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
  }

  set backgroundColor(c) {
    this.renderer.backgroundColor = this._backgroundColor = c;
  }
  get backgroundColor() {
    return this._backgroundColor;
  }

  awake() {
    this.renderer.backgroundColor = this._backgroundColor;
  }
  update() {
    this.renderer.render(this.root);
  }
  fixedUpdate() {}
  freeze() {}

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

    this.layers[name] = container().addTo(c);

    return this;
  }

  onEntitySpawn(ent) {
    let name = ent.layerName;
    if (ent.gfx) {
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
  onEntityRemove(ent) {
    if (ent.gfx) ent.gfx.remove();
  }

  onPause() {}
  onResume() {}
}

module.exports = SystemGfx;
