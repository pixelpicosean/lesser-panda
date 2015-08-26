game.module(
  'game.main'
)
.body(function() {
  'use strict';

  game.addAsset('logo.png');

  function Main() {
    // Override Scene properties before super call
    this.backgroundColor = 0xb9bec7;

    // Call Scene ctor
    game.Scene.call(this);

    // Do what you want below
    var logo = new game.Sprite('logo.png')
      .center()
      .addTo(this.stage);
  };
  Main.prototype = Object.create(game.Scene.prototype);
  Main.prototype.constructor = Main;

  game.Main = Main;

});
