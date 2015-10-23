import loaderMgr from 'engine/loader-manager';
import audio from 'engine/audio';

audio.addSound('tune2.mp3', 'a');

class LoadingScene {
  constructor() {
    loaderMgr.on('progress', (progress) => {
      console.log(`Load ${Math.floor(progress * 100)}%`);
    });
    loaderMgr.once('complete', () => {
      console.log('Assets loaded!');

      audio.sounds['a'].play();
    });
    loaderMgr.start();
  }
}

new LoadingScene();
