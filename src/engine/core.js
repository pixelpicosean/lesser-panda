import 'engine/polyfill';

import EventEmitter from 'engine/eventemitter3';
import Scene from 'engine/scene';
import Renderer from 'engine/renderer';
import Timer from 'engine/timer';
import config from 'game/config';

// Math extensions
Object.assign(Math, {
  /**
   * Force a value within the boundaries by clamping `x` to the range `[a, b]`.
   *
   * @method Math.clamp
   * @param {number} x
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  clamp: function (x, a, b) {
    return (x < a) ? a : ((x > b) ? b : x);
  },
});

// Engine core
let core = Object.assign(new EventEmitter(), {
  scenes: {},
  scene: null,

  width: config.width || 640,
  height: config.height || 400,

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

  startWithScene(sceneName) {
    core.setScene(sceneName);

    window.addEventListener('load', core.boot, false);
    document.addEventListener('DOMContentLoaded', core.boot, false);
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

      core.scene && core.scene._freeze();

      if (!pair.inst) {
        pair.inst = new pair.ctor();
      }

      core.scene = pair.inst;
      core.scene._awake();
    }

    core.scene && core.scene.tickAndRun();
  },
  endLoop() {
    cancelAnimationFrame(core._loopId);
  },

  boot() {
    window.removeEventListener('load', core.boot);
    document.removeEventListener('DOMContentLoaded', core.boot);

    Renderer.init(core.width, core.height, Object.assign({
      canvasId: 'game',
    }, config.renderer));
    core.startLoop();
  },
});

export default core;
