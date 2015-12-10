import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';

import 'game/loading';

import loader from 'engine/loader';
loader.addAsset('bg_layer1.png', 'bg_layer1');
loader.addAsset('bg_layer2.png', 'bg_layer2');
loader.addAsset('bg_layer3.png', 'bg_layer3');
loader.addAsset('bg_layer4.png', 'bg_layer4');

class Main extends Scene {
  constructor() {
    super();

    console.log(`engine.size = (${engine.width}, ${engine.height})`);
    console.log(`engine.viewSize = (${engine.viewWidth}, ${engine.viewHeight})`);

    // Use the better Text instead
    let text = new PIXI.extras.Text('It Works!', {
      font: '24px Verdana',
      fill: 'white',
    }, window.devicePixelRatio).addTo(this.stage);
    text.position.set(engine.width * 0.5 - text.width * 0.5, engine.height * 0.5 - text.height * 0.5);

    let bg1 = new PIXI.Sprite(PIXI.Texture.fromAsset('bg_layer1')).addTo(this.stage);
    bg1.anchor.set(0, 1);
    bg1.position.set(0, engine.height);
    let bg2 = new PIXI.Sprite(PIXI.Texture.fromAsset('bg_layer2')).addTo(this.stage);
    bg2.anchor.set(0, 1);
    bg2.position.set(0, engine.height);
    let bg3 = new PIXI.Sprite(PIXI.Texture.fromAsset('bg_layer3')).addTo(this.stage);
    bg3.anchor.set(0, 1);
    bg3.position.set(0, engine.height);
    let bg4 = new PIXI.Sprite(PIXI.Texture.fromAsset('bg_layer4')).addTo(this.stage);
    bg4.anchor.set(0, 1);
    bg4.position.set(0, engine.height);
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
