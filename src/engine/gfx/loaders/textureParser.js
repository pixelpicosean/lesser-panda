import Texture from '../core/textures/Texture';
import BaseTexture from '../core/textures/BaseTexture';
import { getResolutionOfUrl, BaseTextureCache, TextureCache } from '../core/utils';
import loader from 'engine/loader';
import { Resource } from 'engine/loader';

export default () => {
  return function(resource, next) {
    // create a new texture if the data is an Image object
    if (resource.data && (resource.type === Resource.TYPE.IMAGE)) {
      var baseTexture = new BaseTexture(resource.data, null, getResolutionOfUrl(resource.url));
      baseTexture.imageUrl = resource.url;
      resource.texture = new Texture(baseTexture);
      // lets also add the frame to pixi's global cache for fromFrame and fromImage fucntions
      BaseTextureCache[resource.url] = baseTexture;
      TextureCache[resource.url] = resource.texture;
    }

    next();
  };
};
