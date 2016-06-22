var PIXI = require('engine/pixi');

var tilemap = require('./pixi-tilemap');
var filmstrip = require('./filmstrip');
var CollisionLayer = require('./collision-layer');

var tiledConverter = require('./tiled-converter');

/**
 * Tilemap
 *
 * You need a map data and a table of tileset textures to be able to
 * create a Tilemap instance.
 *
 * Map data is defined by an Array of layers.
 *
 * Layer defination:
 * ```
 * {
 *   tileset: string
 *   tilesize: number
 *   width: number
 *   height: number
 *   data: array<array<number>>
 * }
 * ```
 *
 * Tileset table is used to look up textures of layers.
 * A simple example would like this:
 * ```
 * {
 *   'background.png': loader.resources['background.png'].texture,
 *   'buildings.png': loader.resources['buildings.png'].texture,
 * }
 * ```
 *
 * @class Tilemap
 * @constructor
 * @param {array<object>} data  List of layer definations.
 * @param {object} tilesets     Table of tilesets.
 * @param {number} [group]      Collision group of collision layer(if exists).
 */
function Tilemap(data, tilesets, group) {
  PIXI.Container.call(this);

  this.tilesets = tilesets;
  this.data = data;
  this.collisionLayer = null;
  this.group = group;
  this.actorLayers = [];

  this.createLayers();
}
Tilemap.prototype = Object.create(PIXI.Container.prototype);
Tilemap.prototype.constructor = Tilemap;

/**
 * Destroy this tilemap instance and free the memory.
 * @memberof Tilemap#
 * @method destroy
 */
Tilemap.prototype.destroy = function() {
  this.tilesets = null;
  this.collisionLayer.destroy();
  this.layers.length = 0;
  this.actorLayers.length = 0;

  PIXI.Container.prototype.destroy.call(this);
};

/**
 * Add this tilemap to a scene.
 * @memberof Tilemap#
 * @method addTo
 * @param {Scene} scene               Scene to add to.
 * @param {PIXI.Container} container  Container to add tilemap to.
 */
Tilemap.prototype.addTo = function(scene, container) {
  PIXI.Container.prototype.addTo.call(this, container);

  if (this.collisionLayer) {
    this.collisionLayer.addTo(scene);
  }

  // Create actor instances
  var i, j, layer, act;
  if (this.actorLayers.length > 0) {
    for (i = 0; i < this.actorLayers.length; i++) {
      layer = this.actorLayers[i];

      // Create layer if not exist yet
      if (!scene[layer.name]) {
        scene.createLayers(layer.name, 'stage');
      }

      // Spawn actors
      for (j = 0; j < layer.actors.length; j++) {
        act = layer.actors[j];
        scene.spawnActor(act[0], act[1], act[2], layer.name, act[3]);
      }
    }
  }

  return this;
};

/**
 * Create layers for this tilemap.
 * @memberof Tilemap#
 * @private
 */
Tilemap.prototype.createLayers = function() {
  var i, layerDef, data, tilesize, tileset, layer, texture, textures;
  var r, q;
  for (i = 0; i < this.data.length; i++) {
    layerDef = this.data[i];

    if (layerDef.collision) {
      this.collisionLayer = new CollisionLayer(layerDef, this.group);
    }
    else if (layerDef.actors) {
      this.actorLayers.push(layerDef);
    }
    else {
      tileset = this.tilesets[layerDef.tileset];
      data = layerDef.data;
      tilesize = layerDef.tilesize;

      textures = filmstrip(tileset, tilesize, tilesize);

      layer = new tilemap.CompositeRectTileLayer(0, [tileset], true);
      for (r = 0; r < layerDef.height; r++) {
        for (q = 0; q < layerDef.width; q++) {
          if (data[r][q] === 0) continue;
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
 * @memberof Tilemap
 *
 * @param  {JSON} json        Map data
 * @param  {object} tilesets  Tileset table
 * @param  {number} group     Collision group
 * @return {Tilemap}          Tilemap instance
 */
Tilemap.fromTiledJson = function(json, tilesets, group) {
  return new Tilemap(tiledConverter(json), tilesets, group);
};

/**
 * Tilemap rendering and collision support.
 *
 * @see Tilemap
 *
 * @exports engine/tilemap
 *
 * @requires engine/pixi
 * @requires engine/tilemap/pixi-tilemap
 * @requires engine/tilemap/filmstrip
 * @requires engine/tilemap/collision-layer
 * @requires engine/tilemap/tiled-converter
 */
module.exports = Tilemap;
