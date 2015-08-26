game.module(
  'game.main'
)
.body(function() {
  'use strict';

  game.addAsset('logo.png');

  function Main() {
    game.Scene.call(this);

    var logo = new game.Sprite('logo.png')
      .center()
      .addTo(this.stage);
  };
  Main.prototype = Object.create(game.Scene.prototype);
  Object.assign(Main.prototype, {
    backgroundColor: 0xb9bec7,
    constructor: Main,
  });

  game.Main = Main;

});
