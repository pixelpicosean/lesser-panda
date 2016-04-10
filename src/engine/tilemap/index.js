var PIXI = require('engine/pixi');

var tilemap = require('./pixi-tilemap');
var filmstrip = require('./filmstrip');
var CollisionLayer = require('./collision-layer');

var tiledConverter = require('./tiled-converter');

function Tilemap(data, tilesets) {
  PIXI.Container.call(this);

  this.tilesets = tilesets;
  this.data = data;
  this.collisionLayer = null;

  this.createLayers();
}
Tilemap.prototype = Object.create(PIXI.Container.prototype);
Tilemap.prototype.constructor = Tilemap;

Tilemap.prototype.destroy = function() {
  this.tilesets = null;
  this.layers.length = 0;

  PIXI.Container.prototype.destroy.call(this);
};

Tilemap.prototype.createLayers = function() {
  var i, layerDef, data, tilesize, tileset, layer, texture, textures;
  var r, q;
  for (i = 0; i < this.data.length; i++) {
    layerDef = this.data[i];

    if (layerDef.collision) {
      this.collisionLayer = new CollisionLayer(layerDef);
    }
    else {
      tileset = this.tilesets[layerDef.tileset];
      data = layerDef.data;
      tilesize = layerDef.tilesize;

      textures = filmstrip(tileset, tilesize, tilesize);

      layer = new tilemap.CompositeRectTileLayer(0, [tileset], true);
      for (r = 0; r < layerDef.height; r++) {
        for (q = 0; q < layerDef.width; q++) {
          texture = textures[data[r][q] - 1];
          layer.addRect(0, texture.frame.x, texture.frame.y, q * tilesize, r * tilesize, tilesize, tilesize);

          this.addChild(layer);
        }
      }
    }
  }
};

Tilemap.fromTiledJson = function(json, tilesets) {
  return new Tilemap(tiledConverter(json), tilesets);
};

module.exports = Tilemap;
