import core from 'engine/core';
import Game from 'engine/game';

class MyGame extends Game {
  constructor() {
    super();

    this.desiredFPS = 10;

    console.log('constructor');
  }
  awake() {
    super.awake();

    console.log('awake');
  }
  update() {
    super.update();

    // console.log('update');
  }
  fixedUpdate() {
    super.fixedUpdate();

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

core.main(null, MyGame);
