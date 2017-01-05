const core = require('engine/core');
const loader = require('engine/loader');
const Game = require('engine/Game');

// Requite any systems
const SystemGfx = require('engine/gfx');
const SystemAnime = require('engine/anime');

// Requite anything else you want to use
const BitmapText = require('engine/gfx/BitmapText');
const AnimatedSprite = require('engine/gfx/AnimatedSprite');
const { filmstrip } = require('engine/gfx/utils');

// Loading screen
const Loading = require('game/Loading');

// Load some resources
loader
  .add('04b03.fnt')
  .add('bat', 'bat.png');

// A game acts like a scene/screen or whatever you call
class MyGame extends Game {
  constructor() {
    super();

    // FPS for fixed update
    this.desiredFPS = 30;

    // Add systems you want to have
    this
      .addSystem(new SystemAnime())
      .addSystem(new SystemGfx());

    // Create some layers
    this.sysGfx
      .createLayer('background')
      .createLayer('entities')
        .createLayer('actors', 'entities')
        .createLayer('fx', 'entities')
        .createLayer('hud', 'entities')
      .createLayer('ui');

    // Add some gfx elements
    const label = BitmapText({
      text: 'It Works!',
      font: '16px 04b03',
    }).addTo(this.sysGfx.layers['background']);
    label.position.set(core.width / 2 - label.width / 2, core.height / 2 - label.height / 2);

    const monster = AnimatedSprite({
      textures: filmstrip(loader.resources['bat'].texture, 51, 57),
      anims: [
        ['fly', [0,1,2,3,4], { speed: 10 }],
        ['atk', [5,6,7], { speed: 8, loop: false }],
        ['hurt', [8,9,8,9,8,9], { speed: 8, loop: false }],
        ['kill', [10,11,12,13], { speed: 8, loop: false }],
      ],
    }).addTo(this.sysGfx.layers['background']);
    monster.position.set(50);
    monster.anchor.set(0.5);
    monster.play('fly');

    // Animate something
    this.sysAnime.tween(monster)
      .to({ 'position.x': 250 }, 2000)
      .to({ 'scale.x': -1 }, 10)
      .to({ 'position.x': 50 }, 2000)
      .to({ 'scale.x': +1 }, 10)
      .repeat(100);
  }
}

core.main(MyGame, Loading);
