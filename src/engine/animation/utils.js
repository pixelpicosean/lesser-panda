/**
 * General utils.
 */

/**
 * Get the real target and its property key from
 * a root context and full path of the target property.
 * @param  {Object} context  Root context that contains the target
 * @param  {String} fullPath Full path of the target property
 * @return {Array}           [target, key] or undefined if no property matches
 */
function getTargetAndKey(context, fullPath) {
  var path = fullPath.split('.');
  // Path is just the property key
  if (path.length === 1) {
    return [context, fullPath];
  }
  else {
    var target = context;
    for (var i = 0; i < path.length - 1; i++) {
      if (target.hasOwnProperty(path[i])) {
        target = target[path[i]];
      }
      else {
        console.log('[Warning]: anim target "' + path[i] + '" not found');
        return undefined;
      }
    }

    if (!target.hasOwnProperty(path[path.length - 1])) {
      console.log('[Warning]: anim target "' + path[path.length - 1] + '" not found');
      return undefined;
    }
    return [target, path[path.length - 1]];
  }
}

module.exports = {
  getTargetAndKey: getTargetAndKey,
};
