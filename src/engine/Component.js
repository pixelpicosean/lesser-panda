const Vector = require('engine/Vector');

/**
 * Component interface.
 * Not necessary to inherit this class, just a simple interface.
 */
class Component {
  get rotation() {
    return this._rotation;
  }
  set rotation(v) {
    this._rotation = v;
    if (this.entity) {
      this.entity._rotation = v;
    }
  }

  constructor() {
    this.entity = null;

    this.position = Vector.create();
    this.scale = Vector.create();
    this._rotation = 0;
  }

  attach(entity) {
    // Recycle vectors if this is not attached to Entity
    if (!this.entity) {
      Vector.recycle(this.position);
      Vector.recycle(this.scale);
    }

    // Replace the vectors with the entity
    this.position = entity.position;
    this.scale = entity.scale;

    this.entity = entity;
  }
  detach() {
    if (this.entity) {
      // De-reference to the entity's vectors
      this.position = this.position.clone();
      this.scale = this.scale.clone();

      this.entity = null;
    }
  }
}

module.exports = Component;
