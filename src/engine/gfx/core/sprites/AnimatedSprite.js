const Sprite = require('./Sprite');
const { merge } = require('engine/utils/object');

/**
 * @class AnimationData
 */
class AnimationData {
  /**
   * @constructor
   * @constructor
   * @param {Array} frames    Frame data
   * @param {Object} [props]  Properties
   */
  constructor(frames, props) {
    /**
     * Is animation looping.
     * @property {Boolean} loop
     * @default true
    **/
    this.loop = true;
    /**
     * Play animation in random order.
     * @property {Boolean} random
     * @default false
     */
    this.random = false;
    /**
     * Play animation in reverse.
     * @property {Boolean} reverse
     * @default false
     */
    this.reverse = false;
    /**
     * Speed of animation (frames per second).
     * @property {Number} speed
     * @default 10
     */
    this.speed = 10;
    /**
     * Animation frame order.
     * @property {Array} frames
     */
    this.frames = frames;

    merge(this, props);
  }
}

/**
 * @class AnimatedSprite
 * @extends Sprite
 */
class AnimatedSprite extends Sprite {
  /**
   * @constructor
   * @param {Array} textures Textures this animation made up of
   */
  constructor(textures) {
    super(textures[0]);

    this.anims = {};
    this.currentAnim = 'default';
    this.currentFrame = 0;
    this.isPlaying = false;
    this.isFinished = false;

    this._finishEvtEmit = false;
    this._frameTime = 0;

    this.textures = textures;

    this.addAnim('default');
  }

  /**
   * Remove from parent
   * @method remove
   * @memberof AnimatedSprite#
   */
  remove() {
    this.off('finish');
    this.system.cancelAnimate(this);
    super.remove();
  }

  /**
   * Add new animation.
   * @method addAnim
   * @memberof AnimatedSprite#
   * @param {String} name     Name of the animation
   * @param {Array} [frames]  Frames list
   * @param {Object} [props]  Properties
   * @return {AnimatedSprite} Self for chaining
   */
  addAnim(name, frames, props) {
    if (!name) {
      return;
    }
    if (!frames) {
      frames = [];
      for (var i = 0; i < this.textures.length; i++) {
        frames.push(i);
      }
    }

    var anim = new AnimationData(frames, props);
    this.anims[name] = anim;
    return this;
  }

  /**
   * Play animation.
   * @method play
   * @memberof AnimatedSprite#
   * @param {String} name     Name of animation
   * @param {Number} [frame]  Frame index
   * @return {AnimatedSprite} Self for chaining
   */
  play(name, frame = 0) {
    name = name || this.currentAnim;
    var anim = this.anims[name];
    if (!anim) {
      return;
    }
    this.isPlaying = true;
    this._finishEvtEmit = false;
    this.isFinished = false;
    this.currentAnim = name;
    if (!Number.isFinite(frame) && anim.reverse) {
      frame = anim.frames.length - 1;
    }

    this.gotoFrame(frame);

    this.system.requestAnimate(this);

    return this;
  }

  /**
   * Stop animation.
   * @method stop
   * @memberof AnimatedSprite#
   * @param {Number} [frame]  Frame index
   * @return {AnimatedSprite} Self for chaining
   */
  stop(frame) {
    this.isPlaying = false;
    if (Number.isFinite(frame)) {
      this.gotoFrame(frame);
    }

    this.system.cancelAnimate(this);

    return this;
  }

  /**
   * Jump to specific frame.
   * @method gotoFrame
   * @memberof AnimatedSprite#
   * @param {Number} frame
   * @return {AnimatedSprite} Self for chaining
   */
  gotoFrame(frame) {
    var anim = this.anims[this.currentAnim];
    if (!anim) {
      return;
    }
    this.currentFrame = frame;
    this._frameTime = 0;
    this.texture = this.textures[anim.frames[frame]];
    return this;
  }

  /**
   * @memberof AnimatedSprite#
   * @method update
   * @memberof AnimatedSprite#
   * @private
   * @param {Number} delta Delta time since last frame.
   */
  update(delta) {
    var nextFrame;
    var anim = this.anims[this.currentAnim];

    if (this.isFinished) {
      if (!this._finishEvtEmit) {
        this.emit('finish', this.currentAnim);
      }

      return;
    }
    else if (this.isPlaying) {
      this._frameTime += anim.speed * delta;
    }

    if (this._frameTime > 1000) {
      this._frameTime -= 1000;

      if (anim.random && anim.frames.length > 1) {
        nextFrame = this.currentFrame;
        while (nextFrame === this.currentFrame) {
          nextFrame = Math.round(Math.random(0, anim.frames.length - 1));
        }

        this.currentFrame = nextFrame;
        this.texture = this.textures[anim.frames[nextFrame]];
        return;
      }

      nextFrame = this.currentFrame + (anim.reverse ? -1 : 1);

      if (nextFrame >= anim.frames.length) {
        if (anim.loop) {
          this.currentFrame = 0;
          this.texture = this.textures[anim.frames[0]];
        }
        else {
          this.isPlaying = false;
          this.isFinished = true;
          this._finishEvtEmit = false;
        }
      }
      else if (nextFrame < 0) {
        if (anim.loop) {
          this.currentFrame = anim.frames.length - 1;
          this.texture = this.textures[anim.frames.last()];
        }
        else {
          this.isPlaying = false;
          this.isFinished = true;
          this._finishEvtEmit = false;

          this.system.cancelAnimate(this);
        }
      }
      else {
        this.currentFrame = nextFrame;
        this.texture = this.textures[anim.frames[nextFrame]];
      }
    }
  }
}

module.exports = AnimatedSprite;
