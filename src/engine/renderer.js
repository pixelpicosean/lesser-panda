var Renderer = {
  instance: undefined,
  init: function init(width, height, settings) {
    console.log('[Warning]: No working renderer!');
  },
  resize: function resize(w, h) {
    console.log('[Warning]: Renderer can not be resized!');
  },
  render: function render(scene) {
    console.log('[Warning]: Renderer does not render!');
  },
};

module.exports = Renderer;
