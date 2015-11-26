var EventEmitter = require('engine/eventemitter3');
var ResourceLoader = require('engine/resource-loader');
var config = require('game/config');

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
loader.addAsset = function addAsset(url, key) {
  if (key) {
    assetsQueue.push({
      url: loader.baseURL + '/' + url,
      key: key,
    });
  }
  else {
    assetsQueue.push(loader.baseURL + '/' + url);
  }
};

loader.addMiddleware = function addMiddleware(fn) {
  middlewares.push(fn);
};

module.exports = loader;
