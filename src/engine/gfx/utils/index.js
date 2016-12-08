const Texture = require('../core/textures/Texture');
const { Rectangle } = require('../core/math');
const loader = require('engine/loader');

/**
 * Get texture instance from data.
 * @memberof module:engine/gfx/utils
 * @param {String|Array|Texture} data   Key of the texture.
 * @return {Texture|undefined} Texture instance of `undefined`
 */
function textureFromData(data) {
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
}

/**
 * Create textures for tiles in a tileset. Can also be used to extract
 * grid based sprite-sheets.
 * @memberof module:engine/gfx/utils
 * @param  {Texture} tilesetp   Tileset texture.
 * @param  {number} tileWidth   Width of a single tile.
 * @param  {number} tileHeight  Height of a single tile.
 * @return {array<Texture>}     List of textures.
 */
function filmstrip(tilesetp, tileWidth, tileHeight) {
  var tileset = textureFromData(tilesetp);
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
}

/**
 * Gfx utils.
 *
 * @exports engine/gfx/utils
 *
 * @requires module:engine/gfx/core/textures/Texture
 * @requires module:engine/gfx/core/math
 * @requires module:engine/loader
 */
module.exports.textureFromData = textureFromData;
module.exports.filmstrip = filmstrip;
