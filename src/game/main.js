import loader from 'engine/loader';
import audio from 'engine/audio';
import keyboard from 'engine/keyboard';
import storage from 'engine/storage';

loader.addAsset('KenPixel.fnt');
loader.addAsset('KenPixel.png', 'fontTexture');

audio.addSound('tune2.mp3');

function LoadingScene() {
  loader.on('progress', (progress) => {
    console.log(`Load ${Math.floor(progress * 100)}%`);
  });
  loader.once('complete', () => {
    console.log('Assets loaded!');
  });
  loader.start();

  keyboard.once('keydown', function(key) {
    console.log(`${key} is pressed.`);
  });

  storage.set('name', 'Sean');
  console.log(`get data from storage, name = ${storage.get('name')}`);
}

new LoadingScene();
