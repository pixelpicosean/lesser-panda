var device = require('engine/device');
var config = require('game/config');

/**
  Google Analytics tracking.
  @class Analytics
  @extends game.Class
  @constructor
**/
function Analytics(settings) {
  this.trackId = settings.id;

  if (!navigator.onLine) return;

  if (device.cocoonJS) {
    this.clientId = Date.now();
    var request = new XMLHttpRequest();
    var params = 'v=1&tid=' + this.trackId + '&cid=' + this.clientId + '&t=pageview&dp=%2F';
    request.open('POST', 'http://www.google-analytics.com/collect', true);
    request.send(params);
  }
  else {
    (function(i, s, o, g, r, a, m) {
      i['GoogleAnalyticsObject'] = r;
      i[r] = i[r] || function() {
        (i[r].q = i[r].q || []).push(arguments)
      };

      i[r].l = 1 * new Date();
      a = s.createElement(o);
      m = s.getElementsByTagName(o)[0];
      a.async = 1;
      a.src = g;
      m.parentNode.insertBefore(a, m);
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    ga('create', this.trackId, 'auto');
    ga('send', 'pageview');
  }
}

/**
  Send event to analytics.
  @method send
  @param {String} category
  @param {String} action
  @param {String} [label]
  @param {String} [value]
**/
Analytics.prototype.send = function send(category, action, label, value) {
  if (!navigator.onLine) return;

  if (device.cocoonJS) {
    var request = new XMLHttpRequest();
    var params = 'v=1&tid=' + this.trackId + '&cid=' + this.clientId + '&t=event&ec=' + category + '&ea=' + action;
    if (typeof label !== 'undefined') params += '&el=' + label;
    if (typeof value !== 'undefined') params += '&ev=' + value;
    request.open('POST', 'http://www.google-analytics.com/collect', true);
    request.send(params);
  }
  else {
    ga('send', 'event', category, action, label, value);
  }
};

module.exports = new Analytics(Object.assign({
  id: '',
}, config.analytics));
