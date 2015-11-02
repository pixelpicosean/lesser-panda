import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';

import 'game/loading';

function Main() {
  Scene.call(this);

  this.text = new PIXI.Text('It Works!', {
    font: '32px Verdana',
    fill: 'white',
  }).addTo(this.container);
  this.text.position.set(engine.width * 0.5 - this.text.width * 0.5, engine.height * 0.5 - this.text.height * 0.5);

  console.log(`engine.size = (${engine.width}, ${engine.height})`);
}
Main.prototype = Object.create(Scene.prototype);
Object.assign(Main.prototype, {
  constructor: Main,
});
engine.addScene('Main', Main);

engine.startWithScene('Loading');
