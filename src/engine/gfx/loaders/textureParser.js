var core = require('../core');
var loader = require('engine/loader');
var Resource = loader.Resource;

module.exports = function() {
  return function(resource, next) {
    // create a new texture if the data is an Image object
    if (resource.data && (resource.type === Resource.TYPE.IMAGE)) {
      var baseTexture = new core.BaseTexture(resource.data, null, core.utils.getResolutionOfUrl(resource.url));
      baseTexture.imageUrl = resource.url;
      resource.texture = new core.Texture(baseTexture);
      // lets also add the frame to pixi's global cache for fromFrame and fromImage fucntions
      core.utils.BaseTextureCache[resource.url] = baseTexture;
      core.utils.TextureCache[resource.url] = resource.texture;
    }

    next();
  };
};
