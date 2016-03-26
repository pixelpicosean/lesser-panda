var PIXI = require('engine/pixi');

module.exports = exports = function filmstrip(tileset, tileWidth, tileHeight) {
  let strip = [];

  let w = tileset.width;
  let h = tileset.height;
  let crop = tileset.crop;

  let sheet = tileset.baseTexture;

  let cols = Math.floor(w / tileWidth);
  let rows = Math.floor(h / tileHeight);

  let q = 0, r = 0;
  for (r = 0; r < rows; r++) {
    for (q = 0; q < cols; q++) {
      strip.push(new PIXI.Texture(sheet, new PIXI.Rectangle(q * tileWidth + crop.x, r * tileHeight + crop.y, tileWidth, tileHeight)));
    }
  }

  return strip;
};
