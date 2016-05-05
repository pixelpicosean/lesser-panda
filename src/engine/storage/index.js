var storage = require('./storage');

var Data = require('./data');
var PersistentData = require('./persistent-data');

/**
 * Data class.
 * @type {Data}
 */
storage.Data = Data;
/**
 * PersistentData class.
 * @type {PersistentData}
 */
storage.PersistentData = PersistentData;

/**
 * Session storage.
 * @type {Data}
 */
storage.session = new Data();
/**
 * Persistent storage.
 * @type {Data}
 */
storage.persistent = new PersistentData();

/**
 * Storage module provides functionalities to manage saving data. There
 * is a `session` storage for session data store and change event dispatching,
 * and a `persistent` storage for persistent data store and change event dispatching.
 *
 * Config:
 * - `storage.id`: namespace to save persistent data to
 *
 * @module engine/storage
 *
 * @requires engine/storage/storage
 * @requires engine/storage/data
 * @requires engine/storage/persistent-data
 */
module.exports = storage;
