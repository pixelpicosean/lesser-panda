// Modules
const core = require('engine/core');
const loader = require('engine/loader');
const device = require('engine/device');
const Game = require('engine/Game');
const Vector = require('engine/Vector');

const SystemTimer = require('engine/timer');

const { persistent, session } = require('engine/storage');

const { sounds } = require('engine/audio');

const analytics = require('engine/analytics');

const rnd = require('engine/rnd');

const keyboard = require('engine/keyboard');

const SystemGfx = require('engine/gfx');
const Sprite = require('engine/gfx/Sprite');
const AnimatedSprite = require('engine/gfx/AnimatedSprite');
const TilingSprite = require('engine/gfx/TilingSprite');
const Graphics = require('engine/gfx/Graphics');
const Text = require('engine/gfx/Text');
const BitmapText = require('engine/gfx/BitmapText');
const Plane = require('engine/gfx/Plane');
const Rope = require('engine/gfx/Rope');
const BackgroundMap = require('engine/gfx/BackgroundMap');
const { filmstrip } = require('engine/gfx/utils');
require('engine/gfx/interaction');
const DotScreenFilter = require('engine/gfx/filters/dot/DotScreenFilter');

const Entity = require('engine/Entity');

const Loading = require('game/Loading');

const SystemAnime = require('engine/anime');

const SystemPhysics = require('engine/physics');
const { getGroupMask } = SystemPhysics;
const AABBSolver = require('engine/physics/AABBSolver');
const Collider = require('engine/physics/Collider');


// Storage
persistent.addInt('score', 0);
session.addString('name', 'Sean');


// Resource loading
let texExplo;
loader
  .add('KenPixel.fnt')
  .add('font-sheet', 'KenPixel.png')
  .add('bgm', 'bgm.mp3|webm')
  .add('explo', 'explo.png')
  .load(() => {
    console.log('== loading completed! ==');
    texExplo = filmstrip(loader.resources['explo'].texture, 64, 64);
  });


// Custom entity class
class EntityGfx extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings);

    this.canEverTick = true;

    this.name = 'c0';
    this.tag = 'primitive';

    this.layerName = 'actor';
    this.gfx = Graphics({
      shape: 'Circle',
      color: 0xffffff,
      radius: 20,
      tint: 0xff0000,
    });
    Text({
      text: 'Hello',
      font: '12px Verdana',
      fill: '#fff',
      anchor: { x: 0.5, y: 0.5 },
    }).addTo(this.gfx);

    this.count = 0;
  }
  update(_, dt) {
    this.position.x += dt * 120;
    if (this.position.x > core.width) {
      this.position.x -= core.width;

      if (this.count++ > 3) {
        this.remove();
      }
    }
  }
}

const GROUPS = {
  SOLID: getGroupMask(0),
  BOX: getGroupMask(1),
};

// Box with a collider
class EntityBox extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings);

    this.name = 'b0';
    this.tag = 'physics';

    this.layerName = 'actor';
    this.gfx = Graphics({
      shape: 'Box',
      color: 0xffffff,
      width: 40, height: 40,
    });
    let t = BitmapText({
      text: 'Box',
      font: '20px KenPixel',
    }).addTo(this.gfx);
    t.position.subtract(t.width / 2, t.height / 2);

    this.coll = Collider({
      mass: 1,
      shape: 'Box',
      width: 40, height: 40,
      collisionGroup: GROUPS.BOX,
      collideAgainst: GROUPS.SOLID,
      collide: function(other, dir) {
        // Bounce back
        if (dir === 'U') {
          this.velocity.y = +Math.abs(this.velocity.y);
        }
        else if (dir === 'D') {
          this.velocity.y = -Math.abs(this.velocity.y);
        }
        return true;
      },
    });
  }
}
class EntityCircle extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings);

    this.name = 'c0';
    this.tag = 'physics';

    this.layerName = 'actor';
    this.gfx = Graphics({
      shape: 'Circle',
      color: 0xffffff,
      radius: 20,
    });

    this.coll = Collider({
      mass: 1,
      shape: 'Circle',
      radius: 20,
      collisionGroup: GROUPS.BOX,
      collideAgainst: GROUPS.SOLID,
      collide: function(other, angle) {
        // Bounce back
        if (angle > 0) {
          this.velocity.y = -Math.abs(this.velocity.y);
        }
        else if (angle < 0) {
          this.velocity.y = +Math.abs(this.velocity.y);
        }
        return true;
      },
    });
  }
}
class EntitySolid extends Entity {
  constructor(x, y, settings) {
    super(x, y, settings);

    this.name = 'ground';
    this.tag = 'physics';

    this.layerName = 'actor';
    this.gfx = Graphics({
      shape: 'Box',
      color: 0xffffff,
      width: 200, height: 30,
    });

    this.coll = Collider({
      shape: 'Box',
      width: 200, height: 30,
      collisionGroup: GROUPS.SOLID,
      collide: () => false,
    });
  }
}


