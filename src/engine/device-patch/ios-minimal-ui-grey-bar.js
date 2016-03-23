var device = require('engine/device');

if (device.ios) {
  window.addEventListener('scroll', function () {
    // Do not scroll when keyboard is visible
    if (document.activeElement === document.body && window.scrollY > 0) {
      document.body.scrollTop = 0;
    }
  }, true);
}
