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
    @extends game.Class
**/
game.createClass('Scene', {
    /**
        Background color of scene.
        @property {Number} backgroundColor
    **/
    backgroundColor: null,
    /**
        List of emitters in scene.
        @property {Array} emitters
    **/
    emitters: [],
    /**
        List of objects in scene.
        @property {Array} objects
    **/
    objects: [],
    /**
        Main container for scene.
        @property {Container} stage
    **/
    stage: null,
    /**
        Minimum distance to trigger swipe.
        @property {Number} swipeDist
        @default 100
    **/
    swipeDist: 100,
    /**
        Maximum time to trigger swipe (ms).
        @property {Number} swipeTime
        @default 500
    **/
    swipeTime: 500,
    /**
        List of timers in scene.
        @property {Array} timers
    **/
    timers: [],
    /**
        List of tweens in scene.
        @property {Array} tweens
    **/
    tweens: [],
    /**
        @property {Array} _updateOrder
        @private
    **/
    _updateOrder: null,

    staticInit: function() {
        this.emitters = [];
        this.objects = [];
        this.timers = [];
        this.tweens = [];

        this.backgroundColor = this.backgroundColor || game.Scene.backgroundColor;
        if (!this.backgroundColor && game.device.cocoonCanvasPlus) {
            this.backgroundColor = 0x000000;
        }

        if (game.audio && game.Audio.stopOnSceneChange && game.scene) {
            game.audio.stopMusic();
            game.audio.stopSound(false, true);
            game.audio.pausedSounds.length = 0;
            game.audio.playingSounds.length = 0;
        }

        game.scene = this;

        this._updateOrder = [];
        for (var i = 0; i < game.Scene.updateOrder.length; i++) {
            this._updateOrder.push(game.Scene.updateOrder[i].ucfirst());
        }

        for (var i = game.system.stage.children.length - 1; i >= 0; i--) {
            game.system.stage.removeChild(game.system.stage.children[i]);
        }
        game.system.stage.setBackgroundColor(this.backgroundColor);

        game.system.stage.interactive = true;
        game.system.stage.mousemove = game.system.stage.touchmove = this._mousemove.bind(this);
        game.system.stage.click = game.system.stage.tap = this._click.bind(this);
        game.system.stage.mousedown = game.system.stage.touchstart = this._mousedown.bind(this);
        game.system.stage.mouseup = game.system.stage.mouseupoutside = game.system.stage.touchend = game.system.stage.touchendoutside = this._mouseup.bind(this);
        game.system.stage.mouseout = this._mouseout.bind(this);

        this.stage = new game.Container();
        if (game.system.webGL && game.device.cocoonJS) {
            var rendererRatio = game.renderer.width / game.renderer.height;
            var systemRatio = game.system.width / game.system.height;
            if (rendererRatio < systemRatio) {
                var scale = game.renderer.width / game.system.width;
                this.stage.scale.set(scale, scale);
                this.stage.position.y = game.renderer.height / 2 - game.system.height * scale / 2;
            }
            else {
                var scale = game.renderer.height / game.system.height;
                this.stage.scale.set(scale, scale);
                this.stage.position.x = game.renderer.width / 2 - game.system.width * scale / 2;
            }
        }
        game.system.stage.addChild(this.stage);

        if (game.debugDraw) game.debugDraw.reset();
    },

    /**
        Add particle emitter to scene.
        @method addEmitter
        @param {Emitter} emitter
    **/
    addEmitter: function(emitter) {
        if (this.emitters.indexOf(emitter) === -1) {
            this.emitters.push(emitter);
        }
    },

    /**
        Add object to scene, so it's `update()` function get's called every frame.
        @method addObject
        @param {Object} object
    **/
    addObject: function(object) {
        if (this.objects.indexOf(object) === -1) {
            object._remove = false;
            this.objects.push(object);
        }
    },

    /**
        Add timer to game scene.
        @method addTimer
        @param {Number} time Time in milliseconds
        @param {Function} callback Callback function to run, when timer ends.
        @param {Boolean} repeat
        @return {Timer}
    **/
    addTimer: function(time, callback, repeat) {
        var timer = new game.Timer(time);
        timer.repeat = !!repeat;
        timer.callback = callback;
        this.timers.push(timer);
        return timer;
    },

    /**
        Shorthand for adding tween.
        @method addTween
        @param {Object} obj
        @param {Object} props
        @param {Number} time
        @param {Object} settings
    **/
    addTween: function(obj, props, time, settings) {
        var tween = new game.Tween(obj);
        tween.to(props, time);
        for (var i in settings) {
            tween[i](settings[i]);
        }
        return tween;
    },

    /**
        Called, when scene is changed.
        @method exit
    **/
    exit: function() {},

    /**
        Callback for keydown.
        @method keydown
        @param {String} key
    **/
    keydown: function() {},

    /**
        Callback for keyup.
        @method keyup
        @param {String} key
    **/
    keyup: function() {},

    /**
        Callback for mouse click and touch tap on the scene stage.
        @method click
        @param {Number} x
        @param {Number} y
        @param {MouseEvent|TouchEvent} event
    **/
    click: function() {},

    /**
        Callback for mousedown and touchstart on the scene stage.
        @method mousedown
        @param {Number} x
        @param {Number} y
        @param {MouseEvent|TouchEvent} event
    **/
    mousedown: function() {},

    /**
        Callback for mouseup and touchend on the scene stage.
        @method mouseup
        @param {Number} x
        @param {Number} y
        @param {MouseEvent|TouchEvent} event
    **/
    mouseup: function() {},

    /**
        Callback for mousemove and touchmove on the scene stage.
        @method mousemove
        @param {Number} x
        @param {Number} y
        @param {MouseEvent|TouchEvent} event
    **/
    mousemove: function() {},

    /**
        Callback for mouseout on the scene stage.
        @method mouseout
        @param {Number} x
        @param {Number} y
        @param {MouseEvent|TouchEvent} event
    **/
    mouseout: function() {},

    /**
        Remove emitter from scene.
        @method removeEmitter
        @param {game.Emitter} emitter
    **/
    removeEmitter: function(emitter) {
        emitter && emitter.remove();
    },

    /**
        Remove object from scene.
        @method removeObject
        @param {Object} object
    **/
    removeObject: function(object) {
        object._remove = true;
    },

    /**
        Remove timer from scene.
        @method removeTimer
        @param {Timer} timer
        @param {Boolean} doCallback
    **/
    removeTimer: function(timer, doCallback) {
        if (!timer) return;
        if (!doCallback) timer.callback = null;
        timer.repeat = false;
        timer.set(0);
    },

    /**
        Remove all timers from scene.
        @method removeTimers
        @param {Boolean} [doCallback]
    **/
    removeTimers: function(doCallback) {
        for (var i = this.timers.length - 1; i >= 0; i--) {
            this.removeTimer(this.timers[i], doCallback);
        }
    },

    /**
        Remove all tweens from scene.
        @method removeTweens
    **/
    removeTweens: function() {
        for (var i = 0; i < this.tweens.length; i++) {
            this.tweens[i]._shouldRemove = true;
        }
    },

    /**
        Callback for swipe.
        @method swipe
        @param {String} direction
    **/
    swipe: function() {},

    /**
        Clear stage.
        @method clear
    **/
    clear: function() {
        for (var i = this.stage.children.length - 1; i >= 0; i--) {
            this.stage.removeChild(this.stage.children[i]);
        }
    },

    pause: function() {
        if (game.audio) game.audio._systemPause();
    },

    resume: function() {
        if (game.audio) game.audio._systemResume();
    },

    /**
        This is called every frame.
        @method update
    **/
    update: function() {},

    _mousedown: function(event) {
        event.startTime = Date.now();
        event.swipeX = event.global.x;
        event.swipeY = event.global.y;
        this.mousedown(event.global.x, event.global.y, event.originalEvent);
    },

    _mouseup: function(event) {
        this.mouseup(event.global.x, event.global.y, event.originalEvent);
    },

    _click: function(event) {
        this.click(event.global.x, event.global.y, event.originalEvent);
    },

    _mousemove: function(event) {
        this.mousemove(event.global.x, event.global.y, event.originalEvent);

        if (!event.startTime) return;

        if (event.global.x - event.swipeX >= this.swipeDist) this._swipe(event, 'right');
        else if (event.global.x - event.swipeX <= -this.swipeDist) this._swipe(event, 'left');
        else if (event.global.y - event.swipeY >= this.swipeDist) this._swipe(event, 'down');
        else if (event.global.y - event.swipeY <= -this.swipeDist) this._swipe(event, 'up');
    },

    _mouseout: function(event) {
        this.mouseout(event.global.x, event.global.y, event.originalEvent);
    },

    _swipe: function(event, dir) {
        var time = Date.now() - event.startTime;
        event.startTime = null;
        if (time <= this.swipeTime || this.swipeTime === 0) this.swipe(dir);
    },

    run: function() {
        this.update();
        for (var i = 0; i < this._updateOrder.length; i++) {
            this['_update' + this._updateOrder[i]]();
        }
    },

    /**
        @method _updateEmitters
        @private
    **/
    _updateEmitters: function() {
        for (var i = this.emitters.length - 1; i >= 0; i--) {
            this.emitters[i]._update();
            if (this.emitters[i]._remove) this.emitters.splice(i, 1);
        }
    },

    /**
        @method _updateObjects
        @private
    **/
    _updateObjects: function() {
        for (var i = this.objects.length - 1; i >= 0; i--) {
            if (typeof this.objects[i].update === 'function' && !this.objects[i]._remove) this.objects[i].update();
            if (this.objects[i]._remove) this.objects.splice(i, 1);
        }
    },

    /**
        @method _updatePhysics
        @private
    **/
    _updatePhysics: function() {
        if (this.world) this.world._update();
    },

    /**
        @method _updateRenderer
        @private
    **/
    _updateRenderer: function() {
        if (game.debugDraw) game.debugDraw.update();
        game.renderer.render(game.system.stage);
    },

    /**
        @method _updateTimers
        @private
    **/
    _updateTimers: function() {
        for (var i = this.timers.length - 1; i >= 0; i--) {
            if (this.timers[i].time() >= 0) {
                if (typeof this.timers[i].callback === 'function') this.timers[i].callback();
                if (this.timers[i].repeat) this.timers[i].reset();
                else this.timers.splice(i, 1);
            }
        }
    },

    /**
        @method _updateTweens
        @private
    **/
    _updateTweens: function() {
        for (var i = this.tweens.length - 1; i >= 0; i--) {
            if (!this.tweens[i]._update()) this.tweens.splice(i, 1);
        }
    }
});

game.addAttributes('Scene', {
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
        'renderer'
    ],
    /**
        Default background color.
        @attribute {Number} backgroundColor
        @default null
    **/
    backgroundColor: null
});

});
