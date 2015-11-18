export default {
  /**
   * Logic size of the game
   */
  width: 320,
  height: 200,

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
