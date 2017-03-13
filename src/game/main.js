import core from 'engine/core';
import loader from 'engine/loader';
import Game from 'engine/Game';
import audio from 'engine/audio';
import rnd from 'engine/rnd';
import Camera from 'engine/Camera';
import Entity from 'engine/Entity';
import { persistent, session } from 'engine/storage';
import 'engine/gfx/accessibility';
import 'engine/gfx/interaction';

// Requite any systems
import Gfx from 'engine/gfx';
import Anime from 'engine/anime';
import Timer from 'engine/timer';

// Requite anything else you want to use
import BitmapText from 'engine/gfx/BitmapText';
import AnimatedSprite from 'engine/gfx/AnimatedSprite';

import AABBSolver from 'engine/physics/AABBSolver';

// Loading screen
import Loading from 'game/Loading';

// Load some resources
loader.add('04b03.fnt');
loader.add('bat', 'bat.png');

// A game acts like a scene/screen or whatever you call
class MyGame extends Game {
  constructor() {
    super();

    // FPS for fixed update
    this.desiredFPS = 30;

    // Add systems you want to have
    this
      .addSystem(new Timer())
      .addSystem(new Anime())
      .addSystem(new Gfx());

    // Create some layers
    this.sysGfx
      .createLayer('background')
      .createLayer('entity')
        .createLayer('actor', 'entity')
        .createLayer('fx', 'entity')
        .createLayer('hud', 'entity')
      .createLayer('ui');

    // Add some gfx elements
    const label = BitmapText({
      text: 'It Works!',
      font: '16px 04b03',
    }).addTo(this.sysGfx.layers.background);
    label.position.set(core.width / 2 - label.width / 2, core.height / 2 - label.height / 2);

    const monster = AnimatedSprite({
      textures: ['bat', 51, 57],
      anims: [
        ['fly', [0,1,2,3,4], { speed: 10 }],
        ['atk', [5,6,7], { speed: 8, loop: false }],
        ['hurt', [8,9,8,9,8,9], { speed: 8, loop: false }],
        ['kill', [10,11,12,13], { speed: 8, loop: false }],
      ],
    }).addTo(this.sysGfx.layers.background);
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
