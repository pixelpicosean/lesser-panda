var pRatio = 1.0, cRatio = 1.0;

function innerBoxResize(containerSize, contentSize) {
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
}

function outerBoxResize(containerSize, contentSize) {
  pRatio = containerSize.x / containerSize.y;
  cRatio = contentSize.x / contentSize.y;

  var result = { left: 0, top: 0, scale: 1, };
  if (pRatio < cRatio) {
    result.scale = containerSize.y / contentSize.y;
    result.x = (containerSize.x - contentSize.x * result.scale) * 0.5;
  }
  else {
    result.scale = containerSize.x / contentSize.x;
    result.y = (containerSize.y - contentSize.y * result.scale) * 0.5;
  }

  return result;
}

module.exports = exports = {
  innerBoxResize: innerBoxResize,
  outerBoxResize: outerBoxResize,
};
