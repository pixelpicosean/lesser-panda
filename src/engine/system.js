/**
  @module system
  @namespace game
**/
game.module(
  'engine.system'
)
.body(function() { 'use strict';

  /**
    @class System
    @extends game.Class
  **/
  game.createClass('System', {
    /**
      Name of current scene.
      @property {String} currentSceneName
    **/
    currentSceneName: null,
    /**
      Width of the game screen.
      @property {Number} width
    **/
    width: null,
    /**
      Height of the game screen.
      @property {Number} height
    **/
    height: null,
    /**
      Current delta-time.
      @property {Number} delta
    **/
    delta: 0,
    /**
      Main game timer.
      @property {Timer} timer
    **/
    timer: null,
    /**
      Canvas element.
      @property {HTMLCanvasElement} canvas
    **/
    canvas: null,
    /**
      Is engine paused.
      @property {Boolean} paused
    **/
    paused: false,
    /**
      Is engine in HiRes mode.
      @property {Boolean} hires
    **/
    hires: false,
    /**
      Is engine in Retina mode.
      @property {Boolean} retina
    **/
    retina: false,
    /**
      Is mobile rotate screen visible.
      @property {Boolean} rotateScreenVisible
    **/
    rotateScreenVisible: false,
    /**
      Current id of the game loop.
      @property {Number} gameLoopId
    **/
    gameLoopId: 0,
    /**
      Is WebGL enabled.
      @property {Boolean} webGL
    **/
    webGL: false,
    /**
      Original width.
      @property {Number} originalWidth
    **/
    originalWidth: null,
    /**
      Original height.
      @property {Number} originalHeight
    **/
    originalHeight: null,
    newSceneClass: null,
    running: false,

    init: function() {
      var width = game.System.width;
      var height = game.System.height;
      if (width === 'window') width = window.innerWidth;
      if (height === 'window') height = window.innerHeight;
      this.originalWidth = width;
      this.originalHeight = height;

      for (var i = 2; i <= game.System.hires; i *= 2) {
        if (window.innerWidth >= width * i && window.innerHeight >= height * i) {
          this.hires = true;
          game.scale = i;
        }
      }
      if (game.System.retina && game.device.pixelRatio === 2) {
        // Check if we are already using highest textures
        if (game.scale < game.System.hires) {
          this.retina = true;
          game.scale *= 2;
        }
      }

      this.width = width;
      this.height = height;
      this.canvasId = game.System.canvasId;
      this.timer = new game.Timer();

      this.initRenderer(width, height);

      game._normalizeVendorAttribute(this.canvas, 'requestFullscreen');
      game._normalizeVendorAttribute(this.canvas, 'requestFullScreen');
      game._normalizeVendorAttribute(navigator, 'vibrate');

      document.body.style.margin = 0;

      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      game.renderer = this.renderer;

      if (!game.device.cocoonJS) {
        var visibilityChange;
        if (typeof document.hidden !== 'undefined') {
          visibilityChange = 'visibilitychange';
        }
        else if (typeof document.mozHidden !== 'undefined') {
          visibilityChange = 'mozvisibilitychange';
        }
        else if (typeof document.msHidden !== 'undefined') {
          visibilityChange = 'msvisibilitychange';
        }
        else if (typeof document.webkitHidden !== 'undefined') {
          visibilityChange = 'webkitvisibilitychange';
        }

        document.addEventListener(visibilityChange, function() {
          if (game.System.pauseOnHide) {
            var hidden = !!game._getVendorAttribute(document, 'hidden');
            if (hidden) game.system.pause(true);
            else game.system.resume(true);
          }
        }, false);

        if (game.System.bgColor && !game.System.bgColorMobile) game.System.bgColorMobile = game.System.bgColor;
        if (game.System.bgColorMobile && !game.System.bgColorRotate) game.System.bgColorRotate = game.System.bgColorMobile;

        if (game.System.bgImage && !game.System.bgImageMobile) game.System.bgImageMobile = game.System.bgImage;
        if (game.System.bgImageMobile && !game.System.bgImageRotate) game.System.bgImageRotate = game.System.bgImageMobile;

        if (!game.device.mobile) {
          if (game.System.bgColor) document.body.style.backgroundColor = game.System.bgColor;
          if (game.System.bgImage) document.body.style.backgroundImage = 'url(' + game.getMediaPath(game.System.bgImage) + ')';
        }
        if (game.System.bgPosition) document.body.style.backgroundPosition = game.System.bgPosition;

        this.initResize();
      }
      else {
        this.resizeToFill();
        this.canvas.style.cssText = 'idtkscale:' + game.System.idtkScale + ';';
      }
    },

    initRenderer: function(width, height) {
      if (!document.getElementById(this.canvasId)) {
        var canvas = document.createElement('canvas');
        if (game.device.cocoonJS) canvas.screencanvas = !!game.System.screenCanvas;
        canvas.id = this.canvasId;
        document.body.appendChild(canvas);
      }

      game.PIXI.SCALE_MODES.DEFAULT = game.PIXI.SCALE_MODES[game.System.scaleMode.toUpperCase()] || 0;

      if (game.System.webGL && game.device.cocoonJS) {
        width = window.innerWidth * game.device.pixelRatio;
        height = window.innerHeight * game.device.pixelRatio;
      }

      game.PIXI.RESOLUTION = game.scale;
      if (game.System.webGL) this.renderer = game.autoDetectRenderer(width, height, {
        view: document.getElementById(this.canvasId),
        transparent: game.System.transparent,
        antialias: game.System.antialias,
        resolution: game.scale
      });
      else this.renderer = new game.CanvasRenderer(width, height, {
        view: document.getElementById(this.canvasId),
        transparent: game.System.transparent,
        antialias: game.System.antialias,
        resolution: game.scale
      });

      this.webGL = !!this.renderer.gl;
      this.canvas = this.renderer.view;
      this.stage = new game.Container();
    },

    resizeToFill: function() {
      if (!game.System.resize) return;
      if (game.device.mobile && this.rotateScreenVisible) return;

      // Mobile devices ONLY resize once
      if (game.device.mobile) {
        if (this._resizeToFill) return;
        this._resizeToFill = true;
      }

      var gameRatio = game.System.width / game.System.height;
      var screenRatio = window.innerWidth / window.innerHeight;

      if (gameRatio < screenRatio) {
        // Letterbox left/right
        this.height = game.System.height;
        this.width = Math.round(this.height * (window.innerWidth / window.innerHeight));
      }
      else {
        // Letterbox top/bottom
        this.width = game.System.width;
        this.height = Math.round(this.width * (window.innerHeight / window.innerWidth));
      }
      this.resize(this.width, this.height);
    },

    /**
      Request fullscreen mode.
      @method fullscreen
    **/
    fullscreen: function() {
      if (this.canvas.requestFullscreen) this.canvas.requestFullscreen();
      else if (this.canvas.requestFullScreen) this.canvas.requestFullScreen();
    },

    /**
      Test fullscreen support.
      @method fullscreenSupport
      @return {Boolean} Return true, if browser supports fullscreen mode.
    **/
    fullscreenSupport: function() {
      return !!(this.canvas.requestFullscreen || this.canvas.requestFullScreen);
    },

    /**
      Vibrate device.
      @method vibrate
      @param {Number} time Time to vibrate.
    **/
    vibrate: function(time) {
      if (navigator.vibrate) return navigator.vibrate(time);
      return false;
    },

    /**
      Pause game engine.
      @method pause
    **/
    pause: function(onHide) {
      if (this.paused) return;
      if (onHide) this.pausedOnHide = true;
      else this.paused = true;

      if (game.scene) game.scene.pause();
    },

    /**
      Resume paused game engine.
      @method resume
    **/
    resume: function(onHide) {
      if (onHide && this.paused) return;
      if (!onHide && !this.paused) return;
      if (onHide) this.pausedOnHide = false;
      else this.paused = false;

      game.Timer.last = Date.now();
      if (game.scene) game.scene.resume();
    },

    /**
      Change current scene.
      @method setScene
      @param {String} sceneClass
      @param {Boolean} removeAssets
    **/
    setScene: function(sceneClass, removeAssets) {
      this.currentSceneName = sceneClass;
      sceneClass = game[sceneClass];
      if (this.running && !this.paused) {
        this.newSceneClass = sceneClass;
        this.removeAssets = removeAssets;
      }
      else this.setSceneNow(sceneClass, removeAssets);
    },

    setSceneNow: function(sceneClass, removeAssets) {
      if (this.paused) this.paused = false;
      if (game.scene) game.scene._exit();
      if (removeAssets) game.removeAssets();
      game.scene = new (sceneClass)();
      if (game.Debug && game.Debug.enabled && !game.device.cocoonJS && !this.debug) this.debug = new game.Debug();
      this.newSceneClass = null;
      this.startRunLoop();
    },

    startRunLoop: function() {
      if (this.gameLoopId) this.stopRunLoop();
      this.gameLoopId = game._setGameLoop(this.run.bind(this), this.canvas);
      this.running = true;
    },

    stopRunLoop: function() {
      game._clearGameLoop(this.gameLoopId);
      this.running = false;
    },

    run: function() {
      if (this.paused || this.pausedOnHide) return;

      game.Timer.update();
      this.delta = this.timer.delta() / 1000;

      if (this.debug) this.debug.reset();

      game.scene.run();

      if (this.debug) this.debug.update();
      if (this.newSceneClass) this.setSceneNow(this.newSceneClass, this.removeAssets);
    },

    resize: function(width, height) {
      this.renderer.resize(width, height);
      game.scene && game.scene.resize && game.scene.resize(width, height);
    },

    initResize: function() {
      this.ratio = this.width > this.height ? this.width / this.height : this.height / this.width;

      // Disable center and scale when resizing to fill the window
      if (game.System.resize) {
        game.System.center = false;
        game.System.scale = false;
      }

      // Place canvas to the center of window
      if (game.System.center) {
        this.canvas.style.position = 'absolute';
        this.canvas.style.margin = 'auto';

        this.canvas.style.top = 0;
        this.canvas.style.left = 0;
        this.canvas.style.bottom = 0;
        this.canvas.style.right = 0;
      }

      if (game.device.mobile) {
        if (game.System.rotateScreen) {
          var div = document.createElement('div');
          div.innerHTML = game.System.rotateImg ? '' : game.System.rotateMsg;
          div.style.position = 'absolute';
          div.style.height = '12px';
          div.style.textAlign = 'center';
          div.style.left = 0;
          div.style.right = 0;
          div.style.top = 0;
          div.style.bottom = 0;
          div.style.margin = 'auto';
          div.style.display = 'none';
          div.id = 'panda-rotate';
          game.System.rotateDiv = div;
          document.body.appendChild(game.System.rotateDiv);

          if (game.System.rotateImg) {
            var img = new Image();
            var me = this;
            img.onload = function() {
              div.image = img;
              div.style.height = img.height + 'px';
              div.appendChild(img);
              me.resizeRotateImage();
            };
            if (game.System.rotateImg.indexOf('data:') === 0) {
              img.src = game.System.rotateImg;
            }
            else {
              img.src = game._getFilePath(game.System.rotateImg);
            }
            img.style.position = 'relative';
            img.style.maxWidth = '100%';
          }
        }
      }

      if (typeof window.onorientationchange !== 'undefined' && !game.device.android) {
        window.onorientationchange = this.onResize.bind(this);
      }
      else {
        window.onresize = this.onResize.bind(this);
      }

      this.onResize();
    },

    checkOrientation: function() {
      this.orientation = window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
      if (game.device.android2 && window.innerWidth === 320 && window.innerHeight === 251) {
        // Android 2.3 portrait fix
        this.orientation = 'portrait';
      }

      if (this.width > this.height && this.orientation !== 'landscape') this.rotateScreenVisible = true;
      else if (this.width < this.height && this.orientation !== 'portrait') this.rotateScreenVisible = true;
      else this.rotateScreenVisible = false;

      if (!game.System.rotateScreen) this.rotateScreenVisible = false;

      this.canvas.style.display = this.rotateScreenVisible ? 'none' : 'block';
      if (game.System.rotateDiv) game.System.rotateDiv.style.display = this.rotateScreenVisible ? 'block' : 'none';

      if (this.rotateScreenVisible && game.System.bgColorRotate) document.body.style.backgroundColor = game.System.bgColorRotate;
      if (!this.rotateScreenVisible && game.System.bgColorMobile) document.body.style.backgroundColor = game.System.bgColorMobile;

      if (this.rotateScreenVisible && game.System.bgImageRotate) document.body.style.backgroundImage = 'url(' + game.getMediaPath(game.System.bgImageRotate) + ')';
      if (!this.rotateScreenVisible && game.System.bgImageMobile) document.body.style.backgroundImage = 'url(' + game.getMediaPath(game.System.bgImageMobile) + ')';

      if (this.rotateScreenVisible && game.system && typeof game.system.pause === 'function') game.system.pause();
      if (!this.rotateScreenVisible && game.system && typeof game.system.resume === 'function') game.system.resume();

      if (this.rotateScreenVisible) this.resizeRotateImage();
    },

    resizeRotateImage: function() {
      if (this.rotateScreenVisible && game.System.rotateDiv.image) {
        if (window.innerHeight < game.System.rotateDiv.image.height) {
          game.System.rotateDiv.image.style.height = window.innerHeight + 'px';
          game.System.rotateDiv.image.style.width = 'auto';
          game.System.rotateDiv.style.height = window.innerHeight + 'px';
          game.System.rotateDiv.style.bottom = 'auto';
        }
      }
    },

    onResize: function() {
      // Mobile orientation
      if (game.device.mobile) {
        this.checkOrientation();
      }

      // Do nothing if neither scale or resize
      if (!game.System.scale && !game.System.resize) {
        return;
      }

      if (game.device.mobile) {
        this.ratio = this.orientation === 'landscape' ? this.width / this.height : this.height / this.width;

        this.resizeToFill();

        // Mobile resize
        var width = window.innerWidth;
        var height = window.innerHeight;

        // iOS innerHeight bug fixes
        if (game.device.iOS7 && window.innerHeight === 256) height = 320;
        if (game.device.iOS7 && window.innerHeight === 319) height = 320;
        if (game.device.iOS7 && game.device.pixelRatio === 2 && this.orientation === 'landscape') height += 2;
        if (game.device.iPad && height === 671) height = 672;

        // Landscape game
        if (this.width > this.height) {
          if (this.orientation === 'landscape' && height * this.ratio <= width) {
            this.canvas.style.height = height + 'px';
            this.canvas.style.width = height * this.width / this.height + 'px';
          }
          else {
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = width * this.height / this.width + 'px';
          }
        }
        // Portrait game
        else {
          if (this.orientation === 'portrait' && width * this.ratio <= height) {
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = width * this.height / this.width + 'px';
          }
          else {
            this.canvas.style.height = height + 'px';
            this.canvas.style.width = height * this.width / this.height + 'px';
          }
        }

        if (!game.device.ejecta) window.scroll(0, 1);

        if (!this.rotateScreenVisible && game._loader && !game._loader.started) game._loader.start();
      }
      else {
        // Desktop resize
        if (window.innerWidth === 0) return; // Chrome bug
        if (game.System.scale) {
          if (window.innerWidth < this.width || window.innerHeight < this.height || game.System.scale) {
            if (window.innerWidth / this.width < window.innerHeight / this.height) {
              this.canvas.style.width = window.innerWidth + 'px';
              this.canvas.style.height = Math.floor(window.innerWidth * (this.height / this.width)) + 'px';
            }
            else {
              this.canvas.style.height = window.innerHeight + 'px';
              this.canvas.style.width = Math.floor(window.innerHeight * (this.width / this.height)) + 'px';
            }
          }
          else {
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
          }
        }
        else if (game.System.resize) {
          this.resizeToFill();

          this.canvas.style.width = '100%';
          this.canvas.style.height = '100%';
        }
      }
    }
  });

  game.addAttributes('System', {
    /**
      Enable/disable canvas centering.
      @attribute {Boolean} center
      @default true
    **/
    center: true,
    /**
      Scale canvas to fit window size
      @attribute {Boolean} resize
      @default true
    **/
    scale: true,
    /**
      Resize canvas to fill screen.
      @attribute {Boolean} resize
      @default false
    **/
    resize: false,
    /**
      Scaling method for CocoonJS.
      @attribute {ScaleToFill|ScaleAspectFit|ScaleAspectFill} idtkScale
      @default ScaleAspectFit
    **/
    idtkScale: 'ScaleAspectFit',
    /**
      Use ScreenCanvas on CocoonJS.
      http://support.ludei.com/hc/en-us/articles/201810268-ScreenCanvas
      @attribute {Boolean} screenCanvas
      @default true
    **/
    screenCanvas: true,
    /**
      HiRes mode.
      @attribute {Number} hires
      @default 0
    **/
    hires: 0,
    /**
      Use Retina mode.
      @attribute {Boolean} retina
      @default false
    **/
    retina: false,
    /**
      Pause game engine, when page is hidden.
      @attribute {Boolean} pauseOnHide
      @default true
    **/
    pauseOnHide: true,
    /**
      Use rotate screen on mobile.
      @attribute {Boolean} rotateScreen
      @default true
    **/
    rotateScreen: true,
    /**
      System width.
      @attribute {Number} width
      @default 1024
    **/
    width: 1024,
    /**
      System height.
      @attribute {Number} height
      @default 768
    **/
    height: 768,
    /**
      Body background color.
      @attribute {String} bgColor
      @default null
    **/
    bgColor: null,
    /**
      Body background color for mobile.
      @attribute {String} bgColorMobile
      @default null
    **/
    bgColorMobile: null,
    /**
      Body background color for mobile rotate screen.
      @attribute {String} bgColorRotate
      @default null
    **/
    bgColorRotate: null,
    /**
      Body background image.
      @attribute {String} bgImage
      @default null
    **/
    bgImage: null,
    /**
      Body background image for mobile.
      @attribute {String} bgImageMobile
      @default null
    **/
    bgImageMobile: null,
    /**
      Body background image for mobile rotate screen.
      @attribute {String} bgImageRotate
      @default null
    **/
    bgImageRotate: null,
    /**
      Body background image position.
      @attribute {String} bgPosition
      @default null
    **/
    bgPosition: null,
    /**
      Rotate message for mobile.
      @attribute {String} rotateMsg
      @default Please rotate your device
    **/
    rotateMsg: 'Please rotate your device',
    /**
      Rotate image for mobile.
      @attribute {URL} rotateImg
      @default null
    **/
    rotateImg: null,
    /**
      Enable WebGL renderer.
      @attribute {Boolean} webGL
      @default false
    **/
    webGL: false,
    /**
      Use transparent renderer.
      @attribute {Boolean} transparent
      @default false
    **/
    transparent: false,
    /**
      Use antialias (only on WebGL).
      @attribute {Boolean} antialias
      @default false
    **/
    antialias: false,
    /**
      Default start scene.
      @attribute {String} startScene
      @default Main
    **/
    startScene: 'Main',
    /**
      Id for canvas element.
      @attribute {String} canvasId
      @default canvas
    **/
    canvasId: 'canvas',
    /**
      Canvas scale mode.
      @attribute {String} scaleMode
      @default linear
    **/
    scaleMode: 'linear'
  });

});
