import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import loader from 'engine/loader';
import physics from 'engine/physics';

import Tilemap from 'engine/tilemap';

import config from 'game/config';
import 'game/loading';

loader.addAsset('tileset.png');
loader.addAsset('room.json');

// Constants
const GROUPS = {
  SOLID:  0,
  BOX:    1,
  CIRCLE: 2,
};

PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

class Main extends Scene {
  awake() {
    this.backgroundColor = 0xaaaaaa;

    // Tileset table
    const tilesets = {
      'tileset.png': loader.resources['tileset.png'].texture,
    };

    // Create a tilemap from Tiled JSON map
    const map = loader.resources['room.json'].data;
    const tilemap2 = Tilemap.fromTiledJson(map, tilesets)
      .addTo(this.stage);
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
