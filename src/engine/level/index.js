'use strict';

var Scene = require('engine/scene');
var CollisionMap = require('engine/tilemap/collision-map');
var BackgroundMap = require('engine/tilemap/background-map');
var loader = require('engine/loader');

var DEFAULT_SETTINGS = {
  collisionGroup: 1,
  container: 'stage',
};

Scene.prototype.loadLevel = function(levelData, settings) {
  var i, j, layerData, tileset, act, s = Object.assign({}, DEFAULT_SETTINGS, settings);

  // Remove existing background maps
  if (Array.isArray(this.backgroundMaps)) {
    for (i = 0; i < this.backgroundMaps.length; i++) {
      this.backgroundMaps[i].remove();
    }

    this.backgroundMaps.length = 0;
  }
  else {
    this.backgroundMaps = [];
  }

  // Remove existing collision map
  if (this.collisionMap) {
    this.collisionMap.remove();
  }

  // Create new maps from level data
  for (i = 0; i < levelData.length; i++) {
    layerData = levelData[i];

    // Collision layer
    if (layerData.type === 'collision') {
      this.collisionMap = new CollisionMap(layerData.tilesize, layerData.data, layerData.collisionGroup || s.collisionGroup)
        .addTo(this);
    }

    // Actor layer
    else if (layerData.type === 'actor') {
      // Create layer if not exist yet
      if (!this[layerData.container]) {
        this.createLayers(layerData.container, s.container);
      }

      // Spawn actors
      for (j = 0; j < layerData.actors.length; j++) {
        act = layerData.actors[j];
        this.spawnActor(act[0], act[1], act[2], layerData.container, act[3]);
      }
    }

    // Tile layer
    else if (layerData.type === 'tile') {
      tileset = layerData.tileset;
      if (Array.isArray(tileset) || (typeof(tileset) === 'string')) {
        tileset = loader.getTexture(tileset);
      }

      this.backgroundMaps.push(new BackgroundMap(layerData.tilesize, layerData.data, tileset)
        .addTo(this[layerData.parent || s.container]));
    }

    // Not supported types
    else {
      console.log('"' + layerData.type + '" layer is not supported!');
    }
  }
};
