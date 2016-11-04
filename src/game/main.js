const core = require('engine/core');
const loader = require('engine/loader');
const Game = require('engine/Game');
const SystemGfx = require('engine/gfx');
const BitmapText = require('engine/gfx/BitmapText');

const Loading = require('game/Loading');

// Resource loading
loader.add('KenPixel.fnt');

class MyGame extends Game {
  constructor() {
    super();

    this.addSystem(new SystemGfx({ scaleMode: 'nearest' }));

    this.sysGfx.createLayer('background');

    let t = BitmapText({
      text: 'It Works!',
      font: '16px KenPixel',
      position: { x: core.width / 2, y: core.height / 2 },
    }).addTo(this.sysGfx.layers['background']);
    t.pivot.set(t.width / 2, t.height / 2);
  }
}

core.main(MyGame, Loading);