// Custom game class
class MyGame extends Game {
  constructor() {
    super();

    this.desiredFPS = 60;

    this
      .addSystem(new SystemTimer())
      .addSystem(new SystemAnime())
      .addSystem(new SystemPhysics({
        solver: new AABBSolver(),
        gravity: { y: 500 },
      }))
      .addSystem(new SystemGfx());

    this.systemOrder = [
      'Timer',
      'Anime',
      'Physics',
      'Gfx',
    ];

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
    console.log(`random integer: ${rnd.between(0, 1000000)}`);

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
    let spr = Sprite({
      texture: 'font-sheet',
      interactive: true,
    }).addTo(this.sysGfx.layers['ui']);
    spr.on('mousedown', () => {
      console.log('clicked');
    });

    let tSpr = TilingSprite({
      texture: 'font-sheet',
      width: 40,
      height: 40,
    }).addTo(this.sysGfx.layers['ui']);
    tSpr.position.set(300, 300);

    let aSpr = AnimatedSprite({
      textures: texExplo,
    }).addTo(this.sysGfx.layers['ui']);
    aSpr.position.set(200, 200);
    aSpr.play();
    aSpr.filters = [new DotScreenFilter()];

    let p = Plane({ texture: 'font-sheet' })
      .addTo(this.sysGfx.layers['ui']);
    p.position.set(200, 0);

    let r = Rope({
      texture: 'font-sheet',
      points: [
        new Vector(0, 0),
        new Vector(32, -20),
        new Vector(64, 0),
        new Vector(96, 20),
        new Vector(128, 0),
      ],
    }).addTo(this.sysGfx.layers['ui']);
    r.position.set(100, 300);

    let map = BackgroundMap({
      tilesize: 64,
      data: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [2, 2, 2, 2],
        [3, 3, 3, 3],
      ],
      tileset: 'explo',
    }).addTo(this.sysGfx.layers['background']);
    map.position.set(40, 40);
    map.setTile(0, 0, 4);

    // Entity
    let ent = this.spawnEntity(EntityGfx, core.width / 2, core.height / 2);
    console.log((ent.gfx.parent === this.sysGfx.layers['actor']) ? '"ent" added to right layer' : '"ent" added to wrong layer!');
    console.log((ent === this.getEntityByName('c0')) ? '"ent" can be found by name' : '"ent" cannot be found by name!');
    console.log((ent === this.getEntitiesByTag('primitive')[0]) ? '"ent" can be found by tag' : '"ent" cannot be found by tag!');

    // Anime
    this.sysAnime.tween(ent.position)
      .to({ y: 100 }, 1000, 'Quadratic.InOut')
      .to({ y: core.height - 100 }, 1000, 'Quadratic.InOut')
      .to({ y: core.height / 2 }, 1000, 'Quadratic.InOut')
      .repeat(2)
      .once('finish', () => {
        console.log('animation finished');
      });

    // Physics
    let a = this.spawnEntity(EntityBox, core.width / 2 - 60, core.height / 3);
    let b = this.spawnEntity(EntityCircle, core.width / 2 + 60, core.height / 3);
    let ground = this.spawnEntity(EntitySolid, core.width / 2, core.height / 3 * 2);
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
