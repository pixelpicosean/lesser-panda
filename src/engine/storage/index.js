var storage = require('./storage');

var Data = require('./data');
var PersistentData = require('./persistent-data');

storage.Data = Data;
storage.PersistentData = PersistentData;

storage.session = new Data();
storage.persistent = new PersistentData();

module.exports = exports = storage;
