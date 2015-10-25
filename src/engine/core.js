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
    if (core.scenes[name]) {
      console.log(`Scene [${name}] is already defined!`);
      return;
    }

    let pair = { ctor: ctor, inst: null };
    core.scenes[name] = pair;
  },
  setScene(name) {
    let pair = core.scenes[name];

    if (!pair) {
      console.log(`Scene [${name}] is not defined!`);
      return;
    }

    core._nextScene = pair;
  },
  startLoop() {
    core._loopId = requestAnimationFrame(core.loop);
  },
  loop(timestamp) {
    core._loopId = requestAnimationFrame(core.loop);

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
  endLoop() {
    cancelAnimationFrame(core._loopId);
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
