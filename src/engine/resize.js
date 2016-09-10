'use strict';

/**
 * @module engine/resize
 */
var pRatio = 1.0, cRatio = 1.0;

/**
 * Calculate how to scale a content to fill its container in `outer-box` mode.
 * @param  {Vector} containerSize Size of container.
 * @param  {Vector} contentSize
 * @return {object} { left , top , scale }
 */
module.exports.outerBoxResize = function(containerSize, contentSize) {
  pRatio = containerSize.x / containerSize.y;
  cRatio = contentSize.x / contentSize.y;

  var result = { left: 0, top: 0, scale: 1, };
  if (pRatio > cRatio) {
    result.scale = containerSize.y / contentSize.y;
    result.left = (containerSize.x - contentSize.x * result.scale) * 0.5;
  }
  else {
    result.scale = containerSize.x / contentSize.x;
    result.top = (containerSize.y - contentSize.y * result.scale) * 0.5;
  }

  return result;
};

/**
 * Calculate how to scale a content to fill its container in `inner-box` mode.
 * @param  {Vector} containerSize Size of container.
 * @param  {Vector} contentSize
 * @return {object} { left , top , scale }
 */
module.exports.innerBoxResize = function(containerSize, contentSize) {
  pRatio = containerSize.x / containerSize.y;
  cRatio = contentSize.x / contentSize.y;

  var result = { left: 0, top: 0, scale: 1, };
  if (pRatio < cRatio) {
    result.scale = containerSize.y / contentSize.y;
    result.left = (containerSize.x - contentSize.x * result.scale) * 0.5;
  }
  else {
    result.scale = containerSize.x / contentSize.x;
    result.top = (containerSize.y - contentSize.y * result.scale) * 0.5;
  }

  return result;
};
