module.exports = {
  /**
   * Logic size of the game
   */
  width: 320,
  height: 200,

  gfx: {
    /**
     * Using WebGL when available or not?
     * @type {Boolean}
     */
    webgl: true,
    /**
     * The resolution of the renderer, used for hi-resolution
     * textures and better text rendering.
     *
     * You only need higher resolutions while using hi-res
     * textures(i.e. image@2x.png), or better Text renderering.
     * Higher resolution means larger Canvas, which may cause
     * performance issues, especially on mobile devices.
     *
     * The value can be numbers, which will be directly used
     *   by the renderer
     * Or an object with some fields:
     *   - retina {Boolean} Whether take retina into account
     *   - values {Array}   Available resolutions
     * @type {Number|Object}
     */
    resolution: {
      retina: true,
      values: [1, 2],
    },
    /**
     * Default scale mode (linear or nearest)
     * @type {String}
     */
    scaleMode: 'nearest',
    /**
     * If the render view is transparent.
     * @type {Boolean}
     */
    transparent: false,
    /**
     * Sets antialias (only applicable in chrome at the moment).
     * @type {Boolean}
     */
    antialias: false,
    /**
     * Enables drawing buffer preservation, enable this if you
     * need to call toDataUrl on the webgl context.
     * @type {Boolean}
     */
    preserveDrawingBuffer: false,
  },

  /**
   * Default canvas view ID.
   * @type {String}
   */
  canvas: 'game',

  /**
   * Base URL of assets.
   * @type {String}
   */
  baseUrl: 'media',

  /**
   * Audio specific settings.
   * @type {Object}
   */
  audio: {
    /**
     * Supported audio file format.
     * Only files with these extensions will be load.
     * @type {Array}
     */
    use: ['webm', 'mp3'],
  },

  /**
   * How does the game resize?
   * available values:
   *  + letter-box    Scale with CSS and align to the center
   *  + crop          Resize the canvas to size of window
   *  + scale-inner   Resize the canvas and scale `container` of scene to show more
   *  + scale-outer   Resize the canvas and scale `container` of scene to show less
   */
  resizeMode: 'letter-box',

  /**
   * Whether pause the game when page loses focus.
   */
  pauseOnHide: false,

  /**
   * Whether show a image or text to tell players to rotate device
   * Only available on "mobile device".
   * @type {Boolean}
   */
  showRotatePrompt: true,
  rotatePromptBGColor: 'black',
  rotatePromptFontColor: 'white',
  rotatePromptImg: 'media/rotate.png',
  rotatePromptMsg: 'Please Rotate Your Device!',

  storage: {
    id: 'lpanda',
  },
};
