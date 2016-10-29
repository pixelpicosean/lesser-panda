import core from 'engine/core';
import Game from 'engine/game';

import SystemTimer from 'engine/timer';

class MyGame extends Game {
  constructor() {
    super();

    this.desiredFPS = 10;

    this.addSystem(new SystemTimer());

    console.log('constructor');
  }
  awake() {
    super.awake();

    console.log('awake');

    this.sTimer.later(1000, () => {
      console.log('pause timers');

      this.sTimer.pauseTimersTagged('aa');
    });
    this.sTimer.later(2000, () => {
      console.log('resume timers');

      this.sTimer.resumeTimersTagged('aa');
    });

    this.sTimer.later(2000, () => {
      console.log('hello from timer');
    }, null, 'aa');
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

core.main(null, MyGame);
