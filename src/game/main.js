import engine from 'engine/core';
import Scene from 'engine/scene';

import loader from 'engine/loader';
import audio from 'engine/audio';
import keyboard from 'engine/keyboard';
import storage from 'engine/storage';
import Timer from 'engine/timer';
import Timeline from 'engine/timeline';
import physics from 'engine/physics';
import device from 'engine/device';

import PIXI from 'engine/pixi';

loader.addAsset('KenPixel.fnt');
loader.addAsset('meter.png', 'meter');

audio.addSound('tune2.mp3');

function Box(x, y, container) {
  let sprite = new PIXI.extras.BitmapText('BODY', {
    font: '48px KenPixel',
  }).addTo(container);
  sprite.pivot.set(sprite.width * 0.5, sprite.height * 0.5);
  sprite.position.set(x, y);

  let body = new physics.Body({
    mass: 0.4,
    shape: new physics.Rectangle(sprite.width, sprite.height),
    collisionGroup: 1,
    collideAgainst: [2],
  }).addTo(engine.scene.world);

  body.position = sprite.position;
}

function LoadingScene() {
  Scene.call(this);

  loader.on('progress', (progress) => {
    console.log(`Load ${Math.floor(progress * 100)}%`);
  });
  loader.once('complete', () => {
    console.log('Assets loaded!');

    let t = new PIXI.extras.BitmapText('#', {
      font: '32px KenPixel',
    });
    this.container.addChild(t);

    let anim = PIXI.extras.Animation.fromSpriteSheet('meter', 28, 7, 6)
      .addTo(this.container);
    anim.anchor.set(0.5);
    anim.position.set(160, 100);
    anim.play();

    let b = new Box(260, 10, this.container);
    let ground = new physics.Body({
      shape: new physics.Rectangle(320, 20),
      collisionGroup: 2,
    }).addTo(this.world);
    ground.position.set(160, 180);

    let c = 0;
    this.addTimeline(t)
      .to({ x: 300, y: 0 }, 1000)
      .to({ x: 300, y: 160 }, 1000)
      .to({ x: 0, y: 160 }, 1000)
      .to({ x: 0, y: 0 }, 1000)
      .to({
        x: [100, 100, 0, 0],
        y: [0, 100, 100, 0]
      }, 4000, 'Quadratic.InOut')
      .repeat(3)
      .on('repeat', function(t) {
        c++;
        if (c === 1) {
          t.interpolation = Timeline.Interpolation.Bezier;
        }
        else if (c === 2) {
          t.interpolation = Timeline.Interpolation.CatmullRom;
        }
        else if (c === 3) {
          c = 0;
          t.interpolation = Timeline.Interpolation.Linear;
        }
      })
      .on('finish', function() {
        console.log('action finished');
      });
  });
  loader.start();

  keyboard.once('keydown', function(key) {
    console.log(`${key} is pressed.`);
  });

  storage.set('name', 'Sean');
  console.log(`get data from storage, name = ${storage.get('name')}`);

  console.log(device);
}
LoadingScene.prototype = Object.create(Scene.prototype);
LoadingScene.prototype.constructor = LoadingScene;

LoadingScene.prototype.awake = function awake() {
  this.addTimer(1000, function() {
    console.log('Log after 1000ms.');
  }, this, false);

  console.log(`world.gravity = (${this.world.gravity.x}, ${this.world.gravity.y})`);
};

engine.addScene('LoadingScene', LoadingScene);

engine.startWithScene('LoadingScene');
