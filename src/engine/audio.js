import { Howl } from './howler.core';
import loader from './loader';

let sounds = {};
let soundsToLoadCount = 0;
let soundsLoadedCount = 0;

// Callbacks
let progressCB;
let completeCB;

function addSound(src, id) {
  if (sounds[id || src] || sounds[src]) {
    return;
  }

  let snd = new Howl({
    src: 'media/' + src,
    preload: false,
    onload: onload.bind(undefined, snd),
  });
  sounds[id || src] = snd;

  soundsToLoadCount += 1;
}

function onload(snd) {
  soundsLoadedCount += 1;
  progressCB && progressCB(snd);

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

    for (let s in sounds) sounds[s].load();
  },
  getAssetsLength: function() {
    return soundsToLoadCount;
  },
});

export default {
  sounds,
  addSound,
};
