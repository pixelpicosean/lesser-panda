var howler = require('./howler.core');
var loader = require('engine/loader');

var Howl = howler.Howl;
var Howler = howler.Howler;

var EventEmitter = require('engine/eventemitter3');

var sounds = {};
var soundsToLoadCount = 0;
var soundsLoadedCount = 0;

// Callbacks
var progressCB;
var completeCB;

function prefix(path) {
  return loader.baseURL + '/' + path;
}

function addSound(src, id) {
  if (sounds[id]) {
    return;
  }

  var snd = new Howl({
    src: src.map(prefix),
    preload: false,
    onload: onload.bind(undefined, snd),
    onloaderror: onload.bind(undefined, snd, 'Failed to load sound[' + src + ']'),
  });
  sounds[id] = snd;

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

    if (Object.keys(sounds).length === 0) {
      onComplete();
    }
  },
  getAssetsLength: function() {
    return soundsToLoadCount;
  },
});
loader.addSound = addSound;

var _snd_cache = null;

var audio = Object.assign(new EventEmitter(), {
  sounds: sounds,
  addSound: addSound,

  muted: false,
  mute: function() { Howler.mute(true); audio.muted = true; audio.emit('mute', true); },
  unmute: function() { Howler.mute(false); audio.muted = false; audio.emit('mute', false); },

  volume: function(v) { Howler.volume(v) },

  play: function(id) {
    _snd_cache = sounds[id];
    _snd_cache && _snd_cache.play();
    return _snd_cache;
  },
});

module.exports = audio;
