import Sprite from '../sprites/Sprite';
import Texture from '../textures/Texture';
import Rectangle from '../math/Rectangle';
import { hex2string } from '../utils';
import { RESOLUTION } from '../../const';

/**
 * A Text Object will create a line or multiple lines of text. To split a line you can use '\n' in your text string,
 * or add a wordWrap property set to true and and wordWrapWidth property with a value in the style object.
 *
 * A Text can be created directly from a string and a style object
 *
 * ```js
 * var text = new Text('This is a pixi text',{font : '24px Arial', fill : 0xff1010, align : 'center'});
 * ```
 *
 * @class
 * @extends Sprite
 * @param text {string} The copy that you would like the text to display
 * @param [style] {object} The style parameters
 * @param [style.font] {string} default 'bold 20px Arial' The style and size of the font
 * @param [style.fill='black'] {String|Number} A canvas fillstyle that will be used on the text e.g 'red', '#00FF00'
 * @param [style.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
 * @param [style.stroke] {String|Number} A canvas fillstyle that will be used on the text stroke e.g 'blue', '#FCFF00'
 * @param [style.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
 * @param [style.wordWrap=false] {boolean} Indicates if word wrap should be used
 * @param [style.wordWrapWidth=100] {number} The width at which text will wrap, it needs wordWrap to be set to true
 * @param [style.letterSpacing=0] {number} The amount of spacing between letters, default is 0
 * @param [style.breakWords=false] {boolean} Indicates if lines can be wrapped within words, it needs wordWrap to be set to true
 * @param [style.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
 * @param [style.dropShadow=false] {boolean} Set a drop shadow for the text
 * @param [style.dropShadowColor='#000000'] {string} A fill style to be used on the dropshadow e.g 'red', '#00FF00'
 * @param [style.dropShadowAngle=Math.PI/4] {number} Set a angle of the drop shadow
 * @param [style.dropShadowDistance=5] {number} Set a distance of the drop shadow
 * @param [style.dropShadowBlur=0] {number} Set a shadow blur radius
 * @param [style.padding=0] {number} Occasionally some fonts are cropped on top or bottom. Adding some padding will
 *      prevent this from happening by adding padding to the top and bottom of text height.
 * @param [style.textBaseline='alphabetic'] {string} The baseline of the text that is rendered.
 * @param [style.lineJoin='miter'] {string} The lineJoin property sets the type of corner created, it can resolve
 *      spiked text issues. Default is 'miter' (creates a sharp corner).
 * @param [style.miterLimit=10] {number} The miter limit to use when using the 'miter' lineJoin mode. This can reduce
 *      or increase the spikiness of rendered text.
 */
export default class Text extends Sprite {
  constructor(text, style, resolution) {
    super();

    /**
     * The canvas element that everything is drawn to
     *
     * @member {HTMLCanvasElement}
     */
    this.canvas = document.createElement('canvas');

    /**
     * The canvas 2d context that everything is drawn with
     * @member {HTMLCanvasElement}
     */
    this.context = this.canvas.getContext('2d');

    /**
     * The resolution of the canvas.
     * @member {number}
     */
    this.resolution = resolution || RESOLUTION;

    /**
     * Private tracker for the current text.
     *
     * @member {string}
     * @private
     */
    this._text = null;

    /**
     * Private tracker for the current style.
     *
     * @member {object}
     * @private
     */
    this._style = null;

    var texture = Texture.fromCanvas(this.canvas);
    texture.trim = new Rectangle();
    this.texture = texture;

    this.text = text;
    this.style = style;
  }

