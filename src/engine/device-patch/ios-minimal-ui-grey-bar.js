var device = require('engine/device');

if (device.iOS) {
  window.addEventListener('scroll', function () {
    // Do not scroll when keyboard is visible
    if (document.activeElement === document.body && window.scrollY > 0) {
      document.body.scrollTop = (device.iOS9 && device.iPhone) ? 44 : 0;
    }
  }, true);
}
