game.config = {
  // General configs
  name: 'My Awesome Game',
  version: '0.0.1',

  system: {
    width: 640,
    height: 400,

    scale: true,
    center: true,
    resize: false,

    webGL: false
  },

  // Mobile configs
  mobile: {
    system: {
      resize: true,

      webGL: true
    }
  }
};
