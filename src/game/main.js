import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import audio from 'engine/audio';
import loader from 'engine/loader';
import 'engine/timeline';

import 'game/loading';

loader.addAsset('KenPixel.fnt');
loader.addSound(['boot.m4a', 'boot.ogg'], 'bgm');

PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

class Main extends Scene {
  constructor() {
    super();

    let text = new PIXI.extras.BitmapText('It Works!', {
      font: '32px KenPixel',
    }).addTo(this.stage);
    text.pivot.set(text.width * 0.5, text.height * 0.5);
    text.position.set(engine.width * 0.5, engine.height * 0.5);

    this.addTimeline(text.scale)
      .to({ x: [1.2, 1.0], y: [1.2, 1.0] }, 200)
      .repeat(3);

    Timer.later(200, () => audio.sounds['bgm'].play());
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
