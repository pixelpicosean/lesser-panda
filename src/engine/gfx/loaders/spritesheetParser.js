const Resource = require('engine/loader').Resource;
const Texture = require('../core/textures/Texture');
const utils = require('../core/utils');
const math = require('../core/math');
const async = require('engine/loader').async;

const BATCH_SIZE = 1000;

module.exports = function() {
  return function(resource, next) {
    var imageResourceName = resource.name + '_image';

    // skip if no data, its not json, it isn't spritesheet data, or the image resource already exists
    if (!resource.data || (resource.xhrType !== Resource.XHR_RESPONSE_TYPE.JSON) || !resource.data.frames || this.resources[imageResourceName]) {
      return next();
    }

    var loadOptions = {
      crossOrigin: resource.crossOrigin,
      loadType: Resource.LOAD_TYPE.IMAGE,
      metadata: resource.metadata.imageMetadata,
      parentResource: resource,
    };

    // load the image for this sheet
    this.add(imageResourceName, resource.data.meta.image, loadOptions, function(res) {
      resource.textures = {};

      var frames = resource.data.frames;
      var frameKeys = Object.keys(frames);
      var resolution = utils.getResolutionOfUrl(resource.url);
      var batchIndex = 0;

      // eslint-disable-next-line
      function processFrames(initialFrameIndex, maxFrames) {
        var frameIndex = initialFrameIndex;

        while (frameIndex - initialFrameIndex < maxFrames && frameIndex < frameKeys.length) {
          var frame = frames[frameKeys[frameIndex]];
          var rect = frame.frame;

          if (rect) {
            var size = null;
            var trim = null;

            if (frame.rotated) {
              size = new math.Rectangle(rect.x, rect.y, rect.h, rect.w);
            }
            else {
              size = new math.Rectangle(rect.x, rect.y, rect.w, rect.h);
            }

            //  Check to see if the sprite is trimmed
            if (frame.trimmed) {
              trim = new math.Rectangle(
                frame.spriteSourceSize.x / resolution,
                frame.spriteSourceSize.y / resolution,
                frame.sourceSize.w / resolution,
                frame.sourceSize.h / resolution
              );
            }

            // flip the width and height!
            if (frame.rotated) {
              var temp = size.width;
              size.width = size.height;
              size.height = temp;
            }

            size.x /= resolution;
            size.y /= resolution;
            size.width /= resolution;
            size.height /= resolution;

            resource.textures[frameKeys[frameIndex]] = new Texture(res.texture.baseTexture, size, size.clone(), trim, frame.rotated);

            // lets also add the frame to pixi's global cache for fromFrame and fromImage functions
            utils.TextureCache[frameKeys[frameIndex]] = resource.textures[frameKeys[frameIndex]];
          }
          frameIndex++;
        }
      }

      // eslint-disable-next-line
      function shouldProcessNextBatch() {
        return batchIndex * BATCH_SIZE < frameKeys.length;
      }

      // eslint-disable-next-line
      function processNextBatch(done) {
        processFrames(batchIndex * BATCH_SIZE, BATCH_SIZE);
        batchIndex++;
        setTimeout(done, 0);
      }

      if (frameKeys.length <= BATCH_SIZE) {
        processFrames(0, BATCH_SIZE);
        next();
      }
      else {
        async.whilst(shouldProcessNextBatch, processNextBatch, next);
      }
    });
  };
};
