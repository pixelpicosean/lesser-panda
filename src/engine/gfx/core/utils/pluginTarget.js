/**
 * Mixins functionality to make an object have "plugins".
 *
 * @mixin
 * @param {object} obj The object to mix into.
 * @example
 * function MyObject() {}
 *
 * pluginTarget.mixin(MyObject);
 */
function pluginTarget(obj) {
  obj.__plugins = {};

  /**
   * Adds a plugin to an object
   *
   * @param {string} pluginName The events that should be listed.
   * @param {Function} ctor     The constructor function for the plugin.
   */
  obj.registerPlugin = function(pluginName, ctor) {
    obj.__plugins[pluginName] = ctor;
  };

  /**
   * Instantiates all the plugins of this object
   */
  obj.prototype.initPlugins = function() {
    this.plugins = this.plugins || {};

    for (var o in obj.__plugins) {
      this.plugins[o] = new (obj.__plugins[o])(this);
    }
  };

  /**
   * Removes all the plugins of this object
   */
  obj.prototype.destroyPlugins = function() {
    for (var o in this.plugins) {
      this.plugins[o].destroy();
      this.plugins[o] = null;
    }

    this.plugins = null;
  };
}


module.exports = {
  /**
   * Mixes in the properties of the pluginTarget into another object
   *
   * @param {object} obj The obj to mix into
   */
  mixin: function mixin(obj) {
    pluginTarget(obj);
  },
};
