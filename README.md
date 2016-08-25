# LesserPanda

A module based HTML5 game engine designed to be flexible and powerful.

## Features

LesserPanda has a lot of features, and the list is still growing:

- Super fast Canvas and WebGL rendering powered by PIXI.js.
- Tilemap rendering.
- Import tile collider shape from Tiled map.
- Fixed game loop with customizable `FPS` and `frame skips`.
- Fast and powerful physics solution.
- Multiple collision detection solution: a fast AABB based engine and a powerful SAT engine that support polygon and detailed overlapping information.
- Multiply broad phase solution: "Simple" for collision less games and "SpatialHash" for collision heavy ones.
- Tilemap collision support by compiling collision map into convex polygons in the air.
- ECS(Entity Component System) like sub-systems.
- `Behaviors` bring objects to life with one-line setup.
- High level `Actor` classes with both virsuals and physics built-in.
- Automatically choose the best resolution based on configs.
- Tag is supported by sub-systems.
- Mobile friendly.
- Rotate prompt for mobile devices with just a few configs.
- ES6 based scripting environment.
- CSS style can be imported by using standard ES6 module system.
- Live-reload browsers after any changes are saved.

## Samples

Samples are moved to its own [repo here](https://github.com/pixelpicosean/lesser-panda-samples).
Currently the samples are located inside `src/game/samples` folder, and each is just a simple `Scene` focusing on one or more particular feature.

## Document

- [Getting Start Guide](https://github.com/pixelpicosean/lesser-panda/wiki/Getting-Start) at [Wiki](https://github.com/pixelpicosean/lesser-panda/wiki/Home) page.
- [API document](https://pixelpicosean.github.io/lesser-panda/)

A **weekly devlog** shows what happened to LesserPanda, read them at [wiki](https://github.com/pixelpicosean/lesser-panda/wiki/Home), it will be updated on each Wednesday.

## Brief introduction of modules

- `animation` provides both common tween animation and Blender like `action`.
- `audio` provides sound playback functions, the basic usage is included in the `game/main`.
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
- `level` makes Scene able to load level from data and import Tiled generated maps.
- `loader` provides assets loading functon `addAsset(path, key, settings)`
- `physics` provides AABB based collision detection and response.
- `reactive` is a wrapper of Kefir.js, which is used for Reactive Programming.
- `renderer` is just the base object of renderer, if you import PIXI or canvasquery related renderer instance will be added to this object.
- `resize` provides some resize helper functions.
- `rnd` is a random number generator.
- `scene` exports the Scene class. Scenes should all be sub-classes of it.
- `timer` provides timers with callbacks. Use `Timer.later` or `Timer.interval` to create instances.
- `tilemap` provides `BackgroundMap` and `CollisionMap` to support **square tile map** rendering and collision.
- `utils` provides some math functions and helpers.
- `vector` provide a `Vector` class that is used everywhere `PIXI.Point` is also an alias of it.

### Behaviors

- `HorizontalMove` move objects left/right
- `VerticalMove` move objects up/down
- `FourWayMove` move objects left/right/up/down
- `AsteroidsMove` move like ships of classic Asteroids game
- `Health` health, receiveDamage and heal
- `FireBullet` let Actors be able to fire bullets
- `AnchorToScreen` anchor object to left/right/top/right

More behaviors are coming soon.

## Progress

There's a [Trello board](https://trello.com/b/6nzCTotX/lesserpanda), from which you will see what's coming next.
Github issue and milestone maybe better for progress tracking~

## ChangeLog

### 0.4.2-dev

- Add `isStatic` field to `physics.Body` to identify bodies don't move and response to the collisions, which also improves the performance of `CollisionMap`.
- Improve the design of behavior system.
- Remove listeners when stop a `Tween` to prevent issues caused by object pooling.

### 0.4.1-1

- Fix container issue while loading a Tiled map.

### 0.4.1

- Optimize Tiled map converter by caching results.
- Improve Tiled map converter, which is now called `tiledToMap` and convert to latest `level` format.
- Add `level` module that can load a level from data.
- Add `Scene.getActorByName` method.
- Tilemap huge rework, now has a way much cleaner API design.
- Fix tilemap retina display.
- Add second parameter to `core.setScene` to be able to create new instance for the next scene.
- Improve scale mode support for mobile devices, especially for iOS.
- Add support of spawning actors using registered type name.
- Add `Actor.register` function to register custom(subclass) `Actor` classes with a key.
- Moved actor sub-system code into `actor` module, so scenes won't be able to spawn actors until you import the `actor` module.
- Improved `Body` setup.
- Deprecated `Body.anchor` since it's not supported by SAT solver.
- Completely support tile collider shapes defined from **Tiled** editor, tilemap based workflow is hugely improved.
- Fixes collision map so that maps with holes are not properly supported.
- Add `Scene.createLayer` method to simplify layer creating.
- Position, layer and settings parameters of `Scene.spawnActor` are not optional.
- Add `vertical` and `horizontal` settings to WrapAroundScreen behavior.
- Device patch is removed since resizing now works without hack.
- Canvas resizing is fixed and improved, and useless `never` resize mode is deprecated.
- Fixed `Camera` to be able to work without any targets.
- Add `poolable` module to `utils`.
- Improve the `FireBullet` behavior, now it has `ammo` support built-in.
- `Behavior` no longer inherits from `EventEmitter`.
- `Actor` spawn/remove behavior changed, now it's possible to maunally create `Actor` instance and add to any scene instead of calling `spawnActor`. Object pool support is included.
- Change `Actor.prepare` to `Actor.ready`.
- Fix some Actor component create methods.
- Add `rotate-around-point` behavior
- Add `steering` behavior
- Add `face-the-mouse` behavior
- Actor component factory methods now accept settings of all built-in properties.
- Add `getTexture` function to `engine.loader` to be able to get texture from string.
- Add more component factory methods to Actor.
- Fix inline documents.
- Add `start` function to `core` module as a easy replacement of `startWithScene`.
- `canvasquery` module is removed.
- Re-design `Actor` system and make it more powerful yet easier to work with.
- Re-design `Behavior` system.

### 0.4.0

- Add a `prepare` method to `Actor` which will be called at the end of `addTo`.
- Finish rectangle shaped tile collision support.
- Add simple `Tilemap` support for both built-in format or Tiled JSON map(some custom properties are required)
- Add `Timer.now` to represent time passed since game started.
- Add `top` and `bottom` properties to `Camera` object.
- Add `width` and `height` properties to `physics.Body`, which map to `shape.width` and `shape.height`.
- Add high level `Actor`, `SpriteActor`, `AnimatedActor` and `PrimitiveActor` classes.
- Add `Behavior` base class and some simple behaviors.
- Emit `pause` and `resume` events from `core`.
- Add resolution config, and renderer will pick the most suited resolution base on your configs.
- Add Blender/Flash like keyframe based animation.
- Add SAT based collision solver.
- Add SpatialHash based broad phase solution for collision heavy games.
- Change canvas style during resizing for some resize modes.
- Use bitwise shift to optimise SpatialHash based collision detection, change `Body.collisionAgainst` to a 32bit integer number while broadPhase is SpatialHash.
- Add a new `device-patch` module to solve device specific issues.
- Add rotate prompt for mobile devices.
- Save renderer resolution as `engine.resolution`.
- [Changes] `PIXI.extras.Animation` is now renamed as `PIXI.extras.AnimatedSprite`.
- [Changes] Huge improve of `Animation` system(formerly called `Timeline`), now the **tweening of nested properties** is supported.
- [Changes] Deprecate `dom` resize mode.
- [Changes] Deprecate `Texture.fromAsset` method, use `loader.resources` instead.
- [Changes] Pass delta time to update methods in both milliseconds and seconds.
- [Changes] Upgrade PIXI to `master/3.0.11`
- [Changes] Default asset key does not contain `baseURL` any more.

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
