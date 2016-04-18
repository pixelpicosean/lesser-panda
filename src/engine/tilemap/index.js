/**
 * Tilemap
 *
 * You need a map data and a table of tileset textures to be able to
 * create a Tilemap instance.
 *
 * Map data is defined by an Array of layers.
 *
 * Tile layer data: {
 *   tileset: String
 *   tilesize: Number
 *   width: Number
 *   height: Number
 *   data: Array<Array<Number>>
 * }
 *
 * Tileset table is used to look up textures of layers.
 * A simple example would like this:
 * {
 *   'background.png': loader.resources['background.png'].texture,
 *   'buildings.png': loader.resources['buildings.png'].texture,
 * }
 */

var PIXI = require('engine/pixi');

var tilemap = require('./pixi-tilemap');
var filmstrip = require('./filmstrip');
var CollisionLayer = require('./collision-layer');

var tiledConverter = require('./tiled-converter');

function Tilemap(data, tilesets, group) {
  PIXI.Container.call(this);

  this.tilesets = tilesets;
  this.data = data;
  this.collisionLayer = null;
  this.group = group;

  this.createLayers();
}
Tilemap.prototype = Object.create(PIXI.Container.prototype);
Tilemap.prototype.constructor = Tilemap;

Tilemap.prototype.destroy = function() {
  this.tilesets = null;
  this.collisionLayer.destroy();
  this.layers.length = 0;

  PIXI.Container.prototype.destroy.call(this);
};

Tilemap.prototype.addTo = function(scene, container) {
  PIXI.Container.prototype.addTo.call(this, container);

  if (this.collisionLayer) {
    this.collisionLayer.addTo(scene);
  }

  return this;
};

Tilemap.prototype.createLayers = function() {
  var i, layerDef, data, tilesize, tileset, layer, texture, textures;
  var r, q;
  for (i = 0; i < this.data.length; i++) {
    layerDef = this.data[i];

    if (layerDef.collision) {
      this.collisionLayer = new CollisionLayer(layerDef, this.group);
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

/**
 * Create a Tilemap instance from Tiled JSON file.
 *
 * Notice:
 * since tileset of Tiled maps uses relative path to save, which
 * can be quite boring sometimes and is not designed to be capable
 * with this implementation, the parser will simply ignore tileset
 * data of the map.
 *
 * But we still need tileset info to render, so there're some extra
 * steps you need to follow:
 *
 * 1. Only one tileset per layer
 * 2. Add a custom property "tileset" and set its value to name of the image
 *
 * @param  {JSON} json        Map data
 * @param  {Object} tilesets  Tileset table
 * @param  {Number} group     Collision group
 * @return {Tilemap}          Tilemap instance
 */
Tilemap.fromTiledJson = function(json, tilesets, group) {
  return new Tilemap(tiledConverter(json), tilesets, group);
};

module.exports = Tilemap;
