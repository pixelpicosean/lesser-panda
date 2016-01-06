var hasDeviceInfo = false;
var device = {};

function fetchDeviceInfo() {
  var ua = navigator.userAgent;

  // Desktop
  device.linux = /Linux/.test(ua);
  device.macOS = /Mac OS/.test(ua);
  device.windows = /Windows/.test(ua);

  // iPod
  device.iPod = /iPod/i.test(ua);

  // iPhone
  device.iPhone = /iPhone/i.test(ua);
  device.iPhone4 = (device.iPhone && device.pixelRatio === 2 && device.screen.height === 920);
  device.iPhone5 = (device.iPhone && device.pixelRatio === 2 && device.screen.height === 1096);

  // iPad
  device.iPad = /iPad/i.test(ua);
  device.iPadRetina = (device.iPad && device.pixelRatio === 2);

  // iOS
  device.iOS = device.iPod || device.iPhone || device.iPad;
  device.iOS5 = (device.iOS && /OS 5/i.test(ua));
  device.iOS6 = (device.iOS && /OS 6/i.test(ua));
  device.iOS7 = (device.iOS && /OS 7/i.test(ua));
  device.iOS71 = (device.iOS && /OS 7_1/i.test(ua));
  device.iOS8 = (device.iOS && /OS 8/i.test(ua));

  // Android
  device.android = /Android/.test(ua);
  var androidVer = ua.match(/Android.*AppleWebKit\/([\d.]+)/);
  device.androidStock = !!(androidVer && androidVer[1] < 537);

  // Internet Explorer
  device.ie9 = /MSIE 9/i.test(ua);
  device.ie10 = /MSIE 10/i.test(ua);
  device.ie11 = /rv:11.0/i.test(ua);
  device.ie = device.ie10 || device.ie11 || device.ie9;

  // Windows Phone
  device.wp7 = /Windows Phone OS 7/i.test(ua);
  device.wp8 = /Windows Phone 8/i.test(ua);
  device.wp = device.wp7 || device.wp8;

  // Windows Tablet
  device.wt = ((/Windows NT/i.test(ua)) && /Touch/i.test(ua));

  // Others
  device.opera = /Opera/i.test(ua) || /OPR/i.test(ua);
  device.crosswalk = /Crosswalk/i.test(ua);
  device.cocoonJS = !!navigator.isCocoonJS;
  device.cocoonCanvasPlus = /CocoonJS/i.test(navigator.browser);
  device.ejecta = /Ejecta/i.test(ua);
  device.facebook = /FB/i.test(ua);
  device.wiiu = /Nintendo WiiU/i.test(ua);

  device.mobile = device.iOS || device.android || device.wp || device.wt;
  device.desktop = !device.mobile;

  hasDeviceInfo = true;
}

fetchDeviceInfo();

module.exports = device;
