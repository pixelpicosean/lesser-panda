/**
 * Let the entity always move around a point
 */

const Behavior = require('engine/Behavior');
const Vector = require('engine/Vector');

const DefaultSettings = {
  Center: Vector.create(),
  CCW: false,
  Speed: Math.PI,
};

class RotateAroundPoint extends Behavior {
  constructor() {
    super();

    this.type = 'RotateAroundPoint';

    this.Center = Vector.create();
    this.rotation = 0;
  }
  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedUpdate = true;

    this.radius = this.entity.position.distance(this.Center);
  }
  fixedUpdate(_, dt) {
    this.rotation += (dt * this.Speed);

    this.entity.position.set(this.Cadius, 0)
      .rotate(this.rotation)
      .add(this.Center);
  }
}

Behavior.register('RotateAroundPoint', RotateAroundPoint);

module.exports = RotateAroundPoint;
