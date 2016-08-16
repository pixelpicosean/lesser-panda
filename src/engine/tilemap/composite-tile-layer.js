/**
 * Based on PIXI-tilemap by Ivan Popelyshev
 * Modified by Sean Bohan
 */
var PIXI = require('engine/pixi');
var RectTileLayer = require('./rect-tile-layer');

function CompositeTileLayer() {
  PIXI.Container.apply(this, arguments);
  this.initialize.apply(this, arguments);
}

CompositeTileLayer.prototype = Object.create(PIXI.Container.prototype);
CompositeTileLayer.prototype.constructor = RectTileLayer;
CompositeTileLayer.prototype.updateTransform = CompositeTileLayer.prototype.displayObjectUpdateTransform;

  //can be initialized multiple times
CompositeTileLayer.prototype.initialize = function(zIndex, bitmaps, useSquare) {
  this.z = this.zIndex = zIndex;
  this.useSquare = useSquare;
  bitmaps && this.setBitmaps(bitmaps);
};

CompositeTileLayer.prototype.setBitmaps = function(bitmaps) {
  this.removeChildren();
  for (var i=0;i<bitmaps.length;i++)
    this.addChild(new RectTileLayer(this.zIndex, bitmaps[i]));
  this.modificationMarker = 0;
};

CompositeTileLayer.prototype.clear = function () {
  for (var i=0;i<this.children.length;i++)
    this.children[i].clear();
  this.modificationMarker = 0;
};

CompositeTileLayer.prototype.addRect = function (num, u, v, x, y, tileWidth, tileHeight) {
  if (this.children[num] && this.children[num].texture)
    this.children[num].addRect(u, v, x, y, tileWidth, tileHeight);
};

CompositeTileLayer.prototype.renderCanvas = function (renderer) {
  if (!renderer.dontUseTransform) {
    var wt = this.worldTransform;
    renderer.context.setTransform(
      wt.a * renderer.resolution,
      wt.b,
      wt.c,
      wt.d * renderer.resolution,
      wt.tx * renderer.resolution,
      wt.ty * renderer.resolution
    );
  }
  var layers = this.children;
  for (var i = 0; i < layers.length; i++)
    layers[i].renderCanvas(renderer);
};


CompositeTileLayer.prototype.renderWebGL = function(renderer) {
  var gl = renderer.gl;
  var shader = renderer.plugins.tile.getShader(this.useSquare);
  renderer.setObjectRenderer(renderer.plugins.tile);
  renderer.shaderManager.setShader(shader);
  var tm = shader.uniforms.projectionMatrix;
  //TODO: dont create new array, please
  this._globalMat = this._globalMat || new PIXI.Matrix();
  renderer.currentRenderTarget.projectionMatrix.copy(this._globalMat).append(this.worldTransform);
  tm.value = this._globalMat.toArray(true);
  if (this.useSquare) {
    var ps = shader.uniforms.pointScale;
    ps.value[0] = this._globalMat.a >= 0?1:-1;
    ps.value[1] = this._globalMat.d < 0?1:-1;
    ps = shader.uniforms.projectionScale;
    ps.value = Math.abs(this.worldTransform.a) * renderer.resolution;
  }
  var af = shader.uniforms.animationFrame.value;
  af[0] = renderer.tileAnimX | 0;
  af[1] = renderer.tileAnimY | 0;
  //shader.syncUniform(shader.uniforms.animationFrame);
  shader.syncUniforms();
  var layers = this.children;
  for (var i = 0; i < layers.length; i++)
    layers[i].renderWebGL(renderer, this.useSquare);
};


CompositeTileLayer.prototype.isModified = function(anim) {
  var layers = this.children;
  if (this.modificationMarker != layers.length) {
    return true;
  }
  for (var i=0;i<layers.length;i++) {
    if (layers[i].modificationMarker != layers[i].pointsBuf.length ||
      anim && layers[i].hasAnim) {
      return true;
    }
  }
  return false;
};

CompositeTileLayer.prototype.clearModify = function() {
  var layers = this.children;
  this.modificationMarker = layers.length;
  for (var i = 0; i < layers.length; i++) {
    layers[i].modificationMarker = layers[i].pointsBuf.length;
  }
};

module.exports = exports = CompositeTileLayer;
