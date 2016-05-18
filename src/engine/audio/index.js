var core = require('engine/core');
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

/**
 * Add a sound to load
 * @memberof module:engine/audio
 * @param {array<string>} src List of audio files(with different extensions)
 * @param {stirng} id
 */
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
  /**
   * Sound map
   * @memberof module:engine/audio
   * @type {object}
   */
  sounds: sounds,
  addSound: addSound,

  /**
   * Whether audio is muted.
   * @memberof module:engine/audio
   * @type {boolean}
   */
  muted: false,
  /**
   * Mute.
   * @memberof module:engine/audio
   */
  mute: function() { Howler.mute(true); audio.muted = true; audio.emit('mute', true); },
  /**
   * Unmute.
   * @memberof module:engine/audio
   */
  unmute: function() { Howler.mute(false); audio.muted = false; audio.emit('mute', false); },

  /**
   * Get/set global audio volume.
   * @memberof module:engine/audio
   */
  volume: function(v) { Howler.volume(v) },

  /**
   * Play a specific sound by id.
   * @memberof module:engine/audio
   * @param  {string} id  ID of the sound to play.
   * @return {Howler}     Howler instance for the sound.
   */
  play: function(id) {
    _snd_cache = sounds[id];
    _snd_cache && _snd_cache.play();
    return _snd_cache;
  },
});
var mutedBeforePause = false;
core.on('pause', function() {
  if (audio.muted) {
    mutedBeforePause = true;
  }
  audio.mute();
});
core.on('resume', function() {
  if (!mutedBeforePause) {
    audio.unmute();
  }
});

/**
 * Audio module is a simple wrapper of Howler.js.
 * For more details, see the [Howler.js official site](http://goldfirestudios.com/blog/104/howler.js-Modern-Web-Audio-Javascript-Library).
 *
 * @example <caption>Load audio files</caption>
 * import audio from 'engine/audio';
 *
 * // Add audio file with extensions, and give it an `id` for later use.
 * audio.addSound(['bgm.mp3', 'bgm.ogg'], 'bgm');
 *
 * @example <caption>Play loaded sound file</caption>
 * import audio from 'engine/audio';
 *
 * audio.play('bgm');
 * // or use the Howler instance directly
 * audio.sounds['bgm'].loop(true).play();
 *
 * @emits mute
 * @emits unmute
 *
 * @exports engine/audio
 *
 * @requires engine/eventemitter3
 * @requires engine/core
 * @requires engine/loader
 * @requires engine/audio/howler.core
 */
module.exports = audio;
