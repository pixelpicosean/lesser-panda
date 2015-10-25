import 'engine/polyfill';

import EventEmitter from 'engine/eventemitter3';
import Scene from 'engine/scene';
import Renderer from 'engine/renderer';
import Timer from 'engine/timer';
import config from 'game/config';

let core = Object.assign(new EventEmitter(), {
  scenes: {},
  scene: null,

  _nextScene: null,
  _loopId: 0,

  addScene(name, ctor) {
    if (this.scenes[name]) {
      console.log(`Scene [${name}] is already defined!`);
      return;
    }

    let pair = { ctor: ctor, inst: null };
    this.scenes[name] = pair;
  },
  setScene(name) {
    let pair = this.scenes[name];

    if (!pair) {
      console.log(`Scene [${name}] is not defined!`);
      return;
    }

    this._nextScene = pair;
  },
  startLoop() {
    this._loopId = requestAnimationFrame(this.loop);
  },
  loop(timestamp) {
    Timer.update(timestamp);

    if (core._nextScene) {
      let pair = core._nextScene;
      core._nextScene = null;

      if (!pair.inst) {
        pair.inst = new pair.ctor();
      }

      core.scene && core.scene._exit();
      core.scene = pair.inst;
      core.scene._awake();
    }

    core.scene && core.scene.tickAndRun();
  },
  stopLoop() {
    clearAnimationFrame(this._loopId);
  },

  boot() {
    Renderer.init(config.width || 640, config.height || 400, Object.assign({
      canvasId: 'game',
    }, config.renderer));
    core.startLoop();
  },
});

window.addEventListener('load', core.boot);

export default core;
