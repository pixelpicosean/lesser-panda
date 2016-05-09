var EventEmitter = require('engine/eventemitter3');
var ResourceLoader = require('engine/resource-loader');
var config = require('game/config').default;

// TODO: add dymanic loading support
/**
 * Assets loader powered by `resource-loader` that can load any kind
 * of resources.
 *
 * Config:
 * - baseURL: Base url for the assets related to project root, the default is `media`.
 *
 * @emits progress
 * @emits error
 * @emits complete
 *
 * @exports engine/loader
 * @requires engine/eventemitter3
 * @requires engine/resource-loader
 */
var loader = new EventEmitter();

/**
 * ResourceLoader constructor
 * @type {ResourceLoader}
 */
loader.ResourceLoader = ResourceLoader;

Object.assign(loader, {
  baseURL: 'media',
}, config.loader);

var assetsQueue = [];

var loaders = [];
var middlewares = [];

var loaderIdx = 0;
var loadedCount = 0;
/* Whether the first loading is already started */
var started = false;

var resourceLoader = null;

function next() {
  loaderIdx += 1;
  if (loaderIdx < loaders.length) {
    loaders[loaderIdx].start(next, progress);
  }
  else {
    loader.emit('complete');
  }
}

function progress(res, err) {
  loadedCount += 1;

  var assetsLength = 0;
  for (var i in loaders) {
    assetsLength += loaders[i].getAssetsLength();
  }

  err && loader.emit('error', err);

  loader.emit('progress', loadedCount / assetsLength);
}

/**
 * Register a custom loader.
 * Usually you don't need anything else than `resource-loader`. The main
 * purpose it to support the {@link module:engine/audio} which uses
 * `hower` to support audio playback.
 *
 * See {@link module:engine/audio} to learn to create a custom loader.
 *
 * @param  {object} loader
 */
loader.registerLoader = function registerLoader(loader) {
  loaders.push(loader);
};

/**
 * Start the loading process
 * @private
 */
loader.start = function start() {
  started = true;

  if (assetsQueue.length === 0) {
    loader.emit('complete');
    return;
  }

  if (!resourceLoader) {
    resourceLoader = new loader.ResourceLoader();
    // Use middlewares
    for (var m in middlewares) {
      resourceLoader.use(middlewares[m]());
    }

    // Load assets
    resourceLoader.add(assetsQueue);

    // Keep a reference to the resources
    loader.resources = resourceLoader.resources;

    // Register it as a loader
    loader.registerLoader({
      start: function(onComplete, onProgress) {
        var mapper = function mapper(resLoader, res) {
          onProgress(res, res.error);
        };
        resourceLoader.on('progress', mapper);
        resourceLoader.load(function() {
          setTimeout(onComplete, 0);
          resourceLoader.off('progress', mapper);
        });
      },
      getAssetsLength: function() {
        return Object.keys(resourceLoader.resources).length;
      },
    });
  }

  loaders[loaderIdx].start(next, progress);
};

/**
 * Add assets to be loaded by ResourceLoader instance.
 * @param {string} url        Path of the asset to load(`baseURL` is not included)
 * @param {string} [key]      Key to assign to the asset(it will be the same as `url` if not provided)
 * @param {string} [settings] Extra settings to pass to `resource-loader` instance.
 */
loader.addAsset = function addAsset(url, key, settings) {
  var realURL = loader.baseURL + '/' + url;
  var resInfo = Object.assign({
    url: realURL,
    key: key || url,
  }, settings);

  // Add res info to assets queue before first loading
  // started. Most assets are going to be loaded from here.
  if (!started) {
    assetsQueue.push(resInfo);
  }
  // Add res info directly to resource loader
  // when first loading is already started.
  else {
    resourceLoader.add(resInfo);
  }
  return loader;
};

/**
 * Add a new `resource-loader` middleware for loading process.
 * @param {function} fn   Middleware creator
 */
loader.addMiddleware = function addMiddleware(fn) {
  middlewares.push(fn);
};

/**
 * Get texture by key.
 * @param  {array<string>|string} key Key is the either an array like [atlas_key, sprite_key] for sprites in an atlas or a simple string refer to a independent texture.
 * @return {PIXI.Texture}
 */
loader.getTexture = function getTexture(key) {
  if (Array.isArray(key)) {
    return loader.resources[key[0]].textures[key[1]];
  }
  else if (typeof(key) === 'string') {
    return loader.resources[key].texture;
  }
}

module.exports = loader;