  /**
   * Renders text and updates it when needed
   *
   * @private
   */
  updateText() {
    var style = this._style;
    this.context.font = style.font;

      // word wrap
      // preserve original text
    var outputText = style.wordWrap ? this.wordWrap(this._text) : this._text;

      // split text into lines
    var lines = outputText.split(/(?:\r\n|\r|\n)/);

      // calculate text width
    var lineWidths = new Array(lines.length);
    var maxLineWidth = 0;
    var fontProperties = this.determineFontProperties(style.font);
    for (var i = 0; i < lines.length; i++) {
      var lineWidth = this.context.measureText(lines[i]).width + ((lines[i].length - 1) * style.letterSpacing);
      lineWidths[i] = lineWidth;
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
    }

    var width = maxLineWidth + style.strokeThickness;
    if (style.dropShadow) {
      width += style.dropShadowDistance;
    }

    this.canvas.width = Math.ceil((width + this.context.lineWidth) * this.resolution);

      // calculate text height
    var lineHeight = this.style.lineHeight || fontProperties.fontSize + style.strokeThickness;

    var height = lineHeight * lines.length;
    if (style.dropShadow) {
      height += style.dropShadowDistance;
    }

    this.canvas.height = Math.ceil((height + this._style.padding * 2) * this.resolution);

    this.context.scale(this.resolution, this.resolution);

    if (navigator.isCocoonJS) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    }

      // this.context.fillStyle="#FF0000";
      // this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.font = style.font;
    this.context.strokeStyle = style.stroke;
    this.context.lineWidth = style.strokeThickness;
    this.context.textBaseline = style.textBaseline;
    this.context.lineJoin = style.lineJoin;
    this.context.miterLimit = style.miterLimit;

    var linePositionX;
    var linePositionY;

    if (style.dropShadow) {
      if (style.dropShadowBlur > 0) {
        this.context.shadowColor = style.dropShadowColor;
        this.context.shadowBlur = style.dropShadowBlur;
      }
      else {
        this.context.fillStyle = style.dropShadowColor;
      }

      var xShadowOffset = Math.cos(style.dropShadowAngle) * style.dropShadowDistance;
      var yShadowOffset = Math.sin(style.dropShadowAngle) * style.dropShadowDistance;

      for (i = 0; i < lines.length; i++) {
        linePositionX = style.strokeThickness / 2;
        linePositionY = (style.strokeThickness / 2 + i * lineHeight) + fontProperties.ascent;

        if (style.align === 'right') {
          linePositionX += maxLineWidth - lineWidths[i];
        }
        else if (style.align === 'center') {
          linePositionX += (maxLineWidth - lineWidths[i]) / 2;
        }

        if (style.fill) {
          this.drawLetterSpacing(lines[i], linePositionX + xShadowOffset, linePositionY + yShadowOffset + style.padding);
        }
      }
    }

      // set canvas text styles
    this.context.fillStyle = style.fill;

      // draw lines line by line
    for (i = 0; i < lines.length; i++) {
      linePositionX = style.strokeThickness / 2;
      linePositionY = (style.strokeThickness / 2 + i * lineHeight) + fontProperties.ascent;

      if (style.align === 'right') {
        linePositionX += maxLineWidth - lineWidths[i];
      }
      else if (style.align === 'center') {
        linePositionX += (maxLineWidth - lineWidths[i]) / 2;
      }

      if (style.stroke && style.strokeThickness) {
        this.drawLetterSpacing(lines[i], linePositionX, linePositionY + style.padding, true);
      }

      if (style.fill) {
        this.drawLetterSpacing(lines[i], linePositionX, linePositionY + style.padding);
      }
    }

