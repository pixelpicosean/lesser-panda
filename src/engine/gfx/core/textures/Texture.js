import BaseTexture from './BaseTexture';
import VideoBaseTexture from './VideoBaseTexture';
import TextureUvs from './TextureUvs';
import EventEmitter from 'engine/EventEmitter';
import Rectangle from '../math/Rectangle';
import { uid, TextureCache, BaseTextureCache } from '../utils';

/**
 * A texture stores the information that represents an image or part of an image. It cannot be added
 * to the display list directly. Instead use it as the texture for a Sprite. If no frame is provided then the whole image is used.
 *
 * You can directly create a texture from an image and then reuse it multiple times like this :
 *
 * ```js
 * var texture = textureFromData('assets/image.png');
 * var sprite1 = new Sprite(texture);
 * var sprite2 = new Sprite(texture);
 * ```
 *
 * @class
 */
export default class Texture extends EventEmitter {
  /**
   * @constructor
   * @param baseTexture {BaseTexture} The base texture source to create the texture from
   * @param [frame] {Rectangle} The rectangle frame of the texture to show
   * @param [crop] {Rectangle} The area of original texture
   * @param [trim] {Rectangle} Trimmed texture rectangle
   * @param [rotate] {number} indicates how the texture was rotated by texture packer. See {@link GroupD8}
   */
  constructor(baseTexture, frame, crop, trim, rotate) {
    super();

    this.uid = uid();

    /**
     * Does this Texture have any frame data assigned to it?
     *
     * @member {boolean}
     */
    this.noFrame = false;

    if (!frame) {
      this.noFrame = true;
      frame = new Rectangle(0, 0, 1, 1);
    }

    if (baseTexture instanceof Texture) {
      baseTexture = baseTexture.baseTexture;
    }

    /**
     * The base texture that this texture uses.
     *
     * @member {BaseTexture}
     */
    this.baseTexture = baseTexture;

    /**
     * The frame specifies the region of the base texture that this texture uses
     *
     * @member {Rectangle}
     * @private
     */
    this._frame = frame;

    /**
     * The texture trim data.
     *
     * @member {Rectangle}
     */
    this.trim = trim;

    /**
     * This will let the renderer know if the texture is valid. If it's not then it cannot be rendered.
     *
     * @member {boolean}
     */
    this.valid = false;

    /**
     * This will let a renderer know that a texture has been updated (used mainly for webGL uv updates)
     *
     * @member {boolean}
     */
    this.requiresUpdate = false;

    /**
     * The WebGL UV data cache.
     *
     * @member {TextureUvs}
     * @private
     */
    this._uvs = null;

    /**
     * The width of the Texture in pixels.
     *
     * @member {number}
     */
    this.width = 0;

    /**
     * The height of the Texture in pixels.
     *
     * @member {number}
     */
    this.height = 0;

    /**
     * This is the area of the BaseTexture image to actually copy to the Canvas / WebGL when rendering,
     * irrespective of the actual frame size or placement (which can be influenced by trimmed texture atlases)
     *
     * @member {Rectangle}
     */
    this.crop = crop || frame;// new Rectangle(0, 0, 1, 1);

    this._rotate = +(rotate || 0);

    if (rotate === true) {
        // this is old texturepacker legacy, some games/libraries are passing "true" for rotated textures
      this._rotate = 2;
    }
    else {
      if (this._rotate % 2 !== 0) {
        throw 'attempt to use diamond-shaped UVs. If you are sure, set rotation manually';
      }
    }

    if (baseTexture.hasLoaded) {
      if (this.noFrame) {
        frame = new Rectangle(0, 0, baseTexture.width, baseTexture.height);

            // if there is no frame we should monitor for any base texture changes..
        baseTexture.on('update', this.onBaseTextureUpdated, this);
      }
      this.frame = frame;
    }
    else {
      baseTexture.once('loaded', this.onBaseTextureLoaded, this);
    }

    /**
     * Fired when the texture is updated. This happens if the frame or the baseTexture is updated.
     *
     * @event update
     * @memberof Texture#
     * @protected
     */
  }

  /**
   * Updates this texture on the gpu.
   * @memberof Texture#
   */
  update() {
    this.baseTexture.update();
  }

  /**
   * Called when the base texture is loaded
   * @memberof Texture#
   * @private
   */
  onBaseTextureLoaded(baseTexture) {
      // TODO this code looks confusing.. boo to abusing getters and setterss!
    if (this.noFrame) {
      this.frame = new Rectangle(0, 0, baseTexture.width, baseTexture.height);
    }
    else {
      this.frame = this._frame;
    }

    this.emit('update', this);
  }

  /**
   * Called when the base texture is updated
   * @memberof Texture#
   * @private
   */
  onBaseTextureUpdated(baseTexture) {
    this._frame.width = baseTexture.width;
    this._frame.height = baseTexture.height;

    this.emit('update', this);
  }

  /**
   * Destroys this texture
   * @memberof Texture#
   * @param [destroyBase=false] {boolean} Whether to destroy the base texture as well
   */
  destroy(destroyBase) {
    if (this.baseTexture) {
      if (destroyBase) {
        this.baseTexture.destroy();
      }

      this.baseTexture.off('update', this.onBaseTextureUpdated, this);
      this.baseTexture.off('loaded', this.onBaseTextureLoaded, this);

      this.baseTexture = null;
    }

    this._frame = null;
    this._uvs = null;
    this.trim = null;
    this.crop = null;

    this.valid = false;

    this.off('dispose', this.dispose, this);
    this.off('update', this.update, this);
  }

