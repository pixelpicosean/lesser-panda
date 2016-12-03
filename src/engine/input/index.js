const System = require('engine/system');
const keyboard = require('./keyboard');
const { removeItems } = require('engine/utils/array');

/**
 * Input system which provides key bindings.
 * @class SystemInput
 */
class SystemInput extends System {
  /**
   * @constructor
   */
  constructor() {
    super();

    this.name = 'Input';

    this.bindings = {};
    this.keyList = [];
    this.actions = {};
    this.lastPressed = {};
    this.lastReleased = {};
  }

  /**
   * Bind a key to a specific action.
   * @memberof SystemInput#
   * @method bind
   * @param  {String} key    Key to bind
   * @param  {String} action Action name
   * @return {SystemInput}   Self for chaining
   */
  bind(key, action) {
    if (Array.isArray(this.bindings[key])) {
      this.bindings[key].push(action);
    }
    else {
      this.bindings[key] = [action];
    }

    if (this.keyList.indexOf(key) < 0) {
      this.keyList.push(key);
    }

    this.lastPressed[action] = false;
    this.lastReleased[action] = false;

    return this;
  }
  /**
   * Unbind an action from a key.
   * @memberof SystemInput#
   * @method unbind
   * @param  {String} key    Key to unbind
   * @param  {String} action Action to unbind
   * @return {SystemInput}   Self for chaining
   */
  unbind(key, action) {
    if (Array.isArray(this.bindings[key])) {
      let idx = this.bindings[key].indexOf(action);
      if (idx >= 0) {
        removeItems(this.bindings[key], idx, 1);
      }

      delete this.lastPressed[action];
      delete this.lastReleased[action];
    }

    return this;
  }
  /**
   * Unbind all the actions.
   * @memberof SystemInput#
   * @method unbindAll
   */
  unbindAll() {
    for (let k in this.bindings) {
      if (Array.isArray(this.bindings[k])) {
        this.bindings[k].length = 0;
      }
    }

    this.lastPressed = {};
    this.lastReleased = {};
  }

  /**
   * Whether an action is currently pressed.
   * @memberof SystemInput#
   * @method state
   * @param  {String} action Action name
   * @return {Boolean}       Pressed or not
   */
  state(action) {
    return !!this.actions[action];
  }
  /**
   * Whether an action is just pressed.
   * @memberof SystemInput#
   * @method pressed
   * @param  {String} action Action name
   * @return {Boolean}       Pressed or not
   */
  pressed(action) {
    return !!this.lastPressed[action];
  }
  /**
   * Whether an action is just released.
   * @memberof SystemInput#
   * @method released
   * @param  {String} action Action name
   * @return {Boolean}       Released or not
   */
  released(action) {
    return !!this.lastReleased[action];
  }

  /**
   * Awake callback.
   * @memberof SystemInput#
   * @method awake
   * @private
   */
  awake() {
    keyboard.on('keydown', this.keydown, this);
    keyboard.on('keyup', this.keyup, this);

    this.resetFlags();
  }
  /**
   * Fixed update callback.
   * @memberof SystemInput#
   * @method fixedUpdate
   * @private
   */
  fixedUpdate() {
    // Mark press/release action as false
    this.resetFlags();
  }
  /**
   * Freeze callback.
   * @memberof SystemInput#
   * @method freeze
   * @private
   */
  freeze() {
    keyboard.off('keydown', this.keydown, this);
    keyboard.off('keyup', this.keyup, this);

    this.resetFlags();
  }

  /**
   * Key down listener
   * @memberof SystemInput#
   * @method keydown
   * @param {String} k Name of the key
   * @private
   */
  keydown(k) {
    if (this.keyList.indexOf(k) !== -1) {
      let i, list = this.bindings[k];
      for (i = 0; i < list.length; i++) {
        this.actions[list[i]] = true;
        this.lastPressed[list[i]] = true;
      }
    }
  }
  /**
   * Key up listener
   * @memberof SystemInput#
   * @method keyup
   * @param {String} k Name of the key
   * @private
   */
  keyup(k) {
    if (this.keyList.indexOf(k) !== -1) {
      let i, list = this.bindings[k];
      for (i = 0; i < list.length; i++) {
        this.actions[list[i]] = false;
        this.lastReleased[list[i]] = true;
      }
    }
  }
  /**
   * Reset press and release flags.
   * @memberof SystemInput#
   * @method resetFlags
   * @private
   */
  resetFlags() {
    let k;
    for (k in this.lastPressed) {
      this.lastPressed[k] = false;
    }
    for (k in this.lastReleased) {
      this.lastReleased[k] = false;
    }
  }
}

module.exports = SystemInput;
