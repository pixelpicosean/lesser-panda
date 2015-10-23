import loader from 'engine/loader';
import audio from 'engine/audio';

loader.addAsset('KenPixel.fnt');
loader.addAsset('KenPixel.png', 'fontTexture');

audio.addSound('tune2.mp3');

class LoadingScene {
  constructor() {
    loader.on('progress', (progress) => {
      console.log(`Load ${Math.floor(progress * 100)}%`);
    });
    loader.once('complete', () => {
      console.log('Assets loaded!');
    });
    loader.start();
  }
}

new LoadingScene();
