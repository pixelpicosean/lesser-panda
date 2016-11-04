const Shader = require('../../core/renderers/webgl/shaders/Shader');
const ShaderManager = require('../../core/renderers/webgl/managers/ShaderManager');

/**
 * @class
 * @extends Shader
 * @memberof mesh
 * @param shaderManager {ShaderManager} The WebGL shader manager this shader works for.
 */
class MeshShader extends Shader {
  constructor(shaderManager) {
    super(shaderManager,
      // vertex shader
      [
        'precision lowp float;',
        'attribute vec2 aVertexPosition;',
        'attribute vec2 aTextureCoord;',

        'uniform mat3 translationMatrix;',
        'uniform mat3 projectionMatrix;',

        'varying vec2 vTextureCoord;',

        'void main(void){',
        '   gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
        '   vTextureCoord = aTextureCoord;',
        '}',
      ].join('\n'),
      [
        'precision lowp float;',

        'varying vec2 vTextureCoord;',
        'uniform float alpha;',

        'uniform sampler2D uSampler;',

        'void main(void){',
        '   gl_FragColor = texture2D(uSampler, vTextureCoord) * alpha ;',
        '}',
      ].join('\n'),
          // custom uniforms
      {
        alpha: { type: '1f', value: 0 },
        translationMatrix: { type: 'mat3', value: new Float32Array(9) },
        projectionMatrix: { type: 'mat3', value: new Float32Array(9) },
      },
          // custom attributes
      {
        aVertexPosition:0,
        aTextureCoord:0,
      }
    );
  }
}

ShaderManager.registerPlugin('meshShader', MeshShader);

module.exports = MeshShader;
