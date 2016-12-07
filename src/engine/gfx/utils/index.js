const Texture = require('../core/textures/Texture');
const { Rectangle } = require('../core/math');
const loader = require('engine/loader');
const { Resource } = loader;

// General asset middlewares (including texture support)
const blobMiddlewareFactory = require('engine/loader/middlewares/parsing/blob').blobMiddlewareFactory;
const textureParser = require('../loaders/textureParser');
const spritesheetParser = require('../loaders/spritesheetParser');
const bitmapFontParser = require('../loaders/bitmapFontParser');
Resource.setExtensionXhrType('fnt', Resource.XHR_RESPONSE_TYPE.DOCUMENT);

// - parse any blob into more usable objects (e.g. Image)
loader.use(blobMiddlewareFactory());
// - parse any Image objects into textures
loader.use(textureParser());
// - parse any spritesheet data into multiple textures
loader.use(spritesheetParser());
// - parse any spritesheet data into multiple textures
loader.use(bitmapFontParser());

/**
 * Get texture instance from data.
 * @param {String|Array|Texture} data   Key of the texture.
 */
module.exports.textureFromData = function(data) {
  if (!data) {
    return undefined;
  }
  else if (typeof(data) === 'string') {
    return loader.resources[data].texture;
  }
  else if (Array.isArray(data)) {
    return loader.resources[data[0]].textures[data[1]];
  }
  else if (data.hasOwnProperty('baseTexture')) {
    return data;
  }
};

/**
 * Create textures for tiles in a tileset. Can also be used to extract
 * grid based sprite-sheets.
 *
 * @param  {Texture} tileset    Tileset texture.
 * @param  {number} tileWidth   Width of a single tile.
 * @param  {number} tileHeight  Height of a single tile.
 * @return {array<Texture>}     List of textures.
 */
module.exports.filmstrip = function(tileset, tileWidth, tileHeight) {
  var strip = [];

  var w = tileset.width;
  var h = tileset.height;
  var crop = tileset.crop;

  var sheet = tileset.baseTexture;

  var cols = Math.floor(w / tileWidth);
  var rows = Math.floor(h / tileHeight);

  var q = 0, r = 0;
  for (r = 0; r < rows; r++) {
    for (q = 0; q < cols; q++) {
      strip.push(new Texture(sheet, new Rectangle(q * tileWidth + crop.x, r * tileHeight + crop.y, tileWidth, tileHeight)));
    }
  }

  return strip;
};