  /**
   * Creates a new texture object that acts the same as this one.
   * @memberof Texture#
   * @return {Texture}
   */
  clone() {
    return new Texture(this.baseTexture, this.frame, this.crop, this.trim, this.rotate);
  }

  /**
   * Updates the internal WebGL UV cache.
   * @memberof Texture#
   * @private
   */
  _updateUvs() {
    if (!this._uvs) {
      this._uvs = new TextureUvs();
    }

    this._uvs.set(this.crop, this.baseTexture, this.rotate);
  }
}

Object.defineProperties(Texture.prototype, {
  /**
   * The frame specifies the region of the base texture that this texture uses.
   *
   * @member {Rectangle}
   * @memberof Texture#
   */
  frame: {
    get: function() {
      return this._frame;
    },
    set: function(frame) {
      this._frame = frame;

      this.noFrame = false;

      this.width = frame.width;
      this.height = frame.height;

      if (!this.trim && !this.rotate && (frame.x + frame.width > this.baseTexture.width || frame.y + frame.height > this.baseTexture.height)) {
        throw new Error('Texture Error: frame does not fit inside the base Texture dimensions ' + this);
      }

            // this.valid = frame && frame.width && frame.height && this.baseTexture.source && this.baseTexture.hasLoaded;
      this.valid = frame && frame.width && frame.height && this.baseTexture.hasLoaded;

      if (this.trim) {
        this.width = this.trim.width;
        this.height = this.trim.height;
        this._frame.width = this.trim.width;
        this._frame.height = this.trim.height;
      }
      else {
        this.crop = frame;
      }

      if (this.valid) {
        this._updateUvs();
      }
    },
  },
  /**
   * Indicates whether the texture is rotated inside the atlas
   * set to 2 to compensate for texture packer rotation
   * set to 6 to compensate for spine packer rotation
   * can be used to rotate or mirror sprites
   * See {@link GroupD8} for explanation
   *
   * @member {number}
   * @memberof Texture#
   */
  rotate: {
    get: function() {
      return this._rotate;
    },
    set: function(rotate) {
      this._rotate = rotate;
      if (this.valid) {
        this._updateUvs();
      }
    },
  },
});

/**
 * Helper function that creates a Texture object from the given image url.
 * If the image is not in the texture cache it will be  created and loaded.
 *
 * @static
 * @memberof Texture
 *
 * @param imageUrl {string} The image url of the texture
 * @param crossorigin {boolean} Whether requests should be treated as crossorigin
 * @param scaleMode {number} See {@link SCALE_MODES} for possible values
 * @return {Texture} The newly created texture
 */
Texture.fromImage = function(imageUrl, crossorigin, scaleMode) {
  var texture = TextureCache[imageUrl];

  if (!texture) {
    texture = new Texture(BaseTexture.fromImage(imageUrl, crossorigin, scaleMode));
    TextureCache[imageUrl] = texture;
  }

  return texture;
};

/**
 * Helper function that creates a sprite that will contain a texture from the TextureCache based on the frameId
 * The frame ids are created when a Texture packer file has been loaded
 *
 * @static
 * @memberof Texture
 *
 * @param frameId {string} The frame Id of the texture in the cache
 * @return {Texture} The newly created texture
 */
Texture.fromFrame = function(frameId) {
  var texture = TextureCache[frameId];

  if (!texture) {
    throw new Error('The frameId "' + frameId + '" does not exist in the texture cache');
  }

  return texture;
};

/**
 * Helper function that creates a new Texture based on the given canvas element.
 *
 * @static
 * @memberof Texture
 *
 * @param canvas {Canvas} The canvas element source of the texture
 * @param scaleMode {number} See {@link SCALE_MODES} for possible values
 * @return {Texture}
 */
Texture.fromCanvas = function(canvas, scaleMode) {
  return new Texture(BaseTexture.fromCanvas(canvas, scaleMode));
};

/**
 * Helper function that creates a new Texture based on the given video element.
 *
 * @static
 * @memberof Texture
 *
 * @param video {HTMLVideoElement}
 * @param scaleMode {number} See {@link SCALE_MODES} for possible values
 * @return {Texture} A Texture
 */
Texture.fromVideo = function(video, scaleMode) {
  if (typeof video === 'string') {
    return Texture.fromVideoUrl(video, scaleMode);
  }
  else {
    return new Texture(VideoBaseTexture.fromVideo(video, scaleMode));
  }
};

/**
 * Helper function that creates a new Texture based on the video url.
 *
 * @static
 * @memberof Texture
 *
 * @param videoUrl {string}
 * @param scaleMode {number} See {@link SCALE_MODES} for possible values
 * @return {Texture} A Texture
 */
Texture.fromVideoUrl = function(videoUrl, scaleMode) {
  return new Texture(VideoBaseTexture.fromUrl(videoUrl, scaleMode));
};

/**
 * Adds a texture to the global utils.TextureCache. This cache is shared across the whole PIXI object.
 *
 * @static
 * @memberof Texture
 *
 * @param texture {Texture} The Texture to add to the cache.
 * @param id {string} The id that the texture will be stored against.
 */
Texture.addTextureToCache = function(texture, id) {
  TextureCache[id] = texture;
};

/**
 * Remove a texture from the global utils.TextureCache.
 *
 * @static
 * @memberof Texture
 *
 * @param id {string} The id of the texture to be removed
 * @return {Texture} The texture that was removed
 */
Texture.removeTextureFromCache = function(id) {
  var texture = TextureCache[id];

  delete TextureCache[id];
  delete BaseTextureCache[id];

  return texture;
};

/**
 * An empty texture, used often to not have to create multiple empty textures.
 *
 * @static
 * @constant
 */
Texture.EMPTY = new Texture(new BaseTexture());