    this.updateTexture();
  }

  /**
   * Render the text with letter-spacing.
   *
   * @private
   */
  drawLetterSpacing(text, x, y, isStroke) {
    var style = this._style;

      // letterSpacing of 0 means normal
    var letterSpacing = style.letterSpacing;

    if (letterSpacing === 0) {
      if (isStroke) {
        this.context.strokeText(text, x, y);
      }
      else {
        this.context.fillText(text, x, y);
      }
      return;
    }

    var characters = String.prototype.split.call(text, ''),
      index = 0,
      current,
      currentPosition = x;

    while (index < text.length) {
      current = characters[index++];
      if (isStroke) {
        this.context.strokeText(current, currentPosition, y);
      }
      else {
        this.context.fillText(current, currentPosition, y);
      }
      currentPosition += this.context.measureText(current).width + letterSpacing;
    }
  }

  /**
   * Updates texture size based on canvas size
   *
   * @private
   */
  updateTexture() {
    var texture = this._texture;
    var style = this._style;

    texture.baseTexture.hasLoaded = true;
    texture.baseTexture.resolution = this.resolution;

    texture.baseTexture.width = this.canvas.width / this.resolution;
    texture.baseTexture.height = this.canvas.height / this.resolution;
    texture.crop.width = texture._frame.width = this.canvas.width / this.resolution;
    texture.crop.height = texture._frame.height = this.canvas.height / this.resolution;

    texture.trim.x = 0;
    texture.trim.y = -style.padding;

    texture.trim.width = texture._frame.width;
    texture.trim.height = texture._frame.height - style.padding * 2;

    this._width = this.canvas.width / this.resolution;
    this._height = this.canvas.height / this.resolution;

    texture.baseTexture.emit('update', texture.baseTexture);

    this.dirty = false;
  }

  /**
   * Renders the object using the WebGL renderer
   *
   * @param renderer {WebGLRenderer}
   */
  renderWebGL(renderer) {
    if (this.dirty) {
    // this.resolution = 1//renderer.resolution;

      this.updateText();
    }

    super.renderWebGL(renderer);
  }

  /**
   * Renders the object using the Canvas renderer
   *
   * @param renderer {CanvasRenderer}
   * @private
   */
  _renderCanvas(renderer) {
    if (this.dirty) {
       //   this.resolution = 1//renderer.resolution;

      this.updateText();
    }

    super._renderCanvas(renderer);
  }

  /**
   * Calculates the ascent, descent and fontSize of a given fontStyle
   *
   * @param fontStyle {object}
   * @private
   */
  determineFontProperties(fontStyle) {
    var properties = Text.fontPropertiesCache[fontStyle];

    if (!properties) {
      properties = {};

      var canvas = Text.fontPropertiesCanvas;
      var context = Text.fontPropertiesContext;

      context.font = fontStyle;

      var width = Math.ceil(context.measureText('|MÉq').width);
      var baseline = Math.ceil(context.measureText('M').width);
      var height = 2 * baseline;

      baseline = baseline * 1.4 | 0;

      canvas.width = width;
      canvas.height = height;

      context.fillStyle = '#f00';
      context.fillRect(0, 0, width, height);

      context.font = fontStyle;

      context.textBaseline = 'alphabetic';
      context.fillStyle = '#000';
      context.fillText('|MÉq', 0, baseline);

      var imagedata = context.getImageData(0, 0, width, height).data;
      var pixels = imagedata.length;
      var line = width * 4;

      var i, j;

      var idx = 0;
      var stop = false;

          // ascent. scan from top to bottom until we find a non red pixel
      for (i = 0; i < baseline; i++) {
        for (j = 0; j < line; j += 4) {
          if (imagedata[idx + j] !== 255) {
            stop = true;
            break;
          }
        }
        if (!stop) {
          idx += line;
        }
        else {
          break;
        }
      }

      properties.ascent = baseline - i;

      idx = pixels - line;
      stop = false;

          // descent. scan from bottom to top until we find a non red pixel
      for (i = height; i > baseline; i--) {
        for (j = 0; j < line; j += 4) {
          if (imagedata[idx + j] !== 255) {
            stop = true;
            break;
          }
        }
        if (!stop) {
          idx -= line;
        }
        else {
          break;
        }
      }

      properties.descent = i - baseline;
      properties.fontSize = properties.ascent + properties.descent;

      Text.fontPropertiesCache[fontStyle] = properties;
    }

    return properties;
  }

  /**
   * Applies newlines to a string to have it optimally fit into the horizontal
   * bounds set by the Text object's wordWrapWidth property.
   *
   * @param text {string}
   * @private
   */
  wordWrap(text) {
      // Greedy wrapping algorithm that will wrap words as the line grows longer
      // than its horizontal bounds.
    var result = '';
    var lines = text.split('\n');
    var wordWrapWidth = this._style.wordWrapWidth;
    for (var i = 0; i < lines.length; i++) {
      var spaceLeft = wordWrapWidth;
      var words = lines[i].split(' ');
      for (var j = 0; j < words.length; j++) {
        var wordWidth = this.context.measureText(words[j]).width;
        if (this._style.breakWords && wordWidth > wordWrapWidth) {
                  // Word should be split in the middle
          var characters = words[j].split('');
          for (var c = 0; c < characters.length; c++) {
            var characterWidth = this.context.measureText(characters[c]).width;
            if (characterWidth > spaceLeft) {
              result += '\n' + characters[c];
              spaceLeft = wordWrapWidth - characterWidth;
            }
            else {
              if (c === 0) {
                result += ' ';
              }
              result += characters[c];
              spaceLeft -= characterWidth;
            }
          }
        }
        else {
          var wordWidthWithSpace = wordWidth + this.context.measureText(' ').width;
          if (j === 0 || wordWidthWithSpace > spaceLeft) {
                      // Skip printing the newline if it's the first word of the line that is
                      // greater than the word wrap width.
            if (j > 0) {
              result += '\n';
            }
            result += words[j];
            spaceLeft = wordWrapWidth - wordWidth;
          }
          else {
            spaceLeft -= wordWidthWithSpace;
            result += ' ' + words[j];
          }
        }
      }

      if (i < lines.length - 1) {
        result += '\n';
      }
    }
    return result;
  }

  /**
   * Returns the bounds of the Text as a rectangle. The bounds calculation takes the worldTransform into account.
   *
   * @param matrix {Matrix} the transformation matrix of the Text
   * @return {Rectangle} the framing rectangle
   */
  getBounds(matrix) {
    if (this.dirty) {
      this.updateText();
    }

    return super.getBounds(matrix);
  }

  /**
   * Destroys this text object.
   *
   * @param [destroyBaseTexture=true] {boolean} whether to destroy the base texture as well
   */
  destroy(destroyBaseTexture) {
      // make sure to reset the the context and canvas.. dont want this hanging around in memory!
    this.context = null;
    this.canvas = null;

    this._style = null;

    this._texture.destroy(destroyBaseTexture === undefined ? true : destroyBaseTexture);
  }
}

