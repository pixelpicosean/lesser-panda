'use strict';

function fetchDeviceInfo() {
  var device = {};

  var ua = navigator.userAgent;

  // Facebook mobile app's integrated browser adds a bunch of strings that
  // match everything. Strip it out if it exists.
  var tmp = ua.split('[FBAN');
  if (typeof tmp[1] !== 'undefined') {
    ua = tmp[0];
    /**
     * Is running inside of Facebook?
     * @memberof module:engine/device
     * @type {boolean}
     */
    device.facebook = true;
  }

  // Twitter mobile app's integrated browser on iPad adds a "Twitter for
  // iPhone" string. Same probable happens on other tablet platforms.
  // This will confuse detection so strip it out if it exists.
  tmp = ua.split('Twitter');
  if (typeof tmp[1] !== 'undefined') {
    ua = tmp[0];
    /**
     * Is running inside of Twitter?
     * @memberof module:engine/device
     * @type {boolean}
     */
    device.twitter = true;
  }

  // Desktop
  /**
   * Is running on Linux?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.linux = /Linux/.test(ua);
  /**
   * Is running on MacOSX?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.macOS = /Mac OS/.test(ua);
  /**
   * Is running on Windows?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.windows = /Windows/.test(ua);

  // - Internet Explorer
  /**
   * Is running on IE9 browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.ie9 = /MSIE 9/i.test(ua);
  /**
   * Is running on IE10 browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.ie10 = /MSIE 10/i.test(ua);
  /**
   * Is running on IE11 browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.ie11 = /rv:11.0/i.test(ua);
  /**
   * Is running on IE browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.ie = device.ie10 || device.ie11 || device.ie9;

  // Mobile

  // - iPod
  /**
   * Is running on an iPod?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iPod = /iPod/i.test(ua);
  // - iPhone
  /**
   * Is running on an iPhone?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iPhone = /iPhone/i.test(ua);
  /**
   * Is running on an iPhone4?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iPhone4 = (device.iPhone && device.pixelRatio === 2 && device.screen.height === 920);
  /**
   * Is running on an iPhone5?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iPhone5 = (device.iPhone && device.pixelRatio === 2 && device.screen.height === 1096);
  // - iPad
  /**
   * Is running on an iPad?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iPad = /iPad/i.test(ua);
  /**
   * Is running on a retina iPad?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iPadRetina = (device.iPad && device.pixelRatio === 2);
  // - iOS
  /**
   * Is running on iOS system?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iOS = device.iPod || device.iPhone || device.iPad;
  /**
   * Is running on iOS 5?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iOS5 = (device.iOS && /OS 5/i.test(ua));
  /**
   * Is running on iOS 6?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iOS6 = (device.iOS && /OS 6/i.test(ua));
  /**
   * Is running on iOS 7?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iOS7 = (device.iOS && /OS 7/i.test(ua));
  /**
   * Is running on iOS 7.1?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iOS71 = (device.iOS && /OS 7_1/i.test(ua));
  /**
   * Is running on iOS 8?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iOS8 = (device.iOS && /OS 8/i.test(ua));
  /**
   * Is running on iOS 9?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.iOS9 = (device.iOS && /OS 9/i.test(ua));

  // - Android
  /**
   * Is running on Android devices?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.android = /Android/.test(ua);
  /**
   * Is running on Android tablets?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.androidTablet = /Android/i.test(ua);
  /**
   * Is running on Android phones?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.androidPhone = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i.test(ua);
  var androidVer = ua.match(/Android.*AppleWebKit\/([\d.]+)/);
  /**
   * Is running on old Android stock browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.androidStock = !!(androidVer && androidVer[1] < 537);

  // - Amazon
  /**
   * Is running on Amazon phone?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.amazonPhone = /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i.test(ua);
  /**
   * Is running on Amazon tablet?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.amazonTablet = /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i.test(ua);

  // - Windows mobile
  /**
   * Is running on Windows phone?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.windowsPhone = /IEMobile/i.test(ua);
  /**
   * Is running on Windows tablet?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.windowsTablet = /(?=.*\bWindows\b)(?=.*\bARM\b)/i.test(ua), // Match 'Windows' AND 'ARM'

  // - Other
  /**
   * Is running on Blackberry?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.blackberry = /BlackBerry/i.test(ua);
  /**
   * Is running on Blackberry 10?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.blackberry10 = /BB10/i.test(ua);
  /**
   * Is running on mobile Opera browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.mobileOpera = /Opera Mini/i.test(ua);
  /**
   * Is running on mobile Chrome browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.mobileChrome = /(CriOS|Chrome)(?=.*\bMobile\b)/i.test(ua);
  /**
   * Is running on mobile Firefox browser?
   * @memberof module:engine/device
   * @type {boolean}
   */
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
  /**
   * Is running on crosswalk?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.crosswalk = /Crosswalk/i.test(ua);
  /**
   * Is running on CocoonJS?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.cocoonJS = !!navigator.isCocoonJS;
  /**
   * Is running on CocoonJS Canvas+ mode?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.cocoonCanvasPlus = /CocoonJS/i.test(navigator.browser);
  /**
   * Is running on Ejecta?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.ejecta = /Ejecta/i.test(ua);
  /**
   * Is running on WiiU?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.wiiu = /Nintendo WiiU/i.test(ua);

  // General
  /**
   * Is running on tablets?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.tablet = device.iPad ||
                  device.androidTablet ||
                  device.windowsTablet;
  /**
   * Is running on phones?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.phone = device.iPhone ||
                 device.androidPhone ||
                 device.windowsPhone;

  /**
   * Is running on mobile devices?
   * @memberof module:engine/device
   * @type {boolean}
   */
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

  /**
   * Is running on desktop devices?
   * @memberof module:engine/device
   * @type {boolean}
   */
  device.desktop = (!device.mobile) || device.wiiu;

  return device;
}

/**
 * @exports engine/device
 */
module.exports = fetchDeviceInfo();
