import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import loader from 'engine/loader';
import physics from 'engine/physics';

import Tilemap from 'engine/tilemap';

import config from 'game/config';
import 'game/loading';

loader.addAsset('tileset.png', 'world');

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

    const tilesets = {
      world: loader.resources['world'].texture,
    };

    // List of layers
    const data = [
      {
        tilesize: 16,
        width: 4,
        height: 5,
        tileset: 'world',
        data: [
          [ 0,  1,  2,  3],
          [ 8,  9, 10, 11],
          [16, 17, 18, 19],
          [24, 25, 26, 27],
          [32, 33, 34, 35],
        ],
      },
      {
        tilesize: 16,
        width: 4,
        height: 5,
        collision: true,
        data: [
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
        ],
      }
    ];

    const tilemap = new Tilemap(tilesets, data)
      .addTo(this.stage);
    tilemap.scale.set(2);
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
