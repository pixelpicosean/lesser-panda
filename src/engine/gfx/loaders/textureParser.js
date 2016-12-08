const Texture = require('../core/textures/Texture');
const BaseTexture = require('../core/textures/BaseTexture');
const utils = require('../core/utils');
const loader = require('engine/loader');
const Resource = loader.Resource;

module.exports = function() {
  return function(resource, next) {
    // create a new texture if the data is an Image object
    if (resource.data && (resource.type === Resource.TYPE.IMAGE)) {
      var baseTexture = new BaseTexture(resource.data, null, utils.getResolutionOfUrl(resource.url));
      baseTexture.imageUrl = resource.url;
      resource.texture = new Texture(baseTexture);
      // lets also add the frame to pixi's global cache for fromFrame and fromImage fucntions
      utils.BaseTextureCache[resource.url] = baseTexture;
      utils.TextureCache[resource.url] = resource.texture;
    }

    next();
  };
};
