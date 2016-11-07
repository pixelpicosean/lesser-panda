const core = require('engine/core');
const Game = require('engine/Game');
const loader = require('engine/loader');
const SystemGfx = require('engine/gfx');
const Graphics = require('engine/gfx/Graphics');
const Text = require('engine/gfx/Text');

const BAR_WIDTH = Math.floor(core.width * 0.75);
const BAR_HEIGHT = Math.floor(BAR_WIDTH * 0.075);

class Loading extends Game {
  constructor() {
    super();

    this.addSystem(new SystemGfx());

    this.barBg = Graphics({}).addTo(this.sysGfx.root);
    this.barBg.clear();
    this.barBg.beginFill(0x5f574f);
    this.barBg.drawRect(0, -BAR_HEIGHT * 0.5, BAR_WIDTH, BAR_HEIGHT);
    this.barBg.endFill();

    this.bar = Graphics({}).addTo(this.sysGfx.root);
    this.bar.clear();
    this.bar.beginFill(0xffffff);
    this.bar.drawRect(0, -BAR_HEIGHT * 0.5, 1, BAR_HEIGHT);
    this.bar.endFill();

    this.pct = Text({
      text: '100%',
      font: `${BAR_HEIGHT - 2}px Verdana`,
      fill: '#ffffff',
      anchor: { x: 0.5, y: 0.5 },
      position: { x: core.width / 2, y: core.height / 2 - BAR_HEIGHT * 1.5 },
    }).addTo(this.sysGfx.root);

    this.barBg.position = this.bar.position.set(core.width / 2 - BAR_WIDTH / 2, core.height / 2);
  }

  awake({ gameClass }) {
    let redraw = () => {
      this.pct.text = `${loader.progress | 0}%`;

      this.bar.clear();
      this.bar.beginFill(0xffffff);
      this.bar.drawRect(0, -BAR_HEIGHT * 0.5, Math.floor(BAR_WIDTH * loader.progress * 0.01), BAR_HEIGHT);
      this.bar.endFill();
    };

    let h = loader.onProgress.add(redraw);
    const ready = () => {
      h.detach();
      core.setGame(gameClass, true);

      core.emit('ready');
    };

    loader.onComplete.once(ready);
    loader.load();
  }
}

module.exports = Loading;
