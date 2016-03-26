var PIXI = require('engine/pixi');

var tilemap = require('./pixi-tilemap');
var filmstrip = require('./filmstrip');

function Tilemap(tilesets, data) {
  PIXI.Container.call(this);

  this.tilesets = tilesets;
  this.data = data;

  this.createLayers();
}
Tilemap.prototype = Object.create(PIXI.Container.prototype);
Tilemap.prototype.constructor = Tilemap;

Tilemap.prototype.destroy = function() {
  this.tileset = null;
  this.layers.length = 0;

  PIXI.Container.prototype.destroy.call(this);
};

Tilemap.prototype.createLayers = function() {
  var i, layerDef, data, tilesize, tileset, layer, texture, textures;
  var r, q;
  for (i = 0; i < this.data.length; i++) {
    layerDef = this.data[i];
    tileset = this.tilesets[layerDef.tileset];
    data = layerDef.data;
    tilesize = layerDef.tilesize;

    textures = filmstrip(tileset, tilesize, tilesize);

    layer = new tilemap.CompositeRectTileLayer(0, [tileset], true);
    for (r = 0; r < layerDef.height; r++) {
      for (q = 0; q < layerDef.width; q++) {
        texture = textures[data[r][q]];
        layer.addRect(0, q * tilesize, r * tilesize, texture.frame.x, texture.frame.y, tilesize, tilesize);

        this.addChild(layer);
      }
    }
  }
};

module.exports = Tilemap;
