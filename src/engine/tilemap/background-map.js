var PIXI = require('engine/pixi');

var TileRenderer = require('./tile-renderer');
PIXI.WebGLRenderer.registerPlugin('tile', TileRenderer);

/**
 * TileMap for rendering rectangle tile based maps.
 *
 * Based on PIXI-tilemap by Ivan Popelyshev
 * Modified by Sean Bohan.
 *
 * @class BackgroundMap
 *
 * @constructor
 */
function BackgroundMap(tilesize, data, tileset) {
  PIXI.DisplayObject.call(this);

  // Initialize
  this.tilesize = tilesize;
  this.data = data;
  this.tileset = tileset;

  this.visible = false;

  this.pointsBuf = [];
  this.modificationMarker = 0;

  this.uOffset = tileset.frame.x;
  this.vOffset = tileset.frame.y;
  this.tilesPerTilesetRow = Math.floor(tileset.width / tilesize);

  this.useSquare = true;
  this.modificationMarker = 0;

  // Create tiles from data
  var pb = this.pointsBuf;

  var r, q, height = data.length, width = data[0].length, tileIdx;
  for (r = 0; r < height; r++) {
    for (q = 0; q < width; q++) {
      tileIdx = data[r][q] - 1;

      if (tileIdx >= 0) {
        pb.push(this.uOffset + this.tilesize * Math.floor(tileIdx % this.tilesPerTilesetRow));
        pb.push(this.vOffset + this.tilesize * Math.floor(tileIdx / this.tilesPerTilesetRow));
        pb.push(this.tilesize * q);
        pb.push(this.tilesize * r);
        pb.push(this.tilesize);
        pb.push(this.tilesize);
        pb.push(0);
        pb.push(0);
      }
    }
  }
}

BackgroundMap.prototype = Object.create(PIXI.Container.prototype);
BackgroundMap.prototype.constructor = BackgroundMap;
BackgroundMap.prototype.updateTransform = BackgroundMap.prototype.displayObjectUpdateTransform;

/**
 * Clear the map
 * @memberof BackgroundMap#
 * @method clear
 */
BackgroundMap.prototype.clear = function() {
  this.pointsBuf.length = 0;
  this.modificationMarker = 0;
};

/**
 * Render to canvas context
 * @memberof BackgroundMap#
 * @method renderCanvas
 * @private
 */
BackgroundMap.prototype.renderCanvas = function(renderer) {
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

  if (!this.tileset || !this.tileset.valid) return;
  var points = this.pointsBuf;
  for (var i = 0, n = points.length; i < n; i += 8) {
    var x1 = points[i], y1 = points[i+1];
    var x2 = points[i+2], y2 = points[i+3];
    var w = points[i+4];
    var h = points[i+5];
    x1 += points[i+6] * (renderer.tileAnimX | 0);
    y1 += points[i+7] * (renderer.tileAnimY | 0);
    renderer.context.drawImage(this.tileset.baseTexture.source, x1, y1, w, h, x2, y2, w, h);
  }
};

/**
 * Render to WebGL context
 * @memberof BackgroundMap#
 * @method renderWebGL
 * @private
 */
