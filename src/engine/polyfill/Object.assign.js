// References:
// https://github.com/sindresorhus/object-assign
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

if (!Object.assign)
{
    'use strict';
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;

    function ToObject(val) {
        if (val == null) {
            throw new TypeError('Object.assign cannot be called with null or undefined');
        }

        return Object(val);
    }

    function ownEnumerableKeys(obj) {
        var keys = Object.getOwnPropertyNames(obj);

        if (Object.getOwnPropertySymbols) {
            keys = keys.concat(Object.getOwnPropertySymbols(obj));
        }

        return keys.filter(function (key) {
            return propIsEnumerable.call(obj, key);
        });
    }

    Object.assign = function assign(target, source) {
        var from;
        var keys;
        var to = ToObject(target);

        for (var s = 1; s < arguments.length; s++) {
            from = arguments[s];
            keys = ownEnumerableKeys(Object(from));

            for (var i = 0; i < keys.length; i++) {
                to[keys[i]] = from[keys[i]];
            }
        }

        return to;
    };

}
