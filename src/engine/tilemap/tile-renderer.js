'use strict';

var PIXI = require('engine/pixi');

function SquareTileShader(shaderManager, vertexSrc, fragmentSrc, customUniforms, customAttributes) {
  this.vertSize = 5;
  this.vertPerQuad = 1;
  this.stride = this.vertSize * 4;
  var uniforms = {
    uSampler:           { type: 'sampler2D', value: 0 },
    samplerSize:        { type: '2f', value: new Float32Array([0, 0]) },
    projectionMatrix:   { type: 'mat3', value: new Float32Array([1, 0, 0,
      0, 1, 0,
      0, 0, 1]) },
    pointScale:         { type: '2f', value: new Float32Array([0, 0])},
    projectionScale:    { type: 'f', value: 1 }
  };
  if (customUniforms) {
    for (var u in customUniforms) {
      uniforms[u] = customUniforms[u];
    }
  }
  var attributes = {
    aVertexPosition:    0,
    aSize:              0
  };
  if (customAttributes) {
    for (var a in customAttributes) {
      attributes[a] = customAttributes[a];
    }
  }
  vertexSrc = vertexSrc || SquareTileShader.defaultVertexSrc;
  fragmentSrc = fragmentSrc || SquareTileShader.defaultFragmentSrc;
  PIXI.Shader.call(this, shaderManager, vertexSrc, fragmentSrc, uniforms, attributes);
}

// constructor
SquareTileShader.prototype = Object.create(PIXI.Shader.prototype);
SquareTileShader.prototype.constructor = SquareTileShader;
SquareTileShader.prototype.bindBuffer = function(gl, vb) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.vertexAttribPointer(this.attributes.aVertexPosition, 4, gl.FLOAT, false, this.stride, 0);
  gl.vertexAttribPointer(this.attributes.aSize, 3, gl.FLOAT, false, this.stride, 4 * 4);
};

/**
 * The default vertex shader source
 *
 * @static
 * @constant
 */
SquareTileShader.defaultVertexSrc = [
  'precision lowp float;',
  'attribute vec4 aVertexPosition;',
  'attribute vec3 aSize;',

  'uniform mat3 projectionMatrix;',
  'uniform vec2 samplerSize;',
  'uniform float projectionScale;',

  'varying vec2 vTextureCoord;',
  'varying float vSize;',

  'void main(void){',
  '   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition.xy + aSize.x * 0.5, 1.0)).xy, 0.0, 1.0);',
  '   gl_PointSize = aSize.x * projectionScale;',
  '   vTextureCoord = aVertexPosition.zw * samplerSize;',
  '   vSize = aSize.x;',
  '}'
].join('\n');

SquareTileShader.defaultFragmentSrc = [
  'precision lowp float;',

  'varying vec2 vTextureCoord;',
  'varying float vSize;',
  'uniform vec2 samplerSize;',

  'uniform sampler2D uSampler;',
  'uniform vec2 pointScale;',

  'void main(void){',
  '   float margin = 0.5/vSize;',
  '   vec2 clamped = vec2(clamp(gl_PointCoord.x, margin, 1.0 - margin), clamp(gl_PointCoord.y, margin, 1.0 - margin));',
  '   gl_FragColor = texture2D(uSampler, ((clamped-0.5) * pointScale + 0.5) * vSize * samplerSize + vTextureCoord);',
  '}'
].join('\n');

function RectTileShader(shaderManager, vertexSrc, fragmentSrc, customUniforms, customAttributes) {
  this.vertSize = 4;
  this.vertPerQuad = 6;
  this.stride = this.vertSize * 4;
  var uniforms = {
    uSampler:           { type: 'sampler2D', value: 0 },
    samplerSize:        { type: '2f', value: new Float32Array([0, 0]) },
    projectionMatrix:   { type: 'mat3', value: new Float32Array([1, 0, 0,
      0, 1, 0,
      0, 0, 1]) }
  };
  if (customUniforms) {
    for (var u in customUniforms) {
      uniforms[u] = customUniforms[u];
    }
  }
  var attributes = {
    aVertexPosition:    0,
  };
  if (customAttributes) {
    for (var a in customAttributes) {
      attributes[a] = customAttributes[a];
    }
  }
  vertexSrc = vertexSrc || RectTileShader.defaultVertexSrc;
  fragmentSrc = fragmentSrc || RectTileShader.defaultFragmentSrc;
  PIXI.Shader.call(this, shaderManager, vertexSrc, fragmentSrc, uniforms, attributes);
}

