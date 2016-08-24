/**
 * Let the actor always move around a point
 */

import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

export default class RotateAroundPoint extends Behavior {
  static TYPE = 'RotateAroundPoint';

  static DEFAULT_SETTINGS = {
    center: Vector.create(),
    ccw: false,
    speed: Math.PI,
  };

  constructor() {
    super();

    this.center = Vector.create();
    this.rotation = 0;
  }
  awake() {
    this.radius = this.actor.position.distance(this.center);
  }
  update(_, dt) {
    this.rotation += (dt * this.speed);

    this.actor.position.set(this.radius, 0)
      .rotate(this.rotation)
      .add(this.center);
  }
}

Behavior.register('RotateAroundPoint', RotateAroundPoint);
