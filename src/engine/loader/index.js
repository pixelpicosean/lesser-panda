const Loader = require('./Loader');
const Resource = require('./Resource');
const async = require('./async');
const b64 = require('./b64');
const config = require('game/config');

module.exports = new Loader(config.baseUrl || 'media');
module.exports.Loader = Loader;
module.exports.Resource = Resource;
module.exports.async = async;
module.exports.base64 = b64;
