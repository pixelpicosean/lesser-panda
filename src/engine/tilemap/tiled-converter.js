var utils = require('./utils');

function normalizeImageTileID(tiles, firstgid) {
  for (var i = 0; i < tiles.length; i++) {
    tiles[i] = tiles[i] - firstgid + 1;
  }
  return tiles;
}

function normalizeCollisionTileID(tiles, firstgid) {
  for (var i = 0; i < tiles.length; i++) {
    tiles[i] = tiles[i] - firstgid + 1;
    tiles[i] = (tiles[i] < 0) ? 0 : tiles[i];
  }
  return tiles;
}

function normalizeTilePolygon(def) {
  var polygon;
  if (def.width !== 0 && def.height !== 0) {
    polygon = [
      { x: def.x, y: def.y + def.height },
      { x: def.x, y: def.y },
      { x: def.x + def.width, y: def.y },
      { x: def.x + def.width, y: def.y + def.height },
    ];
  }
  else {
    if (Array.isArray(def.polygon)) {
      if (!utils.isClockwise(def.polygon)) {
        def.polygon.reverse();
      }
      polygon = def.polygon;
    }
  }

  // Force positions of vertices are positive
  var i, xFix = 0, yFix = 0, p;
  for (i = 0; i < polygon.length; i++) {
    p = polygon[i];
    if (p.x < 0) {
      xFix = (xFix < -p.x) ? -p.x : xFix;
    }
    if (p.y < 0) {
      yFix = (yFix < -p.y) ? -p.y : yFix;
    }
  }

  for (i = 0; i < polygon.length; i++) {
    p = polygon[i];
    p.x += xFix;
    p.y += yFix;
  }

  return polygon;
}

function normalizeCollisionTileShapes(tileDef) {
  var shapeDefs = Array(Object.keys(tileDef).length);
  for (var k in tileDef) {
    shapeDefs[parseInt(k)] = normalizeTilePolygon(tileDef[k].objectgroup.objects[0]);
  }
  return shapeDefs;
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
    data = normalizeCollisionTileID(layer.data, firstGIDs['collision']);
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
  var i, result = [], collisionTileShapes;

  // Fetch basic informations
  var tilesize = map.tilewidth;
  if (map.tilewidth !== map.tileheight) {
    console.log('Non-square tile is not supported yet!');
  }

  // Parse tileset info
  var firstGIDs = {};
  for (i = 0; i < map.tilesets.length; i++) {
    if (map.tilesets[i].name.indexOf('collision') > -1) {
      // Parse collision tile shapes
      collisionTileShapes = normalizeCollisionTileShapes(map.tilesets[i].tiles);
      firstGIDs['collision'] = map.tilesets[i].firstgid;
    }
    else {
      firstGIDs[map.tilesets[i].image] = map.tilesets[i].firstgid;
    }
  }

  // Parse layers
  var layer, nLayer;
  for (i = 0; i < map.layers.length; i++) {
    layer = map.layers[i];
    if (layer.type === 'objectgroup') {
      console.log('Object layer is currently not supported!');
    }
    else if (layer.type === 'tilelayer') {
      nLayer = convertLayer(layer, tilesize, firstGIDs);

      // Add tile shape define to collision layer
      if (layer.name.indexOf('collision') > -1) {
        nLayer.collisionTileShapes = collisionTileShapes;
      }

      result.push(nLayer);
    }
  }

  return result;
};