// constructor
RectTileShader.prototype = Object.create(PIXI.Shader.prototype);
RectTileShader.prototype.constructor = RectTileShader;
RectTileShader.prototype.bindBuffer = function(gl, vb) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.vertexAttribPointer(this.attributes.aVertexPosition, 4, gl.FLOAT, false, this.stride, 0);
};

/**
 * The default vertex shader source
 *
 * @static
 * @constant
 */
RectTileShader.defaultVertexSrc = [
  'precision lowp float;',
  'attribute vec4 aVertexPosition;',

  'uniform mat3 projectionMatrix;',
  'uniform vec2 samplerSize;',

  'varying vec2 vTextureCoord;',

  'void main(void){',
  '   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition.xy, 1.0)).xy, 0.0, 1.0);',
  '   vTextureCoord = aVertexPosition.zw * samplerSize;',
  '}'
].join('\n');

RectTileShader.defaultFragmentSrc = [
  'precision lowp float;',
  'varying vec2 vTextureCoord;',
  'uniform sampler2D uSampler;',
  'void main(void){',
  '   gl_FragColor = texture2D(uSampler, vTextureCoord);',
  '}'
].join('\n');

function TileRenderer(renderer) {
  PIXI.ObjectRenderer.call(this, renderer);
  this.vbs = {};
  this.lastTimeCheck = 0;
}

TileRenderer.prototype = Object.create(PIXI.ObjectRenderer.prototype);
TileRenderer.prototype.constructor = TileRenderer;
TileRenderer.vbAutoincrement = 0;

TileRenderer.prototype.onContextChange = function() {
  this.rectShader = new RectTileShader(this.renderer.shaderManager);
  this.squareShader = new SquareTileShader(this.renderer.shaderManager);
  this.vbs = {};
};


TileRenderer.prototype.checkLeaks = function() {
  var now = Date.now();
  var old = now - 10000;
  if (this.lastTimeCheck < old ||
    this.lastTimeCheck > now) {
    this.lastTimeCheck = now;
    var vbs = this.vbs;
    for (var key in vbs) {
      if (vbs[key].lastTimeAccess < old) {
        this.renderer.gl.deleteBuffer(vbs[key].vb);
        delete vbs[key];
      }
    }
  }
};

TileRenderer.prototype.start = function() {
  this.renderer.blendModeManager.setBlendMode(PIXI.BLEND_MODES.NORMAL);
};

TileRenderer.prototype.getVb = function(id) {
  this.checkLeaks();
  var vb = this.vbs[id];
  if (vb) {
    vb.lastAccessTime = Date.now();
    return vb;
  }
  return null;
};

TileRenderer.prototype.createVb = function() {
  var id = ++TileRenderer.vbAutoincrement;
  var vb = this.renderer.gl.createBuffer();
  return this.vbs[id] = { id: id, vb: vb, lastTimeAccess: Date.now() };
};

TileRenderer.prototype.removeVb = function(id) {
  if (this.vbs[id]) {
    this.renderer.gl.deleteBuffer(this.vbs[id]);
    delete this.vbs[id];
  }
};

TileRenderer.prototype.getShader = function(useSquare) {
  return useSquare ? this.squareShader : this.rectShader;
};

TileRenderer.prototype.destroy = function () {
  PIXI.ObjectRenderer.prototype.destroy.call(this);
  this.rectShader.destroy();
  this.squareShader.destroy();
  this.rectShader = null;
  this.squareShader = null;
};

/**
 * @exports engine/tilemap/tile-renderer
 *
 * @requires module:engine/pixi
 */
module.exports = exports = TileRenderer;
