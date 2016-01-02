# LesserPanda HTML5 game engine

## ChangeLog

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
