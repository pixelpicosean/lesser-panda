import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import audio from 'engine/audio';
import loader from 'engine/loader';
import 'engine/timeline';

import 'game/loading';

// Load textures
loader.addAsset('gold_1.png', 'gold_1');
loader.addAsset('gold_2.png', 'gold_2');
loader.addAsset('gold_3.png', 'gold_3');
loader.addAsset('gold_4.png', 'gold_4');
// Load bitmap fonts
loader.addAsset('KenPixel.fnt');
// Load audio files
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

    const anim = new PIXI.extras.Animation([
      PIXI.Texture.fromAsset('gold_1'),
      PIXI.Texture.fromAsset('gold_2'),
      PIXI.Texture.fromAsset('gold_3'),
      PIXI.Texture.fromAsset('gold_4'),
    ]).addTo(this.stage);
    anim.position.set(engine.width * 0.5, 50);
    anim.anchor.set(0.5);
    anim.addAnim('rotate', [0, 1, 2, 3, 2, 1], { speed: 12 });
    anim.play('rotate');
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
