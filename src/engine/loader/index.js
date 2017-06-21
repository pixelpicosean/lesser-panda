import Loader from './Loader';
import Resource from './Resource';
import { encodeBinary } from './b64';
import config from 'game/config';

const base64 = {
  encodeBinary,
};

export {
  Loader,
  Resource,
  base64,
};

export default new Loader(config.baseUrl || 'media');
