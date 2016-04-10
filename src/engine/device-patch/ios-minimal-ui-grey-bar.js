var engine = require('engine/core');
var device = require('engine/device');

if (device.iOS) {
  var scrollY = (device.iOS9 && device.iPhone) ? 44 : 0;

  window.addEventListener('scroll', function () {
    // Do not scroll when keyboard is visible
    if (document.activeElement === document.body && window.scrollY > 0) {
      document.body.scrollTop = scrollY;
    }
  }, true);

  engine.on('resize', function() {
    window.scrollTo(0, scrollY);
  });
}
