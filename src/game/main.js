import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';

import 'game/loading';

import loader from 'engine/loader';

loader.addAsset('KenPixel.fnt');

class Main extends Scene {
  constructor() {
    super();

    // Use the better Text instead
    let text = new PIXI.extras.BitmapText('It Works!', {
      font: '24px KenPixel',
    }).addTo(this.stage);
    text.position.set(engine.width * 0.5 - text.width * 0.5, engine.height * 0.5 - text.height * 0.5);
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
