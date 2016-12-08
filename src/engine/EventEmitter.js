/**
 * Representation of a single EventEmitter function.
 * @private
 */
class EE {
  /**
   * @param {function} fn Event handler to be called.
   * @param {Mixed} context Context for function execution.
   * @param {boolean} once Only emit once
   * @private
   */
  constructor(fn, context, once = false) {
    this.fn = fn;
    this.context = context;
    this.once = once;
  }
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @class EventEmitter
 */
class EventEmitter {
  /**
   * @constructor
   */
  constructor() {
    /**
     * Holds the assigned EventEmitters by name.
     *
     * @type {object}
     * @private
     */
    this._events = undefined;
  }

  /**
   * Return a list of assigned event listeners.
   *
   * @memberof EventEmitter#
   * @method listeners
   * @param {string} event The events that should be listed.
   * @param {boolean} exists We only need to know if there are listeners.
   * @returns {array|boolean} Listener list
   */
  listeners(event, exists) {
    let available = this._events && this._events[event];

    if (exists) {return !!available;}
    if (!available) {return [];}
    if (available.fn) {return [available.fn];}

    let i, l, ee;
    for (i = 0, l = available.length, ee = new Array(l); i < l; i++) {
      ee[i] = available[i].fn;
    }

    return ee;
  }

  /**
   * Emit an event to all registered event listeners.
   *
   * @memberof EventEmitter#
   * @method emit
   * @param {string} event  The name of the event.
   * @param {*} a1          First param
   * @param {*} a2          Second param
   * @param {*} a3          Third param
   * @param {*} a4          Forth param
   * @param {*} a5          Fifth param
   * @returns {boolean} Indication if we've emitted an event.
   */
  emit(event, a1, a2, a3, a4, a5) {
    if (!this._events || !this._events[event]) {return false;}

    let listeners = this._events[event],
      len = arguments.length, args, i;

    if ('function' === typeof listeners.fn) {
      if (listeners.once) {this.removeListener(event, listeners.fn, undefined, true);}

      switch (len) {
        case 1: return listeners.fn.call(listeners.context), true;
        case 2: return listeners.fn.call(listeners.context, a1), true;
        case 3: return listeners.fn.call(listeners.context, a1, a2), true;
        case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }

      for (i = 1, args = new Array(len - 1); i < len; i++) {
        args[i - 1] = arguments[i];
      }

      listeners.fn.apply(listeners.context, args);
    }
    else {
      let length = listeners.length, j;

      for (i = 0; i < length; i++) {
        if (listeners[i].once) {this.removeListener(event, listeners[i].fn, undefined, true);}

        switch (len) {
          case 1: listeners[i].fn.call(listeners[i].context); break;
          case 2: listeners[i].fn.call(listeners[i].context, a1); break;
          case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
          default:
            if (!args) {
              for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }}

            listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }

    return true;
  }

  /**
   * Register a new EventListener for the given event.
   *
   * @memberof EventEmitter#
   * @method on
   * @param {string} event Name of the event.
   * @param {functon} fn Callback function.
   * @param {Mixed} context The context of the function.
   * @return {EventEmitter} Self for chaining
   */
  on(event, fn, context) {
    var listener = new EE(fn, context || this);

    if (!this._events) {this._events = Object.create(null);}
    if (!this._events[event]) {this._events[event] = listener;}
    else {
      if (!this._events[event].fn) {this._events[event].push(listener);}
      else {
        this._events[event] = [
          this._events[event], listener,
        ];}
    }

    return this;
  }

  /**
   * Add an EventListener that's only called once.
   *
   * @memberof EventEmitter#
   * @method once
   * @param {string} event Name of the event.
   * @param {function} fn Callback function.
   * @param {Mixed} context The context of the function.
   * @return {EventEmitter} Self for chaining
   */
  once(event, fn, context) {
    let listener = new EE(fn, context || this, true);

    if (!this._events) {this._events = Object.create(null);}
    if (!this._events[event]) {this._events[event] = listener;}
    else {
      if (!this._events[event].fn) {this._events[event].push(listener);}
      else {
        this._events[event] = [
          this._events[event], listener,
        ];}
    }

    return this;
  }

  /**
   * Remove event listeners.
   *
   * @memberof EventEmitter#
   * @method removeListener
   * @param {string} event The event we want to remove.
   * @param {function} fn The listener that we need to find.
   * @param {Mixed} context Only remove listeners matching this context.
   * @param {boolean} once Only remove once listeners.
   * @return {EventEmitter} Self for chaining
   */
  removeListener(event, fn, context, once) {
    if (!this._events || !this._events[event]) {return this;}

    let listeners = this._events[event], events = [];

    if (fn) {
      if (listeners.fn) {
        if (
             listeners.fn !== fn
          || (once && !listeners.once)
          || (context && listeners.context !== context)
        ) {
          events.push(listeners);
        }
      }
      else {
        for (let i = 0, length = listeners.length; i < length; i++) {
          if (
               listeners[i].fn !== fn
            || (once && !listeners[i].once)
            || (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) {
      this._events[event] = events.length === 1 ? events[0] : events;
    }
    else {
      delete this._events[event];
    }

    return this;
  }

  /**
   * Remove all listeners or only the listeners for the specified event.
   *
   * @memberof EventEmitter#
   * @method removeAllListeners
   * @param {string} event The event want to remove all listeners for.
   * @return {EventEmitter} Self for chaining
   */
  removeAllListeners(event) {
    if (!this._events) {return this;}

    if (event) {delete this._events[event];}
    else {this._events = Object.create(null);}

    return this;
  }
}
/**
 * @method off
 * @memberof EventEmitter#
 * @alias EventEmitter#removeListener
 */
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
/**
 * @method addListener
 * @memberof EventEmitter#
 * @alias EventEmitter#on
 */
EventEmitter.prototype.addListener = EventEmitter.prototype.on;


/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @exports engine/EventEmitter
 * @see EventEmitter
 */
module.exports = EventEmitter;
