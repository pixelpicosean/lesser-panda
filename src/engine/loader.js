import EventEmitter from 'engine/eventemitter3';
import ResourceLoader from 'engine/resource-loader';

// Loader instance
// TODO: add dymanic loading support
const loader = new EventEmitter();

let assetsQueue = [];

let loaders = [];
let middlewares = [];

let loaderIdx = 0;
let loadedCount = 0;

let resourceLoader = null;

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

  let assetsLength = 0;
  for (let l of loaders) {
    assetsLength += l.getAssetsLength();
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
    resourceLoader = new loader.ResourceLoader('media');
    // Use middlewares
    for (let m of middlewares) {
      resourceLoader.use(m());
    }

    // Load assets
    resourceLoader.add(assetsQueue);

    // Keep a reference to the resources
    loader.resources = resourceLoader.resources;

    // Register it as a loader
    loader.registerLoader({
      start(onComplete, onProgress) {
        let mapper = (resLoader, res) => {
          onProgress(res, res.error);
        };
        resourceLoader.on('progress', mapper);
        resourceLoader.load(() => {
          setTimeout(onComplete, 0);
          resourceLoader.off('progress', mapper);
        });
      },
      getAssetsLength() {
        return Object.keys(resourceLoader.resources).length;
      },
    });
  }

  loaders[loaderIdx].start(next, progress);
};

loader.ResourceLoader = ResourceLoader;

/**
 * Add assets to be loaded by ResourceLoader instance
 */
loader.addAsset = function addAsset(url, key) {
  assetsQueue.push({ url, key })
};

loader.addMiddleware = function addMiddleware(fn) {
  middlewares.push(fn);
};

export default loader;
