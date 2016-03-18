import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import audio from 'engine/audio';
import loader from 'engine/loader';
import physics from 'engine/physics';
import { Action } from 'engine/animation';

import config from 'game/config';
import 'game/loading';

// Load textures
loader.addAsset('gold_1.png', 'gold_1');
loader.addAsset('gold_2.png', 'gold_2');
loader.addAsset('gold_3.png', 'gold_3');
loader.addAsset('gold_4.png', 'gold_4');
// Load bitmap fonts
loader.addAsset('KenPixel.fnt');
// Load audio files
loader.addSound(['boot.m4a', 'boot.ogg'], 'bgm');

PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

class Main extends Scene {
  constructor() {
    super();

    // PIXI instance
    let text = new PIXI.extras.BitmapText('It Works!', {
      font: '32px KenPixel',
    }).addTo(this.stage);
    text.y = engine.height * 0.5;
    this.info = text;

    // Both number and string text can be tweened
    this.tween(text)
      .to({ 'scale.x': 1.2, 'scale.y': 1.2 }, 200)
      .to({ 'scale.x': 1.0, 'scale.y': 1.0 }, 200)
      .repeat(3)
      .wait(1000)
      .to({ text: 'A Sean Production!' }, 2000);

    Timer.later(200, () => audio.sounds['bgm'].play());

    // AnimatedSprite with frames
    const anim = new PIXI.extras.AnimatedSprite([
      PIXI.Texture.fromAsset('gold_1'),
      PIXI.Texture.fromAsset('gold_2'),
      PIXI.Texture.fromAsset('gold_3'),
      PIXI.Texture.fromAsset('gold_4'),
    ]).addTo(this.stage);
    anim.position.set(engine.width * 0.5, 50);
    anim.anchor.set(0.5);
    anim.addAnim('rotate', [0, 1, 2, 3, 2, 1], { speed: 12 });
    anim.play('rotate');

    // Blender/Flash like keyframe based animation
    const moveAct = Action.create()
      .channel('position.x')
        .key(0, engine.width * 0.5)
        .key(1000, engine.width * 0.8)
        .key(3000, engine.width * 0.2)
        .key(4000, engine.width * 0.5);

    let count = 0;
    const animPlayer = this.runAction(moveAct, anim);
    animPlayer.speed = -1;
    animPlayer.on('loop', () => console.log(`loop ${++count} times`));

    // Add some solid boxes to construct a manger
    this.addSolidBox(engine.width * 0.5, engine.height - 10, 240, 12, { color: 0x39bdfd });
    this.addSolidBox(42, engine.height - 20, 12, 32, { color: 0x39bdfd });
    this.addSolidBox(engine.width - 42, engine.height - 20, 12, 32, { color: 0x39bdfd });

    // Add a box that bouncing off the manger
    this.box = this.addBox(engine.width * 0.5, engine.height - 50, 16, 16, { color: 0xcdced1, mass: 0.2 });
    this.box.rotation = Math.PI * 0.25;
    this.box.body.velocity.x = 30;
  }
  update(dt) {
    this.info.x = engine.width * 0.5 - this.info.width * 0.5;

    // Rotation also affects collisions
    this.box.rotation += Math.PI * (dt * 0.001) * (this.box.body.velocity.x * 0.075);
  }

  addBox(x, y, w, h, { color, mass = 0 }) {
    const graphic = new PIXI.Graphics().addTo(this.stage);
    graphic.beginFill(color);
    graphic.drawRect(-w / 2, -h / 2, w, h);
    graphic.endFill();
    graphic.position.set(x, y);

    const body = new physics.Body({
      mass: mass, // 0 mass makes it not affected by gravity
      shape: new physics.Box(w, h),
      collisionGroup: 1,
      collideAgainst: [0],
      collide: (other, response) => {
        // Always bounce back
        if (config.physics.solver === 'SAT') {
          body.velocity
            .subtract(response.overlapN.multiply(
              Math.abs(body.velocity.x * 2),
              Math.abs(body.velocity.y * 2)
            ));
        }
        else {
          if (response & physics.DOWN) {
            body.velocity.y = -body.velocity.y;
          }
          else if (response & (physics.RIGHT | physics.LEFT)) {
            body.velocity.x = -body.velocity.x;
          }
        }

        // Apply collision response to self
        return true;
      },
    }).addTo(this.world);
    body.anchor.set(0.5);  // Set the anchor to meet the one of graphic
    body.position = graphic.position;  // Trick: sync their position

    let box = {
      graphic,
      body,
    };
    Object.defineProperty(box, 'rotation', {
      get: () => body.rotation,
      set: (rot) => body.rotation = graphic.rotation = rot,
    });

    return box;
  }
  addSolidBox(x, y, w, h, { color, mass = 0 }) {
    const graphic = new PIXI.Graphics().addTo(this.stage);
    graphic.beginFill(color);
    graphic.drawRect(-w / 2, -h / 2, w, h);
    graphic.endFill();
    graphic.position.set(x, y);

    const body = new physics.Body({
      mass: mass, // 0 mass makes it not affected by gravity
      collisionGroup: 0,
      shape: new physics.Box(w, h),
    }).addTo(this.world);
    body.anchor.set(0.5);  // Set the anchor to meet the one of graphic
    body.position = graphic.position;  // Trick: sync their position

    let box = {
      graphic,
      body,
    };
    Object.defineProperty(box, 'rotation', {
      get: () => body.rotation,
      set: (rot) => body.rotation = graphic.rotation = rot,
    });

    return box;
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
