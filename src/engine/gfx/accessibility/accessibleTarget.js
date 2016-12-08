/**
 * Default property values of accessible objects
 * used by {@link AccessibilityManager}.
 *
 * @mixin
 * @example
 * function MyObject() {}
 *
 * Object.assign(
 *   MyObject.prototype,
 *   accessibility.accessibleTarget
 * );
 */
const accessibleTarget = {

  /**
   * @todo Needs docs.
   */
  accessible:false,

  /**
   * @todo Needs docs.
   */
  accessibleTitle:null,

  /**
   * @todo Needs docs.
   */
  tabIndex:0,

  /**
   * @todo Needs docs.
   */
  _accessibleActive:false,

  /**
   * @todo Needs docs.
   */
  _accessibleDiv:false,

};

module.exports = accessibleTarget;
