/**
 * Let the actor always move around a point
 */

import Behavior from 'engine/behavior';
import Vector from 'engine/vector';

export default class RotateAroundPoint extends Behavior {
  type = 'RotateAroundPoint';

  defaultSettings = {
    center: { x: 0, y: 0 },
    ccw: false,
    speed: Math.PI,
  };

  constructor() {
    super();

    this.center = Vector.create();
    this.rotation = 0;
  }
  setup(settings) {
    if (settings) {
      if (settings.center) {
        this.center.copy(settings.center);
      }
      this.ccw = settings.ccw || false;
      this.speed = settings.speed || Math.PI;
    }

    this.radius = this.target.position.distance(this.center);
  }
  update(_, dt) {
    this.rotation += (dt * this.speed);

    this.target.position.set(this.radius, 0)
      .rotate(this.rotation)
      .add(this.center);
  }
}

Behavior.register('RotateAroundPoint', RotateAroundPoint);
