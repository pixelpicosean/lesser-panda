const core = require('engine/core');
const Game = require('engine/game');

const SystemTimer = require('engine/timer');

const { persistent, session } = require('engine/storage');

const loader = require('engine/loader');
const { sounds } = require('engine/audio');
const analytics = require('engine/analytics');
const device = require('engine/device');
const rnd = require('engine/rnd');
const keyboard = require('engine/keyboard');
const SystemGfx = require('engine/gfx');
const sprite = require('engine/gfx/sprite');
const Loading = require('game/loading');

persistent.addInt('score', 0);
session.addString('name', 'Sean');

loader
  .add('KenPixel.fnt')
  .add('font-sheet', 'KenPixel.png')
  .add('bgm', 'bgm.mp3|webm')
  .add('bgm2', 'bgm.mp3')
  .load((loader, res) => {
    console.log('== loading completed! ==');
  });

class MyGame extends Game {
  constructor() {
    super();

    this.desiredFPS = 10;

    this
      .addSystem(new SystemTimer())
      .addSystem(new SystemGfx());

    console.log('constructor');
  }
  awake() {
    super.awake();

    console.log(`awake from a "${device.mobile ? 'mobile' : 'desktop'}" device`);

    // Test timers
    this.sysTimer.later(1000, () => {
      console.log('pause timers');

      this.sysTimer.pauseTimersTagged('aa');
    });
    this.sysTimer.later(2000, () => {
      console.log('resume timers');

      this.sysTimer.resumeTimersTagged('aa');
    });

    this.sysTimer.later(2000, () => {
      console.log('hello from timer');
    }, null, 'aa');

    // Test storage
    persistent.load();
    console.log(`session test: ${session.get('name')}`);
    console.log(`persistent test: ${persistent.get('score')}`);

    // Audio
    // sounds['bgm'].play();

    // Rnd
    console.log(`random integer: ` + rnd.between(0, 1000000));

    // Keyboard
    keyboard.on('keydown', (k) => console.log(`Pressed "${k}"`));

    // Pixi
    this.sysGfx.backgroundColor = 0xcccccc;
    let spr = sprite({
      texture: 'font-sheet',
    }).addTo(this.sysGfx.root);
    console.log(spr);
  }
  update(dt, dtSec) {
    super.update(dt, dtSec);

    // console.log('update');
  }
  fixedUpdate(dt, dtSec) {
    super.fixedUpdate(dt, dtSec);

    // console.log('fixedUpdate');
  }
  freeze() {
    super.freeze();

    console.log('freeze');
  }

  resize() {
    console.log('resize');
  }
  pause() {
    console.log('pause');
  }
  resume() {
    console.log('resume');
  }
}

core.main(MyGame, Loading);
