const Vector = require('engine/Vector');

/**
 * Component interface.
 * Not necessary to inherit this class, just a simple interface.
 */
class Component {
  get rotation() {
    return (this.entity) ? this.entity.rotation : this._rotation;
  }
  set rotation(v) {
    this._rotation = v;
    if (this.entity) {
      this.entity.rotation = v;
    }
  }

  /**
   * Key name this component will be saved as in owner entity
   * @type {String}
   * @readonly
   */
  get key() {
    return '';
  }

  constructor() {
    this.entity = null;

    this.position = Vector.create();
    this._rotation = 0;
  }

  attach(entity) {
    // Recycle vectors if this is not attached to Entity
    if (!this.entity) {
      Vector.recycle(this.position);
    }

    // Replace the vectors with the entity
    this.position = entity.position;

    this.entity = entity;
  }
  detach() {
    if (this.entity) {
      // De-reference to the entity's vectors
      this.position = this.position.clone();

      this.entity = null;
    }
  }
}

module.exports = Component;
