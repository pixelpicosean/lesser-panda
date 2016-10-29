import Loader from './Loader';
import Resource from './Resource';
import * as async from './async';
import * as b64 from './b64';
import config from 'game/config';

export { Loader, Resource, async, b64 as base64 };

export default new Loader(config.baseUrl || 'media');
