const core = require('engine/core');
const loader = require('engine/loader');
const Game = require('engine/Game');

// Systems
const SystemGfx = require('engine/gfx');
const BitmapText = require('engine/gfx/BitmapText');

// Loading screen
const Loading = require('game/Loading');

// Resource loading
loader.add('KenPixel.fnt');

class MyGame extends Game {
  constructor() {
    super();

    this.addSystem(new SystemGfx());

    this.sysGfx.createLayer('background');

    let t = BitmapText({
      text: 'It Works!',
      font: '16px KenPixel',
    }).addTo(this.sysGfx.layers['background']);
    t.position.set(core.width / 2 - t.width / 2, core.height / 2 - t.height / 2);
  }
}

core.main(MyGame, Loading);
