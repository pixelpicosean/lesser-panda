# LesserPanda HTML5 game engine

A fork of [Panda.js engine](http://www.pandajs.net) version 1.x.

## Samples

### Module Import/Export

Create a hero class in `my-hero` module (game/my-hero.js)

```javascript
game.module(
  'game.my-hero'
)
.body(function() {

  function MyHero(x, y, container) {
    this.sprite = new game.Sprite('hero', x, y).addTo(container);
  }
  MyHero.prototype.fly = function fly() {
    new game.Tween(this.sprite.position)
      .to({ x: 100 }, 600)
      .start();
  };

  this.exports = MyHero;
  
});
```

Import the module we just defined in the `main` module (game/main.js)

```javascript
game.module(
  'game.main'
)
.require(
  'game.my-hero'
)
.body(function() {

  var Hero = this.imports['game.my-hero'];

  new Hero(0, 100, game.scene.stage).fly();
  
});
```

## ChangeLog

### 0.2.0

- Add support for module imports/exports, so you do not need to expose everything to global namespaces (like `game`).
- Remove `Class` system due to performance and capabilities.

### 0.1.0

- Update renderer to PIXI.js latest stable version (v3.0.7).

## Why

I used panda.js-engine for personal and client projects, but its
v2 version does not support WebGL which is very important to guarantee 
the performance on mobile devices.

And another reason is I fell in love with FRP(Functional Reactive Programming)
which lead me to build games in a more functional and component based way, while
panda engine is moving forward to the traditional OOP style :(

## Note

It uses a customed version of Pixi.js without "mesh" and "filters".

## License

LesserPanda is released under the [MIT License](http://opensource.org/licenses/MIT), the same
as [Panda.js engine](http://www.pandajs.net).

### Special Thanks

[@ekelokorpi](https://github.com/ekelokorpi) for creating the awesome panda.js-engine
