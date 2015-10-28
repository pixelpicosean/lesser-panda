import engine from 'engine/core';
import Scene from 'engine/scene';

import Vector from 'engine/vector';
import Timeline from 'engine/timeline';
import physics from 'engine/physics';

import 'engine/canvasquery';

function Box(x, y, world) {
  this.body = new physics.Body({
    mass: 0.4,
    shape: new physics.Rectangle(20, 20),
    collisionGroup: 1,
    collideAgainst: [2],
  }).addTo(world);

  this.body.position.set(x, y);
}
Box.prototype.draw = function draw(gl) {
  gl.fillStyle('#c04')
    .fillRect(this.body.position.x - 10, this.body.position.y - 10, 20, 20);
};

function Wall(x, y, w, h, world) {
  this.body = new physics.Body({
    shape: new physics.Rectangle(w, h),
    collisionGroup: 2,
  }).addTo(world);

  this.position = this.body.position.set(x, y);
  this.size = Vector.create(w, h);
}
Wall.prototype.draw = function draw(gl) {
  gl.fillStyle('#0af')
    .fillRect(this.position.x - this.size.x * 0.5, this.position.y - this.size.y * 0.5, this.size.x, this.size.y);
};

function LoadingScene() {
  Scene.call(this);

  this.box = new Box(160, 100, this.world);
  this.ground = new Wall(160, 180, 320, 20, this.world);
}
LoadingScene.prototype = Object.create(Scene.prototype);
LoadingScene.prototype.constructor = LoadingScene;

LoadingScene.prototype.draw = function draw(gl) {
  gl.clear('#203');

  this.box.draw(gl);
  this.ground.draw(gl);
};

engine.addScene('LoadingScene', LoadingScene);

engine.startWithScene('LoadingScene');
