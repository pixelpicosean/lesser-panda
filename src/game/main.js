import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';

import 'game/loading';

class Main extends Scene {
  constructor() {
    super();

    // Use the better Text instead
    let text = new PIXI.extras.Text('It Works!', {
      font: '24px Verdana',
      fill: 'white',
    }, window.devicePixelRatio).addTo(this.stage);
    text.position.set(engine.width * 0.5 - text.width * 0.5, engine.height * 0.5 - text.height * 0.5);
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
