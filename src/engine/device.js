function fetchDeviceInfo() {
  var device = {};

  var ua = navigator.userAgent;

  // Facebook mobile app's integrated browser adds a bunch of strings that
  // match everything. Strip it out if it exists.
  var tmp = ua.split('[FBAN');
  if (typeof tmp[1] !== 'undefined') {
    ua = tmp[0];
    device.facebook = true;
  }

  // Twitter mobile app's integrated browser on iPad adds a "Twitter for
  // iPhone" string. Same probable happens on other tablet platforms.
  // This will confuse detection so strip it out if it exists.
  tmp = ua.split('Twitter');
  if (typeof tmp[1] !== 'undefined') {
    ua = tmp[0];
    device.twitter = true;
  }

  // Desktop
  device.linux = /Linux/.test(ua);
  device.macOS = /Mac OS/.test(ua);
  device.windows = /Windows/.test(ua);

  // - Internet Explorer
  device.ie9 = /MSIE 9/i.test(ua);
  device.ie10 = /MSIE 10/i.test(ua);
  device.ie11 = /rv:11.0/i.test(ua);
  device.ie = device.ie10 || device.ie11 || device.ie9;

  // Mobile

  // - iPod
  device.iPod = /iPod/i.test(ua);
  // - iPhone
  device.iPhone = /iPhone/i.test(ua);
  device.iPhone4 = (device.iPhone && device.pixelRatio === 2 && device.screen.height === 920);
  device.iPhone5 = (device.iPhone && device.pixelRatio === 2 && device.screen.height === 1096);
  // - iPad
  device.iPad = /iPad/i.test(ua);
  device.iPadRetina = (device.iPad && device.pixelRatio === 2);
  // - iOS
  device.iOS = device.iPod || device.iPhone || device.iPad;
  device.iOS5 = (device.iOS && /OS 5/i.test(ua));
  device.iOS6 = (device.iOS && /OS 6/i.test(ua));
  device.iOS7 = (device.iOS && /OS 7/i.test(ua));
  device.iOS71 = (device.iOS && /OS 7_1/i.test(ua));
  device.iOS8 = (device.iOS && /OS 8/i.test(ua));
  device.iOS9 = (device.iOS && /OS 9/i.test(ua));

  // - Android
  device.android = /Android/.test(ua);
  device.androidTablet = /Android/i.test(ua);
  device.androidPhone = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i.test(ua);
  var androidVer = ua.match(/Android.*AppleWebKit\/([\d.]+)/);
  device.androidStock = !!(androidVer && androidVer[1] < 537);

  // - Amazon Phone
  device.amazonPhone = /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i.test(ua);
  // - Amazon Tablet
  device.amazonTablet = /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i.test(ua);

  // - Windows Phone
  device.windowsPhone = /IEMobile/i.test(ua);
  // - Windows Tablet
  device.windowsTablet = /(?=.*\bWindows\b)(?=.*\bARM\b)/i.test(ua), // Match 'Windows' AND 'ARM'

  // - Other
  device.blackberry = /BlackBerry/i.test(ua);
  device.blackberry10 = /BB10/i.test(ua);
  device.mobileOpera = /Opera Mini/i.test(ua);
  device.mobileChrome = /(CriOS|Chrome)(?=.*\bMobile\b)/i.test(ua);
  device.mobileFirefox = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i.test(ua);
  device.sevenInch = new RegExp(
    '(?:' +         // Non-capturing group

    'Nexus 7' +     // Nexus 7

    '|' +           // OR

    'BNTV250' +     // B&N Nook Tablet 7 inch

    '|' +           // OR

    'Kindle Fire' + // Kindle Fire

    '|' +           // OR

    'Silk' +        // Kindle Fire, Silk Accelerated

    '|' +           // OR

    'GT-P1000' +    // Galaxy Tab 7 inch

    ')',            // End non-capturing group

    'i').test(ua);  // Case-insensitive matching

  // Special devices
  device.crosswalk = /Crosswalk/i.test(ua);
  device.cocoonJS = !!navigator.isCocoonJS;
  device.cocoonCanvasPlus = /CocoonJS/i.test(navigator.browser);
  device.ejecta = /Ejecta/i.test(ua);
  device.wiiu = /Nintendo WiiU/i.test(ua);

  // General
  device.tablet = device.iPad ||
                  device.androidTablet ||
                  device.windowsTablet;
  device.phone = device.iPhone ||
                 device.androidPhone ||
                 device.windowsPhone;

  device.mobile = device.iOS ||
                  device.androidPhone ||
                  device.androidTablet ||
                  device.amazonPhone ||
                  device.amazonTablet ||
                  device.windowsPhone ||
                  device.windowsTablet ||
                  device.blackberry ||
                  device.blackberry10 ||
                  device.mobileOpera ||
                  device.mobileFirefox ||
                  device.mobileChrome ||
                  device.sevenInch ||
                  device.crosswalk ||
                  device.cocoonJS ||
                  device.cocoonCanvasPlus ||
                  device.ejecta;

  device.desktop = (!device.mobile) || device.wiiu;

  return device;
}

module.exports = fetchDeviceInfo();
