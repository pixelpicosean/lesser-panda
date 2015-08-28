game.module(
  'game.main'
)
.body(function() {
  'use strict';

  game.addAsset('KenPixel.fnt');

  function Main() {
    game.Scene.call(this);

    var text = new game.BitmapText('Lesser Panda', {
        font: '50px KenPixel'
      })
      .addTo(this.stage);
    text.position.set(
      game.system.width * 0.5 - text.width * 0.5,
      game.system.height * 0.5 - text.height * 0.5
    )
  };
  Main.prototype = Object.create(game.Scene.prototype);
  Object.assign(Main.prototype, {
    backgroundColor: 0xb9bec7,
    constructor: Main,
  });

  game.s['Main'] = Main;

});