BackgroundMap.prototype.renderWebGL = function(renderer) {
  var gl = renderer.gl;
  var tile = renderer.plugins.tile;
  var shader = tile.getShader(this.useSquare);
  renderer.setObjectRenderer(renderer.plugins.tile);
  renderer.shaderManager.setShader(shader);
  var tm = shader.uniforms.projectionMatrix;
  //TODO: dont create new array, please
  this._globalMat = this._globalMat || new PIXI.Matrix();
  renderer.currentRenderTarget.projectionMatrix.copy(this._globalMat).append(this.worldTransform);
  tm.value = this._globalMat.toArray(true);
  if (this.useSquare) {
    var ps = shader.uniforms.pointScale;
    ps.value[0] = this._globalMat.a >= 0 ? 1 : -1;
    ps.value[1] = this._globalMat.d < 0 ? 1 : -1;
    ps = shader.uniforms.projectionScale;
    ps.value = Math.abs(this.worldTransform.a) * renderer.resolution;
  }
  var af = shader.uniforms.animationFrame.value;
  af[0] = renderer.tileAnimX | 0;
  af[1] = renderer.tileAnimY | 0;
  //shader.syncUniform(shader.uniforms.animationFrame);
  shader.syncUniforms();

  if (!this.tileset || !this.tileset.valid) return;
  var points = this.pointsBuf;
  if (points.length === 0) return;

  gl.activeTexture(gl.TEXTURE0);
  var tileset = this.tileset.baseTexture;
  if (!tileset._glTextures[gl.id]) {
    renderer.updateTexture(tileset);
  }
  else {
    gl.bindTexture(gl.TEXTURE_2D, tileset._glTextures[gl.id]);
  }
  var ss =  shader.uniforms.samplerSize;
  ss.value[0] = 1.0 / tileset.width;
  ss.value[1] = 1.0 / tileset.height;
  shader.syncUniform(ss);
  //lost context! recover!
  var vb = tile.getVb(this.vbId);
  if (!vb) {
    vb = tile.createVb();
    this.vbId = vb.id;
    this.vbBuffer = null;
    this.modificationMarker = 0;
  }
  vb = vb.vb;
  //if layer was changed, reupload vertices
  shader.bindBuffer(gl, vb);
  var vertices = points.length / 8 * shader.vertPerQuad;
  if (this.modificationMarker !== vertices) {
    this.modificationMarker = vertices;
    var vs = shader.stride * vertices;
    if (!this.vbBuffer || this.vbBuffer.byteLength < vs) {
      //!@#$
      var bk = shader.stride;
      while (bk < vs) {
        bk *= 2;
      }
      this.vbBuffer = new ArrayBuffer(bk);
      this.vbArray = new Float32Array(this.vbBuffer);
      this.vbInts = new Uint32Array(this.vbBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.vbArray, gl.DYNAMIC_DRAW);
    }

    var arr = this.vbArray, ints = this.vbInts;
    //upload vertices!
    var sz = 0;
    //var tint = 0xffffffff;
    if (this.useSquare) {
      for (var i = 0; i < points.length; i += 8) {
        arr[sz++] = points[i + 2];
        arr[sz++] = points[i + 3];
        arr[sz++] = points[i + 0];
        arr[sz++] = points[i + 1];
        arr[sz++] = points[i + 4];
        arr[sz++] = points[i + 6];
        arr[sz++] = points[i + 7];
      }
    }
    else {
      var ww = tileset.width, hh = tileset.height;
      //var tint = 0xffffffff;
      var tint = -1;
      for (var i = 0; i < points.length; i += 8) {
        var x = points[i+2], y = points[i+3];
        var w = points[i+4], h = points[i+5];
        var u = points[i], v = points[i+1];
        var animX = points[i+6], animY = points[i+7];
        arr[sz++] = x;
        arr[sz++] = y;
        arr[sz++] = u;
        arr[sz++] = v;
        arr[sz++] = animX;
        arr[sz++] = animY;
        arr[sz++] = x + w;
        arr[sz++] = y;
        arr[sz++] = u + w;
        arr[sz++] = v;
        arr[sz++] = animX;
        arr[sz++] = animY;
        arr[sz++] = x + w;
        arr[sz++] = y + h;
        arr[sz++] = u + w;
        arr[sz++] = v + h;
        arr[sz++] = animX;
        arr[sz++] = animY;
        arr[sz++] = x;
        arr[sz++] = y;
        arr[sz++] = u;
        arr[sz++] = v;
        arr[sz++] = animX;
        arr[sz++] = animY;
        arr[sz++] = x + w;
        arr[sz++] = y + h;
        arr[sz++] = u + w;
        arr[sz++] = v + h;
        arr[sz++] = animX;
        arr[sz++] = animY;
        arr[sz++] = x;
        arr[sz++] = y + h;
        arr[sz++] = u;
        arr[sz++] = v + h;
        arr[sz++] = animX;
        arr[sz++] = animY;
      }
    }
    if (vs > this.vbArray.length/2 ) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr);
    }
    else {
      var view = arr.subarray(0, vs)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
    }
  }
  if (this.useSquare) {
    gl.drawArrays(gl.POINTS, 0, vertices);
  }
  else {
    gl.drawArrays(gl.TRIANGLES, 0, vertices);
  }
};

/**
 * Whether the map is modified (tiles are changed)
 * @memberof BackgroundMap#
 * @method isModified
 */
BackgroundMap.prototype.isModified = function(anim) {
  return this.modificationMarker !== this.pointsBuf.length;
};

/**
 * Set the tilemap as not modiried
 * @memberof BackgroundMap#
 * @method clearModify
 */
BackgroundMap.prototype.clearModify = function() {
  this.modificationMarker = this.pointsBuf.length;
};

/**
 * @exports engine/tilemap/background-map
 *
 * @see BackgroundMap
 *
 * @requires module:engine/pixi
 */
module.exports = exports = BackgroundMap;
