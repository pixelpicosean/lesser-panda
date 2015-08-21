game.module(
  'game.main'
)
.body(function() {
  'use strict';

  game.addAsset('logo.png');

  game.createScene('Main', {
    backgroundColor: 0xb9bec7,

    init: function() {
      var logo = new game.Sprite('logo.png')
        .center()
        .addTo(this.stage);
    },
  });

});
