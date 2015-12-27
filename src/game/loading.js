import engine from 'engine/core';
import Scene from 'engine/scene';
import loader from 'engine/loader';
import PIXI from 'engine/pixi';

import config from 'game/config';

const BAR_WIDTH = 200;
const BAR_HEIGHT = 20;

class Loading extends Scene {
  constructor() {
    super();

    this.barBg = new PIXI.Graphics().addTo(this.stage);
    this.barBg.beginFill(0x5f574f);
    this.barBg.drawRect(0, -BAR_HEIGHT * 0.5, BAR_WIDTH, BAR_HEIGHT);
    this.barBg.endFill();

    this.bar = new PIXI.Graphics().addTo(this.stage);
    this.bar.beginFill(0xffffff);
    this.bar.drawRect(0, -BAR_HEIGHT * 0.5, 1, BAR_HEIGHT);
    this.bar.endFill();

    this.barBg.position = this.bar.position.set(engine.width * 0.5 - BAR_WIDTH * 0.5, engine.height * 0.5);
  }

  awake() {
    let redraw = (p) => {
      this.bar.clear();
      this.bar.beginFill(0xffffff);
      this.bar.drawRect(0, -BAR_HEIGHT * 0.5, Math.floor(BAR_WIDTH * p), BAR_HEIGHT);
      this.bar.endFill();
    };

    loader.on('progress', redraw);
    loader.once('complete', function() {
      loader.off('progress', redraw);

      // Do any assets post process
      // (such as saving textures, creating spritesheet textures...)
      // before switch to the "firstScene"

      // Start "Main" scene when assets loaded
      engine.setScene(config.firstScene || 'Main');
    });

    loader.start();
  }
};

engine.addScene('Loading', Loading);
