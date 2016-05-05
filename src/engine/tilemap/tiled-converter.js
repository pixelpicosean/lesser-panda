var utils = require('./utils');

function normalizeImageTileID(tiles, firstgid) {
  for (var i = 0; i < tiles.length; i++) {
    tiles[i] = tiles[i] - firstgid + 1;
  }
  return tiles;
}

function normalizeCollisionTileID(tiles) {
  for (var i = 0; i < tiles.length; i++) {
    tiles[i] = (tiles[i] > 0) ? 1 : 0;
  }
  return tiles;
}

function convertLayer(layer, tilesize, firstGIDs) {
  var collision = layer.name.indexOf('collision') > -1;

  var tileset, data;
  if (!collision) {
    if (!layer.properties || !layer.properties.tileset) {
      throw 'Tiled converter error: cannot find "tileset" property of layer "' + layer.name + '"';
    }

    tileset = layer.properties.tileset;
    data = utils.lift(normalizeImageTileID(layer.data, firstGIDs[tileset]), layer.width, layer.height);
  }
  else {
    data = normalizeCollisionTileID(layer.data);
  }

  return {
    tilesize: tilesize,
    tileset: tileset,
    width: layer.width,
    height: layer.height,
    data: data,
    collision: collision,
  };
}

/**
 * Convert a tiled map data into LesserPanda built-in tilemap format.
 *
 * @exports engine/tilemap/tiled-converter
 * @requires engine/tilemap/utils
 *
 * @param  {object} map     Map data.
 * @return {array<object>}
 */
module.exports = function(map) {
  var i, result = [];

  // Fetch basic informations
  var tilesize = map.tilewidth;
  if (map.tilewidth !== map.tileheight) {
    console.log('Non-square tile is not supported yet!');
  }

  // Parse tileset info
  var firstGIDs = {};
  for (i = 0; i < map.tilesets.length; i++) {
    firstGIDs[map.tilesets[i].image] = map.tilesets[i].firstgid;
  }

  // Parse layers
  var layer;
  for (i = 0; i < map.layers.length; i++) {
    layer = map.layers[i];
    if (layer.type === 'objectgroup') {
      console.log('Object layer is currently not supported!');
    }
    else if (layer.type === 'tilelayer') {
      result.push(convertLayer(layer, tilesize, firstGIDs));
    }
  }

  return result;
};
