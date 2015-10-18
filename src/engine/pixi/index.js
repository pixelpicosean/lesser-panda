// run the polyfills
require('engine/polyfill');

var core = module.exports = require('./core');

// add core plugins.
core.extras         = require('./extras');
// core.filters        = require('./filters');
core.interaction    = require('./interaction');
core.loaders        = require('./loaders');
// core.mesh           = require('./mesh');

// export a premade loader instance
/**
 * A premade instance of the loader that can be used to loader resources.
 *
 * @name loader
 * @memberof PIXI
 * @property {PIXI.loaders.Loader}
 */
core.loader = new core.loaders.Loader();
