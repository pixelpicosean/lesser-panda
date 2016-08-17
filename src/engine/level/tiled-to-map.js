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

function convertLayer(layer, tilesize, firstGIDs, GIDRange) {
  var collision = layer.name.indexOf('collision') > -1;

  var tileset, data, parent;

  // Tile map
  if (!collision) {

    // Find tileset of this map
    tileset = tilesetOfTile(layer.data[0], GIDRange);
    data = utils.lift(normalizeImageTileID(layer.data, firstGIDs[tileset]), layer.width, layer.height);

    // Which parent this layer will be added to
    parent = 'stage';
    if (layer.properties && layer.properties.parent) {
      parent = layer.properties.parent;
    }

    return {
      type: 'tile',
      tilesize: tilesize,
      tileset: tileset,
      data: data,
      parent: parent,
    };
  }

  // Collision map
  else {
    data = utils.lift(normalizeCollisionTileID(layer.data, firstGIDs['collision']), layer.width, layer.height);

    return {
      type: 'collision',
      tilesize: tilesize,
      data: data,
    };
  }
}

function tilesetOfTile(tileGID, GIDRange) {
  for (var k in GIDRange) {
    if (tileGID >= GIDRange[k][0] || tileGID <= GIDRange[k][1]) {
      return k;
    }
  }
}

var EMPTY_SETTINGS = {};
function parseActor(data) {
  return [data.type || 'Actor', data.x, data.y, Object.assign({
    name: data.name,
    rotation: data.rotation,
    visible: data.visible,
  }, data.properties || EMPTY_SETTINGS)];
}

function parseActors(data) {
  return {
    type: 'actor',
    container: data.name,
    actors: data.objects.map(parseActor),
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
module.exports = exports = function tiledToMap(map) {
  var i, result = [], collisionTileShapes;

  // Fetch basic informations
  var tilesize = map.tilewidth;
  if (map.tilewidth !== map.tileheight) {
    console.log('Non-square tile is not supported yet!');
  }

  // Parse tileset info
  var firstGIDs = {}, GIDRange = {};
  for (i = 0; i < map.tilesets.length; i++) {
    if (map.tilesets[i].name.indexOf('collision') > -1) {
      // Parse collision tile shapes
      collisionTileShapes = normalizeCollisionTileShapes(map.tilesets[i].tiles);
      firstGIDs['collision'] = map.tilesets[i].firstgid;
    }
    else {
      firstGIDs[map.tilesets[i].image] = map.tilesets[i].firstgid;
      GIDRange[map.tilesets[i].image] = [map.tilesets[i].firstgid, map.tilesets[i].firstgid + map.tilesets[i].tilecount];
    }
  }

  // Parse layers
  var layer, nLayer;
  for (i = 0; i < map.layers.length; i++) {
    layer = map.layers[i];
    if (layer.type === 'objectgroup') {
      nLayer = parseActors(layer);
    }
    else if (layer.type === 'tilelayer') {
      nLayer = convertLayer(layer, tilesize, firstGIDs, GIDRange);

      // Add tile shape define to collision layer
      if (layer.name.indexOf('collision') > -1) {
        nLayer.collisionTileShapes = collisionTileShapes;
      }
    }
    result.push(nLayer);
  }

  return result;
};
