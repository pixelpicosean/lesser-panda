var core = require('../core');
var loader = require('engine/loader');
var Resource = loader.Resource;

// General asset middlewares (including texture support)
var blobMiddlewareFactory = require('engine/loader/middlewares/parsing/blob').blobMiddlewareFactory;
var textureParser = require('../loaders/textureParser');
var spritesheetParser = require('../loaders/spritesheetParser');

// - parse any blob into more usable objects (e.g. Image)
loader.use(blobMiddlewareFactory());
// - parse any Image objects into textures
loader.use(textureParser());
// - parse any spritesheet data into multiple textures
loader.use(spritesheetParser());

/**
 * Get texture instance from data.
 */
module.exports.textureFromData = function(data) {
  if (!data) {
    return undefined;
  }
  else if (data instanceof core.Texture) {
    return data;
  }
  else {
    if (typeof(data) === 'string' || Array.isArray(data)) {
      return loader.getTexture(data);
    }
  }
};
