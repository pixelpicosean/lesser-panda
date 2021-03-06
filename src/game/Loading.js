import core from 'engine/core';
import Game from 'engine/Game';
import loader from 'engine/loader';
import Gfx from 'engine/gfx';
import Graphics from 'engine/gfx/Graphics';
import Text from 'engine/gfx/Text';

const BAR_WIDTH = Math.floor(core.width * 0.75);
const BAR_HEIGHT = Math.floor(BAR_WIDTH * 0.075);

export default class Loading extends Game {
  constructor() {
    super();

    this.addSystem(new Gfx());

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
      font: `${BAR_HEIGHT - 2}px "Helvetica Neue", "Calibri Light", Roboto, sans-serif`,
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
