# LesserPanda

A module based HTML5 game engine designed to be flexible and powerful.

## Features

LesserPanda has a lot of features, and the list is still growing:

- Super fast Canvas and WebGL rendering powered by PIXI.js.
- Automatically choose the best resolution based on configs.
- Fixed game loop with customizable `FPS` and `frame skips`.
- ECS(Entity Component System) like sub-systems.
- Tag is supported by sub-systems.
- Mobile friendly.
- ES6 based scripting environment.
- CSS style can be imported by using standard ES6 module system.
- Live-reload browsers after any changes are saved.

## Getting Start

Make sure you have [Node.js](https://nodejs.org) installed.

### Install `lesser-panda-cli` package globally

`npm i -g lesser-panda-cli`

### Download lesser-panda engine

You can clone from the official repo:

`git clone https://github.com/pixelpicosean/lesser-panda.git my-game`
`cd my-game && rm -rf .git`

or simply download from [here](https://github.com/pixelpicosean/lesser-panda/archive/master.zip)

### Start the dev server and run the game from your browsers

1. `lpanda server`
2. Open [http://localhost:4000](http://localhost:4000) and you should see "It Works!" in your browser
3. Make some changes and save, the browser will automatically reload

The engine itself contains both engine sources and a folder called `game` for your JavaScript and CSS files. **It is recommend not to modify engine folder so you can upgrade to latest version by replacing it**

## Brief introduction of modules

- `audio` provides sound playback functions, the basic usage is included in the `game/main`.
- `canvasquery` provide a canvas 2d based renderer. Note that it is not capable with PIXI, so pick ONLY one of them at a time. Read more about it [here](http://canvasquery.com/).
- `pixi` contains whole PIXI.js sources. Filters and mesh is disabled by default, you can enable them by uncomment related lines in `engine/pixi/index.js`.
- `polyfill` contains some ES6 polyfills (`Object.assign`, `rAF` and `Math.sign`).
- `resource-loader` brings resource loading functionality which is used by PIXI.js and you probably don't need to use it directly.
- `storage` provides session and persistent data storage. `session` and `persistent` from this module is quite useful but you can also use low level `storage`.
- `analytics` provides some helper functions to work with Google Analytics.
- `camera` 2D camera that can follow targets, zoom, rotate and shake.
- `core` is the core of lesser-panda, which provides the base functionalities such as "loop" and "resize".
- `device` tells what device the game is currently running.
- `eventemitter3` is a fast EventEmitter implementation.
- `keyboard` emits keyboard events, you need to subscribe to get noticed.
- `loader` provides assets loading functon `addAsset(path, key, settings)`
- `physics` provides AABB based collision detection and response.
- `reactive` is a wrapper of Kefir.js, which is used for Reactive Programming.
- `renderer` is just the base object of renderer, if you import PIXI or canvasquery related renderer instance will be added to this object.
- `resize` provides some resize helper functions.
- `rnd` is a random number generator.
- `scene` exports the Scene class. Scenes should all be sub-classes of it.
- `timeline` is the Tween animation support, basic usage is included in the main.js
- `timer` provides timers with callbacks. Use `Timer.later` or `Timer.interval` to create instances.
- `utils` provides some math functions and helpers.
- `vector` provide a `Vector` class that is used everywhere `PIXI.Point` is also an alias of it.

## ChangeLog

### 0.3.5-dev

- Emit `pause` and `resume` events from `core`
- Add resolution config
- Rename `PIXI.extras.Animation` to `PIXI.extras.AnimatedSprite` and the origional is just an alias which will be deprecated in the future versions.

### 0.3.4

- Upgrade PIXI to `master/3.0.10`
- [Changes] Accept an object as third parameter of `loader.addAsset` function

### 0.3.3

- Add animation support to boolean and object (instantly changes value at the end of duration, ignore its easing setting).
- Add animation support to string text (from empty to full content).

### 0.3.2

- Add `tag` support to `Object`, `Timeline` and `Timer` sub-systems, now it is possible to pause/resume any *tagged* components. For example you can easily pause the timelines tagged *object* and keep the *ui* when game is paused.
- Emit `boot` and `booted` events when engine is started.
- Upgrade `Kefir` and add a `emitter` function to create self emittable streams for convenience.
- Create `session` and `persistent` data manager for easier data saving without touching low-level `storage` and `localStorage`.
- Add "skipFrame" setting to constantly skip render frames, which may be used to increase performance but may also sacrifice the accuracy of input.

### 0.3.1

- Upgrade PIXI to (dev/9d7a393)
- Upgrade resource-loader
- Rename base container of Scene to `stage` instead of `container`
- Fixed update support. FPS now can be lock to a constant value
- Improved `PIXI.extras.Animation` updating logic
- Improved Array element removing process
- Create utils module with useful functions and constants
- Better pre-defined sub-system updating order, now collision works pretty well with Timelined bodies
- New component system. The "Object", "Physics", "Timeline" and "Renderer" are just predefined sub-systems.
- Timer is also updated at fixed steps now, but act as a *engine-level* system instead of *Scene*
- Fix camera update error when it's not added to any containers

### 0.3.0-rc1

- Completely module based structure

### 0.2.1

- Add camera shake support.
- Let Scene emit input events just like what PIXI does.

### 0.2.0

- Add support for module imports/exports, so you do not need to expose everything to global namespaces (like `game`).
- Remove `Class` system due to performance and capabilities.

### 0.1.0

- Update renderer to PIXI.js latest stable version (v3.0.7).

## License

LesserPanda is released under the [MIT License](http://opensource.org/licenses/MIT), the same
as [Panda.js engine](http://www.pandajs.net).

### Special Thanks

[@ekelokorpi](https://github.com/ekelokorpi) for creating the awesome panda.js-engine
