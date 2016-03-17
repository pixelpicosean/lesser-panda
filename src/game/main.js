import engine from 'engine/core';
import Scene from 'engine/scene';
import PIXI from 'engine/pixi';
import Timer from 'engine/timer';
import audio from 'engine/audio';
import loader from 'engine/loader';
import physics from 'engine/physics';
import { Action } from 'engine/animation';

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

    // Add a solid box at the bottom for collision
    const plane = new PIXI.Graphics().addTo(this.stage);
    plane.beginFill(0x39bdfd);
    plane.drawRect(-120, -6, 240, 12);
    plane.endFill();
    plane.position.set(engine.width * 0.5, engine.height - 10);

    const planeBody = new physics.Body({
      collisionGroup: 0,
      shape: new physics.Box(240, 12),
    }).addTo(this.world);
    planeBody.anchor.set(0.5);  // Set the anchor to meet the one of plane
    planeBody.position = plane.position;  // Trick: sync their position

    // Add another box bounce off it
    const box = new PIXI.Graphics().addTo(this.stage);
    box.beginFill(0xcdced1);
    box.drawRect(-8, -8, 16, 16);
    box.endFill();
    box.position.set(engine.width * 0.5, engine.height - 50);

    const boxBody = new physics.Body({
      mass: 1,
      collisionGroup: 1,
      collideAgainst: [0],
      shape: new physics.Box(16, 16),
      collide: (other) => {
        boxBody.velocity.y = -boxBody.velocity.y;
        return true;
      },
    }).addTo(this.world);
    boxBody.anchor.set(0.5);  // Set the anchor to meet the one of plane
    boxBody.position = box.position;  // Trick: sync their position
  }
  update() {
    this.info.x = engine.width * 0.5 - this.info.width * 0.5;
  }
};
engine.addScene('Main', Main);

engine.startWithScene('Loading');
