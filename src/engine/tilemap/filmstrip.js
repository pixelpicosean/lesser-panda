var PIXI = require('engine/pixi');

module.exports = exports = function filmstrip(tileset, tileWidth, tileHeight) {
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
      strip.push(new PIXI.Texture(sheet, new PIXI.Rectangle(q * tileWidth + crop.x, r * tileHeight + crop.y, tileWidth, tileHeight)));
    }
  }

  return strip;
};
