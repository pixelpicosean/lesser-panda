var Howl = require('./howler.core').Howl;
var loader = require('./loader');

var sounds = {};
var soundsToLoadCount = 0;
var soundsLoadedCount = 0;

// Callbacks
var progressCB;
var completeCB;

function addSound(src, id) {
  if (sounds[id || src] || sounds[src]) {
    return;
  }

  var snd = new Howl({
    src: loader.baseURL + '/' + src,
    preload: false,
    onload: onload.bind(undefined, snd),
    onloaderror: onload.bind(undefined, snd, 'Failed to load sound[' + src + ']'),
  });
  sounds[id || src] = snd;

  soundsToLoadCount += 1;
}

function onload(snd, err) {
  soundsLoadedCount += 1;
  progressCB && progressCB(snd, err);

  if (soundsLoadedCount === soundsToLoadCount && completeCB) {
    setTimeout(completeCB, 0);

    // Remove ref to callbacks
    completeCB = null;
    progressCB = null;
  }
}

loader.registerLoader({
  start: function(onComplete, onProgress) {
    progressCB = onProgress;
    completeCB = onComplete;

    for (var s in sounds) sounds[s].load();
  },
  getAssetsLength: function() {
    return soundsToLoadCount;
  },
});

module.exports = {
  sounds: sounds,
  addSound: addSound,
};
