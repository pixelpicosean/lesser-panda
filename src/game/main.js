import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import loader from 'engine/loader';

import 'game/loading';

loader.addAsset('KenPixel.fnt');

PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

class Main extends Scene {
  awake() {
    const text = new PIXI.extras.BitmapText('It Works!', {
      font: '16px KenPixel',
    }).addTo(this.stage);
    text.position
      .set(engine.width * 0.5, engine.height * 0.5)
      .subtract(text.width * 0.5, text.height * 0.5);
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
