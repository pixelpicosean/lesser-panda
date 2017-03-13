/**
 * @class Clock
 */
export default class Clock {
  /**
   * @property {number} elapsed   Time elapsed since start.
   * @readonly
   */
  get elapsed() { return this.duration - this._count; }

  /**
   * @property {number} left  Time left till the end.
   * @readonly
   */
  get left() { return this._count; }

  /**
   * Clock constructor should not be used directly, use the static methods instead:
   *
   * @constructor
   * @param {number} [ms] Time
   */
  constructor(ms) {
    /**
     * @type {number}
     * @private
     */
    this._count = 0;

    /**
     * Duration of this timer.
     * @type {number}
     * @default 0
     */
    this.duration = 0;

    /**
     * Whether this timer should repeat.
     * @type {boolean}
     * @default false
     */
    this.repeat = false;

    /**
     * Whether this timer is already removed.
     * @type {boolean}
     * @protected
     * @default false
     */
    this.removed = false;

    /**
     * Callback
     * @type {function}
     * @private
     */
    this.callback = null;
    /**
     * Callback context
     * @type {object}
     * @private
     */
    this.callbackCtx = null;

    this.set(ms);
  }

  /**
   * Set duration for timer.
   * @method set
   * @memberof Clock#
   * @param {number} ms Time to set to
   * @return {Clock} Self for chaining
   */
  set(ms) {
    if (Number.isFinite(ms)) {
      this.duration = ms;
    }
    else {
      this.duration = 0;
    }
    return this.reset();
  }

  /**
   * Reset timer to current duration.
   * @method reset
   * @memberof Clock#
   * @return {Clock} Self for chaining
   */
  reset() {
    this.removed = false;
    this._count = this.duration;
    return this;
  }

  /**
   * Pause timer.
   * @method pause
   * @memberof Clock#
   * @return {Clock} Self for chaining
   */
  pause() {
    this.paused = true;
    return this;
  }

  /**
   * Resume paused timer.
   * @method resume
   * @memberof Clock#
   * @return {Clock} Self for chaining
   */
  resume() {
    this.paused = false;
    return this;
  }

  /**
   * Update method that is called by timer system.
   * @method update
   * @memberof Clock#
   * @protected
   * @param  {number} delta Delta time
   */
  update(delta) {
    if (this.removed || this.paused) {return;}

    this._count -= delta;
    if (this._count < 0) {
      this._count = 0;

      if (typeof this.callback === 'function') {
        this.callback.call(this.callbackCtx);
      }

      if (this.repeat && !this.removed) {
        this.reset();
      }
      else {
        this.removed = true;
      }
    }
  }
}
