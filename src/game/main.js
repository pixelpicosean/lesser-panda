import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import loader from 'engine/loader';
import physics from 'engine/physics';
import Vector from 'engine/vector';

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

    // Create a box to collide with the tilemap
    const box = new PrimitiveActor('Box', 0xfff4ed, 8).addTo(this, this.bottomLayer);
    box.mass = 0.02;
    box.velocityLimit.set(64);
    box.collisionGroup = GROUPS.BOX;
    box.collideAgainst = [GROUPS.SOLID];
    box.body.collide = (other) => {
      if (other.collisionGroup === GROUPS.SOLID) {
        return true;
      }
    };
    box.position.set(16, 144);

    // Draw edge and normals
    this.drawBody(box.body, box.sprite);
    for (let i = 0; i < tilemap2.collisionLayer.bodies.length; i++) {
      this.drawBodyStatic(tilemap2.collisionLayer.bodies[i], this.topLayer);
    }
  }
  drawBody(body, parent, lineWidth = 1) {
    for (let i = 0; i < body.shape.points.length; i++) {
      let p0 = body.shape.points[i];
      let p1 = p0.clone().add(body.shape.edges[i]);

      let segGfx = new PIXI.Graphics().addTo(parent);
      segGfx.lineStyle(lineWidth, 0xff2f62);
      segGfx.moveTo(p0.x, p0.y);
      segGfx.lineTo(p1.x, p1.y);

      let vecN = body.shape.normals[i].clone().multiply(4);
      let segNormalGfx = new PIXI.Graphics().addTo(parent);
      segNormalGfx.lineStyle(1, 0x00e56e);
      segNormalGfx.moveTo(0, 0);
      segNormalGfx.lineTo(vecN.x, vecN.y);
      segNormalGfx.position
        .copy(p1).subtract(p0).multiply(0.5)
        .add(p0);
    }
  }
  drawBodyStatic(body, parent, lineWidth = 1) {
    for (let i = 0; i < body.shape.points.length; i++) {
      let p0 = body.shape.points[i];
      let p1 = p0.clone().add(body.shape.edges[i]);

      let segGfx = new PIXI.Graphics().addTo(parent);
      segGfx.lineStyle(lineWidth, 0xff2f62);
      segGfx.moveTo(p0.x, p0.y);
      segGfx.lineTo(p1.x, p1.y);
      segGfx.position.add(body.position);

      let vecN = body.shape.normals[i].clone().multiply(4);
      let segNormalGfx = new PIXI.Graphics().addTo(parent);
      segNormalGfx.lineStyle(1, 0x00e56e);
      segNormalGfx.moveTo(0, 0);
      segNormalGfx.lineTo(vecN.x, vecN.y);
      segNormalGfx.position
        .copy(p1).subtract(p0).multiply(0.5)
        .add(p0)
        .add(body.position);
    }
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
