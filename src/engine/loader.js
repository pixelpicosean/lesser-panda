var EventEmitter = require('engine/eventemitter3');
var ResourceLoader = require('engine/resource-loader');
var config = require('game/config').default;

// Loader instance
// TODO: add dymanic loading support
var loader = new EventEmitter();

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

loader.registerLoader = function registerLoader(loader) {
  loaders.push(loader);
};

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
 * Add assets to be loaded by ResourceLoader instance
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

loader.addMiddleware = function addMiddleware(fn) {
  middlewares.push(fn);
};

module.exports = loader;
