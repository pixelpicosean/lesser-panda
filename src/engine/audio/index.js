const core = require('engine/core');
const loader = require('engine/loader');
const { Resource } = loader;
const { Howl, Howler } = require('engine/audio/howler.core');
const EventEmitter = require('engine/EventEmitter');
const config = require('game/config');

/**
 * Audio manager.
 * @private
 */
const audio = new EventEmitter();

Object.assign(audio, {
  Howl: Howl,
  Howler: Howler,

  /**
   * Map of loaded audio files.
   * @memberof module:engine/audio
   * @type {Object<String, Howl>}
   */
  sounds: {},
  /**
   * Whether audio is muted.
   * @memberof module:engine/audio
   * @type {boolean}
   */
  muted: false,
  /**
   * Mute.
   * @memberof module:engine/audio
   * @method mute
   */
  mute: function() { Howler.mute(true); audio.muted = true; audio.emit('mute', true); },
  /**
   * Unmute.
   * @memberof module:engine/audio
   * @method unmute
   */
  unmute: function() { Howler.mute(false); audio.muted = false; audio.emit('mute', false); },

  /**
   * Get/set global audio volume.
   * @memberof module:engine/audio
   * @method volume
   * @param {number} v Volume to set.
   */
  volume: function(v) { Howler.volume(v); },
});

let mutedBeforePause = false;
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

// Utils
const AudioUse = (config.audio && Array.isArray(config.audio.use)) ? config.audio.use : ['webm', 'mp3'];
/**
 * Get file extension from a path
 * @private
 * @param {String} path  Full path.
 * @return {String} Extension
 */
function getFileExt(path) {
  return (/[.]/.exec(path)) ? /[^.]+$/.exec(path) : undefined;
}
/**
 * Split "|" separated extensions.
 * @private
 * @param {String} ext Full extension string.
 * @return {Array} List of extensions.
 */
function splitExts(ext) {
  return (/[|]/.exec(ext)) ? ext.split('|') : ext;
}

/**
 * Overrided `load` function.
 * @private
 * @param  {Function} cb Callback when loading completed.
 */
function load(cb) {
  if (this.isLoading) {return;}

  if (this.isComplete) {
    if (cb) {setTimeout(() => cb(this), 1);}

    return;
  }
  else if (cb) {
    this.onComplete.once(cb);
  }

  this.data = new Howl({ src: this.url });
  this.loadType = Resource.LOAD_TYPE.AUDIO;
  this.type = Resource.TYPE.AUDIO;

  this._setFlag(Resource.STATUS_FLAGS.LOADING, true);
  this.onStart.dispatch(this);

  this.data.on('loaderror', this._boundOnError, false);
  this.data.on('load', this._boundComplete, false);

  // Save to sound hash
  audio.sounds[this.name] = this.data;
}
/**
 * Overrided `complete` function.
 * @private
 */
function complete() {
  if (this.data) {
    this.data.off('loaderror', this._boundOnError, false);
    this.data.off('load', this._boundComplete, false);
  }

  if (this.isComplete) {
    throw new Error('Complete called again for an already completed resource.');
  }

  this._setFlag(Resource.STATUS_FLAGS.COMPLETE, true);
  this._setFlag(Resource.STATUS_FLAGS.LOADING, false);

  this.onComplete.dispatch(this);
}

// Add middleware to support Howler.js
loader.pre((res, next) => {
  let i, ext = getFileExt(res.url);
  let urlWithoutExt = res.url.slice(0, ext.index);

  // Check whether this resource is a supported audio file
  for (i = 0; i < AudioUse.length; i++) {
    if (ext[0].indexOf(AudioUse[i]) >= 0) {
      res.url = splitExts(ext[0]);

      // Has a list of extensions
      if (Array.isArray(res.url)) {
        for (i = 0; i < res.url.length; i++) {
          res.url[i] = `${urlWithoutExt}${res.url[i]}`;
        }
      }
      // Has a single extension
      else {
        res.url = [`${urlWithoutExt}${res.url}`];
      }

      // Use specific load and complete functions
      res.load = load;
      res.complete = complete;
      res._boundComplete = res.complete.bind(res);

      next();
      return;
    }
  }

  next();
});

/**
 * Audio module is a simple wrapper of Howler.js.
 * For more details, see the [Howler.js official site](http://goldfirestudios.com/blog/104/howler.js-Modern-Web-Audio-Javascript-Library).
 *
 * @example <caption>Load audio files</caption>
 * import loader from 'engine/loader';
 *
 * // Add audio file with extensions, and give it an `id` for later use.
 * loader.add('bgm', 'bgm.ogg');
 * // You can
 * loader.add('bgm2', 'bgm2.webm|mp3');
 *
 * // Note that ONLY files with extensions in `config.audio.use` will be
 * // properly loaded.
 *
 * @example <caption>Play loaded sound file</caption>
 * import audio from 'engine/audio';
 *
 * // Sound objects are just `Howl` instances
 * audio.sounds['bgm'].loop(true).play();
 *
 * @emits mute
 * @emits unmute
 *
 * @exports engine/audio
 *
 * @requires engine/EventEmitter
 * @requires engine/core
 * @requires engine/loader
 * @requires engine/audio/howler.core
 * @requires game/config
 */
module.exports = audio;
