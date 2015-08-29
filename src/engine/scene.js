/**
  @module scene
  @namespace game
**/
game.module(
  'engine.scene'
)
.body(function() {
  'use strict';

  /**
    Game scene.
    @class Scene
  **/
  function Scene(settings) {
    game.scene = this;

    /**
      Background color of scene.
      @property {Number} backgroundColor
    **/
    this.backgroundColor = this.backgroundColor || Scene.backgroundColor;
    /**
      Minimum distance to trigger swipe.
      @property {Number} swipeDist
      @default 100
    **/
    this.swipeDist = this.swipeDist || 100;
    /**
      Maximum time to trigger swipe (ms).
      @property {Number} swipeTime
      @default 500
    **/
    this.swipeTime = this.swipeDist || 500;

    /**
      List of emitters in scene.
      @property {Array} emitters
    **/
    this.emitters = [];
    /**
      List of objects in scene.
      @property {Array} objects
    **/
    this.objects = [];
    /**
      Main container for scene.
      @property {Container} stage
    **/
    this.stage = null;
    /**
      List of timers in scene.
      @property {Array} timers
    **/
    this.timers = [];
    /**
      List of tweens in scene.
      @property {Array} tweens
    **/
    this.tweens = [];
    /**
     * Mouse position on screen
     * @type {game.Vector}
     */
    this.mouse = null;

    /**
      @property {Array} _updateOrder
      @private
    **/
    this._updateOrder = [];

    if (!this.backgroundColor && game.device.cocoonCanvasPlus) {
      this.backgroundColor = 0x000000;
    }

    if (game.audio && game.Audio.stopOnSceneChange && game.scene) {
      game.audio.stopMusic();
      game.audio.stopSound(false, true);
      game.audio.pausedSounds.length = 0;
      game.audio.playingSounds.length = 0;
    }

    for (var i = 0; i < Scene.updateOrder.length; i++) {
      this._updateOrder.push(Scene.updateOrder[i].ucfirst());
    }

    game.system.stage.removeChildren();
    game.system.renderer.backgroundColor = this.backgroundColor;

    this.stage = new game.Container();
    if (game.system.webGL && game.device.cocoonJS) {
      var rendererRatio = game.renderer.width / game.renderer.height;
      var systemRatio = game.system.width / game.system.height;
      if (rendererRatio < systemRatio) {
        var scale = game.renderer.width / game.system.width;
        this.stage.scale.set(scale, scale);
        this.stage.position.y = game.renderer.height / 2 - game.system.height * scale / 2;
      } else {
        var scale = game.renderer.height / game.system.height;
        this.stage.scale.set(scale, scale);
        this.stage.position.x = game.renderer.width / 2 - game.system.width * scale / 2;
      }
    }

    game.system.stage.addChild(this.stage);

    // Enable stage inputs and accept all events
    this.stage.interactive = true;
    this.stage.containsPoint = function() { return true; };

    this.stage.on('mousedown', this._mousedown, this);
    this.stage.on('mousemove', this._mousemove, this);
    this.stage.on('mouseup', this._mouseup, this);
    this.stage.on('mouseout', this._mouseout, this);

    this.stage.on('touchstart', this._touchstart, this);
    this.stage.on('touchmove', this._touchmove, this);
    this.stage.on('touchend', this._touchend, this);

    if (game.debugDraw) game.debugDraw.reset();
  }

  /**
    Add particle emitter to scene.
    @method addEmitter
    @param {Emitter} emitter
  **/
  Scene.prototype.addEmitter = function addEmitter(emitter) {
    if (this.emitters.indexOf(emitter) === -1) {
      this.emitters.push(emitter);
    }
  };

  /**
    Add object to scene, so it's `update()` function get's called every frame.
    @method addObject
    @param {Object} object
  **/
  Scene.prototype.addObject = function addObject(object) {
    if (this.objects.indexOf(object) === -1) {
      object._remove = false;
      this.objects.push(object);
    }
  };

  /**
    Add timer to game scene.
    @method addTimer
    @param {Number} time Time in milliseconds
    @param {Function} callback Callback function to run, when timer ends.
    @param {Boolean} repeat
    @return {Timer}
  **/
  Scene.prototype.addTimer = function addTimer(time, callback, repeat) {
    var timer;
    if (timer = game.pool.get('Timer')) {
      game.Timer.call(timer, time);
    } else {
      timer = new game.Timer(time);
    }

    timer.repeat = !!repeat;
    timer.callback = callback;
    this.timers.push(timer);
    return timer;
  };

  /**
    Shorthand for adding tween.
    @method addTween
    @param {Object} obj
    @param {Object} props
    @param {Number} time
    @param {Object} settings
  **/
  Scene.prototype.addTween = function addTween(obj, props, time, settings) {
    var tween = new game.Tween(obj);
    tween.to(props, time);
    for (var i in settings) {
      tween[i](settings[i]);
    }

    return tween;
  };

  /**
    Called, when scene is changed.
    @method exit
  **/
  Scene.prototype.exit = function exit() {};

  Scene.prototype._exit = function _exit() {
    this.stage.off('mousedown', this._mousedown, this);
    this.stage.off('mousemove', this._mousemove, this);
    this.stage.off('mouseup', this._mouseup, this);
    this.stage.off('mouseout', this._mouseout, this);

    this.stage.off('touchstart', this._touchstart, this);
    this.stage.off('touchmove', this._touchmove, this);
    this.stage.off('touchend', this._touchend, this);

    this.exit();
  };

  /**
    Callback for keydown.
    @method keydown
    @param {String} key
  **/
  Scene.prototype.keydown = function keydown() {};

  /**
    Callback for keyup.
    @method keyup
    @param {String} key
  **/
  Scene.prototype.keyup = function keyup() {};

  /**
    Callback for mousedown and touchstart on the scene stage.
    @method mousedown
    @param {InteractiveData} event
  **/
  Scene.prototype.mousedown = function mousedown() {};

  /**
    Callback for mouseup and touchend on the scene stage.
    @method mouseup
    @param {InteractiveData} event
  **/
  Scene.prototype.mouseup = function mouseup() {};

  /**
    Callback for mousemove and touchmove on the scene stage.
    @method mousemove
    @param {InteractiveData} event
  **/
  Scene.prototype.mousemove = function mousemove() {};

  /**
    Callback for mouseout on the scene stage.
    @method mouseout
    @param {InteractiveData} event
  **/
  Scene.prototype.mouseout = function mouseout() {};

  Scene.prototype.touchstart = function touchstart() {};

  Scene.prototype.touchmove = function touchmove() {};

  Scene.prototype.touchend = function touchend() {};

  /**
    Callback for swipe.
    @method swipe
    @param {InteractiveData} event
  **/
  Scene.prototype.swipe = function swipe() {};

  /**
    Remove emitter from scene.
    @method removeEmitter
    @param {game.Emitter} emitter
  **/
  Scene.prototype.removeEmitter = function removeEmitter(emitter) {
    emitter && emitter.remove();
  };

  /**
    Remove object from scene.
    @method removeObject
    @param {Object} object
  **/
  Scene.prototype.removeObject = function removeObject(object) {
    object._remove = true;
  };

  /**
    Remove timer from scene.
    @method removeTimer
    @param {Timer} timer
    @param {Boolean} doCallback
  **/
  Scene.prototype.removeTimer = function removeTimer(timer, doCallback) {
    if (!timer) return;
    if (!doCallback) timer.callback = null;
    timer.repeat = false;
    timer.set(0);
  };

  /**
    Remove all timers from scene.
    @method removeTimers
    @param {Boolean} [doCallback]
  **/
  Scene.prototype.removeTimers = function removeTimers(doCallback) {
    for (var i = this.timers.length - 1; i >= 0; i--) {
      this.removeTimer(this.timers[i], doCallback);
    }
  };

  /**
    Remove all tweens from scene.
    @method removeTweens
  **/
  Scene.prototype.removeTweens = function removeTweens() {
    for (var i = 0; i < this.tweens.length; i++) {
      this.tweens[i]._shouldRemove = true;
    }
  };

  /**
    Clear stage.
    @method clear
  **/
  Scene.prototype.clear = function clear() {
    for (var i = this.stage.children.length - 1; i >= 0; i--) {
      this.stage.removeChild(this.stage.children[i]);
    }
  };

  Scene.prototype.pause = function pause() {
    if (game.audio) game.audio._systemPause();
  };

  Scene.prototype.resume = function resume() {
    if (game.audio) game.audio._systemResume();
  };

  /**
    This is called every frame.
    @method update
  **/
  Scene.prototype.update = function update() {};

  Scene.prototype._mousedown = function _mousedown(event) {
    event.data._swipeStartTime = Date.now();
    event.data._swipeX = event.data.global.x;
    event.data._swipeY = event.data.global.y;
    this.mousedown(event);
  };

  Scene.prototype._mousemove = function _mousemove(event) {
    this.mousemove(event);

    if (!event.data._swipeStartTime) return;

    event.data.type = 'swipe';
    if (event.data.global.x - event.data._swipeX >= event.data.swipeDist) event.data.dir = 'right';
    else if (event.data.global.x - this._swipeX <= -this.swipeDist) event.data.dir = 'left';
    else if (event.data.global.y - this._swipeY >= this.swipeDist) event.data.dir = 'down';
    else if (event.data.global.y - this._swipeY <= -this.swipeDist) event.data.dir = 'up';

    this._swipe(event);
  };

  Scene.prototype._mouseup = function _mouseup(event) {
    this.mouseup(event);
  };

  Scene.prototype._mouseout = function _mouseout(event) {
    this.mouseout(event);
  };

  Scene.prototype._touchstart = function _touchstart(event) {
    event.data._swipeStartTime = Date.now();
    event.data._swipeX = event.data.global.x;
    event.data._swipeY = event.data.global.y;
    this.touchstart(event);
  };

  Scene.prototype._touchmove = function _touchmove(event) {
    this.touchmove(event);

    if (!event.data._swipeStartTime) return;

    event.data.type = 'swipe';
    event.data.dir = 'none';
    if (event.data.global.x - event.data._swipeX >= this.swipeDist) event.data.dir = 'right';
    else if (event.data.global.x - event.data._swipeX <= -this.swipeDist) event.data.dir = 'left';
    else if (event.data.global.y - event.data._swipeY >= this.swipeDist) event.data.dir = 'down';
    else if (event.data.global.y - event.data._swipeY <= -this.swipeDist) event.data.dir = 'up';

    (event.data.dir !== 'none') && this._swipe(event);
  };

  Scene.prototype._touchend = function _touchend(event) {
    this.touchend(event);
  };

  Scene.prototype._swipe = function _swipe(event) {
    var time = Date.now() - event.data._swipeStartTime;
    event.data._swipeStartTime = null;
    if (time <= this.swipeTime || this.swipeTime === 0) this.swipe(event);
  };

  Scene.prototype.run = function run() {
    this.update();
    for (var i = 0; i < this._updateOrder.length; i++) {
      this['_update' + this._updateOrder[i]]();
    }
  };

  /**
    @method _updateEmitters
    @private
  **/
  Scene.prototype._updateEmitters = function _updateEmitters() {
    for (var i = this.emitters.length - 1; i >= 0; i--) {
      this.emitters[i]._update();
      if (this.emitters[i]._remove) this.emitters.splice(i, 1);
    }
  };

  /**
    @method _updateObjects
    @private
  **/
  Scene.prototype._updateObjects = function _updateObjects() {
    for (var i = this.objects.length - 1; i >= 0; i--) {
      if (typeof this.objects[i].update === 'function' && !this.objects[i]._remove) this.objects[i].update();
      if (this.objects[i]._remove) this.objects.splice(i, 1);
    }
  };

  /**
    @method _updatePhysics
    @private
  **/
  Scene.prototype._updatePhysics = function _updatePhysics() {
    if (this.world) this.world._update();
  };

  /**
    @method _updateRenderer
    @private
  **/
  Scene.prototype._updateRenderer = function _updateRenderer() {
    if (game.debugDraw) game.debugDraw.update();
    game.renderer.render(game.system.stage);
  };

  /**
    @method _updateTimers
    @private
  **/
  Scene.prototype._updateTimers = function _updateTimers() {
    var timer;
    for (var i = this.timers.length - 1; i >= 0; i--) {
      timer = this.timers[i];
      if (timer.time() >= 0) {
        if (typeof timer.callback === 'function') {
          timer.callback();
        }

        if (timer.repeat) {
          timer.reset();
        } else {
          game.pool.put('Timer', timer);
          this.timers.splice(i, 1);
        }
      }
    }
  };

  /**
    @method _updateTweens
    @private
  **/
  Scene.prototype._updateTweens = function _updateTweens() {
    for (var i = this.tweens.length - 1; i >= 0; i--) {
      if (!this.tweens[i]._update()) this.tweens.splice(i, 1);
    }
  };

  function windowToCanvas(x, y, pos) {
    var canvas = game.system.canvas;
    var bbox = canvas.getBoundingClientRect();

    return pos.set(
      (x - bbox.left) * (canvas.width / bbox.width) / game.scale,
      (y - bbox.top) * (canvas.height / bbox.height) / game.scale
    );
  }

  game.addAttributes(Scene, {
    /**
      Update order for scene.
      @attribute {Array} updateOrder
      @default tweens,physics,timers,emitters,objects,renderer
    **/
    updateOrder: [
      'tweens',
      'physics',
      'timers',
      'emitters',
      'objects',
      'renderer',
    ],
    /**
      Default background color.
      @attribute {Number} backgroundColor
      @default 0x000000
    **/
    backgroundColor: 0x000000,
  });

  game.Scene = Scene;

});
