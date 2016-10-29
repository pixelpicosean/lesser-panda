import storage from './storage';

import { default as _Data_ } from './data';
import { default as _PersistentData_ } from './persistent-data';

/**
 * Data class.
 * @type {Data}
 */
export const Data = _Data_;
/**
 * PersistentData class.
 * @type {PersistentData}
 */
export const PersistentData = _PersistentData_;

/**
 * Session storage.
 * @type {Data}
 */
export const session = new Data();
/**
 * Persistent storage.
 * @type {Data}
 */
export const persistent = new PersistentData();

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
export default storage;
