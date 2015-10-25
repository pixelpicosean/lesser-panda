import engine from 'engine/core';
import Scene from 'engine/scene';

import loader from 'engine/loader';
import audio from 'engine/audio';
import keyboard from 'engine/keyboard';
import storage from 'engine/storage';
import Timer from 'engine/timer';

import PIXI from 'engine/pixi';

loader.addAsset('KenPixel.fnt');
loader.addAsset('KenPixel.png', 'fontTexture');

audio.addSound('tune2.mp3');

function LoadingScene() {
  Scene.call(this);

  loader.on('progress', (progress) => {
    console.log(`Load ${Math.floor(progress * 100)}%`);
  });
  loader.once('complete', () => {
    console.log('Assets loaded!');

    let a = new PIXI.Sprite(loader.resources['fontTexture'].texture);
    this.container.addChild(a);
  });
  loader.start();

  keyboard.once('keydown', function(key) {
    console.log(`${key} is pressed.`);
  });

  storage.set('name', 'Sean');
  console.log(`get data from storage, name = ${storage.get('name')}`);
}
LoadingScene.prototype = Object.create(Scene.prototype);
LoadingScene.prototype.constructor = LoadingScene;

LoadingScene.prototype.awake = function awake() {
  this.addTimer(1000, function() {
    console.log('Log after 1000ms.');
  }, this, false);
};

engine.addScene('LoadingScene', LoadingScene);

engine.startWithScene('LoadingScene');
