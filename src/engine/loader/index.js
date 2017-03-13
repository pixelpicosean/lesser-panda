import Loader from './Loader';
import Resource from './Resource';
import async from './async';
import b64 from './b64';
import config from 'game/config';

export {
  Loader,
  Resource,
  async,
  base64,
};

export default new Loader(config.baseUrl || 'media');
