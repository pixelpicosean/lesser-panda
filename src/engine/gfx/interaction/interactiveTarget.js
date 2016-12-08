/**
 * Default property values of interactive objects
 * used by {@link interaction.InteractionManager}.
 *
 * @mixin
 * @example
 * function MyObject() {}
 *
 * Object.assign(
 *   MyObject.prototype,
 *   interaction.interactiveTarget
 * );
 */
var interactiveTarget = {
  /**
   * @todo Needs docs.
   */
  interactive: false,
  /**
   * @todo Needs docs.
   */
  buttonMode: false,
  /**
   * @todo Needs docs.
   */
  interactiveChildren: true,
  /**
   * @todo Needs docs.
   */
  defaultCursor: 'pointer',

  // some internal checks..

  /**
   * @todo Needs docs.
   * @private
   */
  _over: false,
  /**
   * @todo Needs docs.
   * @private
   */
  _touchDown: false,
};

module.exports = interactiveTarget;