Text.fontPropertiesCache = {};
Text.fontPropertiesCanvas = document.createElement('canvas');
Text.fontPropertiesContext = Text.fontPropertiesCanvas.getContext('2d');

Object.defineProperties(Text.prototype, {
    /**
     * The width of the Text, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof Text#
     */
  width: {
    get: function() {
      if (this.dirty) {
        this.updateText();
      }

      return this.scale.x * this._texture._frame.width;
    },
    set: function(value) {
      this.scale.x = value / this._texture._frame.width;
      this._width = value;
    },
  },

    /**
     * The height of the Text, setting this will actually modify the scale to achieve the value set
     *
     * @member {number}
     * @memberof Text#
     */
  height: {
    get: function() {
      if (this.dirty) {
        this.updateText();
      }

      return this.scale.y * this._texture._frame.height;
    },
    set: function(value) {
      this.scale.y = value / this._texture._frame.height;
      this._height = value;
    },
  },

    /**
     * Set the style of the text
     *
     * @param [style] {object} The style parameters
     * @param [style.font='bold 20pt Arial'] {string} The style and size of the font
     * @param [style.fill='black'] {string|number} A canvas fillstyle that will be used on the text eg 'red', '#00FF00'
     * @param [style.align='left'] {string} Alignment for multiline text ('left', 'center' or 'right'), does not affect single line text
     * @param [style.stroke='black'] {string|number} A canvas fillstyle that will be used on the text stroke eg 'blue', '#FCFF00'
     * @param [style.strokeThickness=0] {number} A number that represents the thickness of the stroke. Default is 0 (no stroke)
     * @param [style.wordWrap=false] {boolean} Indicates if word wrap should be used
     * @param [style.wordWrapWidth=100] {number} The width at which text will wrap
     * @param [style.lineHeight] {number} The line height, a number that represents the vertical space that a letter uses
     * @param [style.dropShadow=false] {boolean} Set a drop shadow for the text
     * @param [style.dropShadowColor='#000000'] {string|number} A fill style to be used on the dropshadow e.g 'red', '#00FF00'
     * @param [style.dropShadowAngle=Math.PI/6] {number} Set a angle of the drop shadow
     * @param [style.dropShadowDistance=5] {number} Set a distance of the drop shadow
     * @param [style.dropShadowBlur=0] {number} Set a shadow blur radius
     * @param [style.padding=0] {number} Occasionally some fonts are cropped on top or bottom. Adding some padding will
     *      prevent this from happening by adding padding to the top and bottom of text height.
     * @param [style.textBaseline='alphabetic'] {string} The baseline of the text that is rendered.
     * @param [style.lineJoin='miter'] {string} The lineJoin property sets the type of corner created, it can resolve
     *      spiked text issues. Default is 'miter' (creates a sharp corner).
     * @param [style.miterLimit=10] {number} The miter limit to use when using the 'miter' lineJoin mode. This can reduce
     *      or increase the spikiness of rendered text.
     * @memberof Text#
     */
  style: {
    get: function() {
      return this._style;
    },
    set: function(style) {
      style = style || {};

      if (typeof style.fill === 'number') {
        style.fill = hex2string(style.fill);
      }

      if (typeof style.stroke === 'number') {
        style.stroke = hex2string(style.stroke);
      }

      if (typeof style.dropShadowColor === 'number') {
        style.dropShadowColor = hex2string(style.dropShadowColor);
      }

      style.font = style.font || 'bold 20pt Arial';
      style.fill = style.fill || 'black';
      style.align = style.align || 'left';
      style.stroke = style.stroke || 'black'; // provide a default, see: https://github.com/pixijs/pixi.js/issues/136
      style.strokeThickness = style.strokeThickness || 0;
      style.wordWrap = style.wordWrap || false;
      style.wordWrapWidth = style.wordWrapWidth || 100;
      style.breakWords = style.breakWords || false;
      style.letterSpacing = style.letterSpacing || 0;

      style.dropShadow = style.dropShadow || false;
      style.dropShadowColor = style.dropShadowColor || '#000000';
      style.dropShadowAngle = style.dropShadowAngle !== undefined ? style.dropShadowAngle : Math.PI / 6;
      style.dropShadowDistance = style.dropShadowDistance !== undefined ? style.dropShadowDistance : 5;
      style.dropShadowBlur = style.dropShadowBlur !== undefined ? style.dropShadowBlur : 0; // shadowBlur is '0' by default according to HTML

      style.padding = style.padding || 0;

      style.textBaseline = style.textBaseline || 'alphabetic';

      style.lineJoin = style.lineJoin || 'miter';
      style.miterLimit = style.miterLimit || 10;

      this._style = style;
      this.dirty = true;
    },
  },

    /**
     * Set the copy for the text object. To split a line you can use '\n'.
     *
     * @param text {string} The copy that you would like the text to display
     * @memberof Text#
     */
  text: {
    get: function() {
      return this._text;
    },
    set: function(text) {
      text = text.toString() || ' ';
      if (this._text === text) {
        return;
      }
      this._text = text;
      this.dirty = true;
    },
  },
});
