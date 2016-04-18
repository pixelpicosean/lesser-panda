import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import loader from 'engine/loader';
import physics from 'engine/physics';

import Tilemap from 'engine/tilemap';

import config from 'game/config';
import 'game/loading';

import PrimitiveActor from 'engine/actors/primitive-actor';

loader.addAsset('tileset.png');
loader.addAsset('room.json');

// Constants
const GROUPS = {
  SOLID:  physics.getGroupMask(0),
  BOX:    physics.getGroupMask(1),
  CIRCLE: physics.getGroupMask(2),
};

PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

class Main extends Scene {
  awake() {
    this.backgroundColor = 0xaaaaaa;

    this.bottomLayer = new PIXI.Container().addTo(this.stage);
    this.topLayer = new PIXI.Container().addTo(this.stage);

    // Tileset table
    const tilesets = {
      'tileset.png': loader.resources['tileset.png'].texture,
    };

    // Create a tilemap from Tiled JSON map
    const map = loader.resources['room.json'].data;
    const tilemap2 = Tilemap.fromTiledJson(map, tilesets, GROUPS.SOLID)
      .addTo(this, this.bottomLayer);

    const box = new PrimitiveActor('Box', 0xfff4ed, 8).addTo(this, this.bottomLayer);
    box.mass = 0.01;
    box.collisionGroup = GROUPS.BOX;
    box.collideAgainst = [GROUPS.SOLID];
    box.body.collide = (other) => {
      if (other.collisionGroup === GROUPS.SOLID) {
        console.log('collide');
        return true;
      }
    };
    box.position.set(16, 144);
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
