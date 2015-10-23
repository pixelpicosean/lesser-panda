import EventEmitter from 'engine/eventemitter3';
import ResourceLoader from 'engine/resource-loader';

// Loader instance
const loader = new EventEmitter();

let loaders = [];
let loaderIdx = 0;
let assetsLength = 0;
let loadedCount = 0;

function next() {
  loaderIdx += 1;
  if (loaderIdx < loaders.length) {
    loaders[loaderIdx].start(next, progress);
  }
  else {
    loader.emit('complete');
  }
}

// TODO: error and loaded asset info
function progress() {
  loadedCount += 1;
  loader.emit('progress', loadedCount / assetsLength);
}

loader.registerLoader = function registerLoader(loader) {
  loaders.push(loader);
};

loader.start = function start() {
  if (loaders.length === 0) {
    loader.emit('complete');
    return;
  }

  for (let l of loaders) {
    assetsLength += l.getAssetsLength();
  }

  loaders[loaderIdx].start(next, progress);
};

// Internal resource loader
let resourceLoader = new ResourceLoader();
loader.registerLoader({
  start: function(onComplete, onProgress) {
    resourceLoader.on('load', onProgress);
    resourceLoader.load(function() {
      setTimeout(onComplete, 0);
      resourceLoader.off('load', onProgress);
    });
  },
  getAssetsLength: function() {
    return Object.keys(resourceLoader.resources).length;
  },
});

// TODO: loader middleware support

loader.addAsset = function addAsset(url, key) {
  if (key) {
    resourceLoader.add(key, 'media/' + url);
  }
  else {
    resourceLoader.add('media/' + url);
  }
};

export default loader;
