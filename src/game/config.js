export default {
  /**
   * Logic size of the game
   */
  width: 320,
  height: 200,

  /**
   * Logic update FPS
   * @type {Number}
   * @default 30
   */
  desiredFPS: 30,
  /**
   * How many RAFs to skip before each rendering?
   *
   * Note: This setting does not affect update frequency!
   *
   * @type {Number}
   * @default 0
   */
  skipFrame: 0,

  /**
   * How does the game resize?
   * available values:
   *  + letter-box    Scale with CSS and align to the center
   *  + crop          Resize the canvas to size of window
   *  + scale-inner   Resize the canvas and scale `container` of scene to show more
   *  + scale-outer   Resize the canvas and scale `container` of scene to show less
   *  + dom           Resize the canvas to its DOM size
   *  + never         Never resize
   */
  resizeMode: 'letter-box',

  /**
   * Whether pause the game (timer and scene)
   * when page is hidden
   */
  pauseOnHide: false,

  renderer: {
    webGL: true,
  },

  storage: {
    id: 'lpanda',
  },
};
