// Modules
const core = require('engine/core');
const loader = require('engine/loader');
const device = require('engine/device');
const Game = require('engine/game');

const SystemTimer = require('engine/timer');

const { persistent, session } = require('engine/storage');

const { sounds } = require('engine/audio');

const analytics = require('engine/analytics');

const rnd = require('engine/rnd');

const keyboard = require('engine/keyboard');

const SystemGfx = require('engine/gfx');
const sprite = require('engine/gfx/sprite');
const graphics = require('engine/gfx/graphics');

const Entity = require('engine/entity');

const Loading = require('game/loading');


// Storage
persistent.addInt('score', 0);
session.addString('name', 'Sean');


// Resource loading
loader
  .add('KenPixel.fnt')
  .add('font-sheet', 'KenPixel.png')
  .add('bgm', 'bgm.mp3|webm')
  .load((loader, res) => {
    console.log('== loading completed! ==');
  });


// Custom entity class
class EntityCircle extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings);

    this.canEverTick = true;

    this.name = 'c0';
    this.tag = 'primitive';

    this.layerName = 'actor';
    this.gfx = graphics({
      shape: 'Circle',
      color: 0xff0000,
      radius: 20,
    });

    this.count = 0;
  }
  update(_, dt) {
    this.position.x += dt * 120;
    if (this.position.x > core.width) {
      this.position.x -= core.width;

      if (this.count++ > 2) {
        this.remove();
      }
    }
  }
}


// Custom game class
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

    // Gfx
    this.sysGfx
      .createLayer('background')
      .createLayer('entities')
        .createLayer('deco', 'entities')
        .createLayer('actor', 'entities')
        .createLayer('fx', 'entities')
      .createLayer('ui');

    this.sysGfx.backgroundColor = 0xcccccc;
    let spr = sprite({
      texture: 'font-sheet',
    }).addTo(this.sysGfx.layers['ui']);

    // Entity
    let ent = this.spawnEntity(EntityCircle, core.width / 2, core.height / 2);
    console.log((ent.gfx.parent === this.sysGfx.layers['actor']) ? '"ent" added to right layer' : '"ent" added to wrong layer!');
    console.log((ent === this.getEntityByName('c0')) ? '"ent" can be found by name' : '"ent" cannot be found by name!');
    console.log((ent === this.getEntitiesByTag('primitive')[0]) ? '"ent" can be found by tag' : '"ent" cannot be found by tag!');
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
