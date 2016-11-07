const core = require('engine/core');
const loader = require('engine/loader');
const Game = require('engine/Game');
const SystemGfx = require('engine/gfx');
const BitmapText = require('engine/gfx/BitmapText');

const Loading = require('game/Loading');

const SystemPhysics = require('engine/physics');
const AABBSolver = require('engine/physics/AABBSolver');
const Collider = require('engine/physics/Collider');
const CollisionMap = require('engine/physics/CollisionMap');

const keyboard = require('engine/keyboard');

// Resource loading
loader.add('KenPixel.fnt');

class MyGame extends Game {
  constructor() {
    super();

    this
      .addSystem(new SystemGfx())
      .addSystem(new SystemPhysics({
        solver: new AABBSolver(),
      }));

    this.sysGfx.createLayer('background');

    this.info = BitmapText({
      text: '()',
      font: '16px KenPixel',
    }).addTo(this.sysGfx.layers['background']);
    this.info.position.set(20, 20);

    let map = CollisionMap(16, [
      [1,1,1,1],
      [1,0,0,1],
      [1,0,0,1],
      [1,1,1,1],
    ]);
    this.sysPhysics.collisionMap = map;
    this.c = Collider({
      shape: 'Box',
      width: 18, height: 18,
      position: { x: 32, y: 32 },
    });
    this.sysPhysics.addCollider(this.c);
  }
  fixedUpdate(_, dt) {
    super.fixedUpdate(_, dt);

    if (keyboard.down('LEFT')) {
      this.c.velocity.x = -5;
    }
    else if (keyboard.down('RIGHT')) {
      this.c.velocity.x = +5;
    }
    else {
      this.c.velocity.x = 0;
    }

    this.info.text = `pos(${this.c.position.x}, ${this.c.position.y})
vel(${this.c.velocity.x}, ${this.c.velocity.y})`;
  }
}

core.main(MyGame, Loading);
