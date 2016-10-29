import core from 'engine/core';
import Game from 'engine/game';

import SystemTimer from 'engine/timer';

import { persistent, session } from 'engine/storage';

import loader from 'engine/loader';
import { sounds } from 'engine/audio';

persistent.addInt('score', 0);
session.addString('name', 'Sean');

loader
  .add('font', 'KenPixel.fnt')
  .add('font-sheet', 'KenPixel.png')
  .add('bgm', 'bgm.mp3|webm')
  .add('bgm2', 'bgm.mp3')
  .load((loader, res) => {
    console.log('== loading completed! ==');
  });

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

    // Test timers
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

    // Test storage
    persistent.load();
    console.log(`session test: ${session.get('name')}`);
    console.log(`persistent test: ${persistent.get('score')}`);

    // Audio
    sounds['bgm'].play();
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
