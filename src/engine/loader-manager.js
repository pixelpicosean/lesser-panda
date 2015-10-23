import EventEmitter from 'engine/eventemitter3';

let loaders = [];
let loaderIdx = 0;
let assetsLength = 0;
let loadedCount = 0;

let events = new EventEmitter();

function registerLoader(loader) {
  loaders.push(loader);
}

function start() {
  if (loaders.length === 0) {
    events.emit('complete');
    return;
  }

  for (let l of loaders) {
    assetsLength += l.getAssetsLength();
  }

  loaders[loaderIdx].start(next, progress);
}

function next() {
  loaderIdx += 1;
  if (loaderIdx < loaders.length) {
    loaders[loaderIdx].start(next, progress);
  }
  else {
    events.emit('complete');
  }
}

// TODO: error and loaded asset info
function progress() {
  loadedCount += 1;
  events.emit('progress', loadedCount / assetsLength);
}

export default Object.assign(events, {
  registerLoader,
  start,
});
