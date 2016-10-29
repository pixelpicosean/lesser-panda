import loader, { Resource } from 'engine/loader';
import { Howl } from 'engine/audio/howler.core';
import config from 'game/config';

const AudioUse = (config.audio && Array.isArray(config.audio.use)) ? config.audio.use : ['webm', 'mp3'];

/**
 * Map of loaded audio files
 * @type {Object<String, Howl>}
 */
export const sounds = {};

// Utils
function getFileExt(path) {
  return (/[.]/.exec(path)) ? /[^.]+$/.exec(path) : undefined;
}
function splitExts(ext) {
  return (/[|]/.exec(ext)) ? ext.split('|') : ext;
}

// Overrided functions
function load(cb) {
  if (this.isLoading) return;

  if (this.isComplete) {
    if (cb) setTimeout(() => cb(this), 1);

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
  sounds[this.name] = this.data;
}
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
