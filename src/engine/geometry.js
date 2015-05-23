game.module(
    'engine.geometry'
)
.body(function() { 'use strict';

/**
    Vector class.
    @class Vector
    @extends game.Class
    @constructor
    @param {Number} [x]
    @param {Number} [y]
**/
game.createClass('Vector', {
    x: 0,
    y: 0,

    init: function(x, y) {
        if (typeof x === 'number') this.x = x;
        if (typeof y === 'number') this.y = y;
    },

    /**
        Set vector values.
        @method set
        @param {Number} x
        @param {Number} y
        @return {game.Vector}
    **/
    set: function(x, y) {
        this.x = x;
        this.y = y;
        return this;
    },

    /**
        Clone vector.
        @method clone
        @return {game.Vector}
    **/
    clone: function() {
        return new game.Vector(this.x, this.y);
    },

    /**
        Copy values from another vector.
        @method copy
        @param {game.Vector} v
        @return {game.Vector}
    **/
    copy: function(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    },

    /**
        Add to vector values.
        @method add
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    add: function(x, y) {
        this.x += x instanceof game.Vector ? x.x : x;
        this.y += x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Subtract from vector values.
        @method subtract
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    subtract: function(x, y) {
        this.x -= x instanceof game.Vector ? x.x : x;
        this.y -= x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Multiply vector values.
        @method multiply
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    multiply: function(x, y) {
        this.x *= x instanceof game.Vector ? x.x : x;
        this.y *= x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Multiply and add vector values.
        @method multiplyAdd
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    multiplyAdd: function(x, y) {
        this.x += x instanceof game.Vector ? x.x * y : x * y;
        this.y += x instanceof game.Vector ? x.y * y : x * y;
        return this;
    },

    /**
        Divide vector values.
        @method divide
        @param {Number|game.Vector} x
        @param {Number} [y]
        @return {game.Vector}
    **/
    divide: function(x, y) {
        this.x /= x instanceof game.Vector ? x.x : x;
        this.y /= x instanceof game.Vector ? x.y : (y || ((y !== 0) ? x : 0));
        return this;
    },

    /**
        Get distance of two vectors.
        @method distance
        @param {game.Vector} vector
        @return {Number}
    **/
    distance: function(vector) {
        var x = vector.x - this.x;
        var y = vector.y - this.y;
        return Math.sqrt(x * x + y * y);
    },

    /**
        Get length of vector.
        @method length
        @return {Number}
    **/
    length: function() {
        return Math.sqrt(this.dot());
    },

    /**
        Get dot of vector.
        @method dot
        @param {game.Vector} [vector]
        @return {Number}
    **/
    dot: function(vector) {
        if (vector instanceof game.Vector) return this.x * vector.x + this.y * vector.y;
        else return this.x * this.x + this.y * this.y;
    },

    /**
        Get normalized dot of vector.
        @method dotNormalized
        @param {game.Vector} [vector]
        @return {Number}
    **/
    dotNormalized: function(vector) {
        var len1 = this.length();
        var x1 = this.x / len1;
        var y1 = this.y / len1;

        if (vector instanceof game.Vector) {
            var len2 = vector.length();
            var x2 = vector.x / len2;
            var y2 = vector.y / len2;
            return x1 * x2 + y1 * y2;
        }
        else return x1 * x1 + y1 * y1;
    },

    /**
        Rotate vector in radians.
        @method rotate
        @param {Number} angle
        @return {game.Vector}
    **/
    rotate: function(angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var x = this.x * c - this.y * s;
        var y = this.y * c + this.x * s;
        this.x = x;
        this.y = y;
        return this;
    },

    /**
        Normalize vector.
        @method normalize
        @return {game.Vector}
    **/
    normalize: function() {
        var len = this.length();
        this.x /= len || 1;
        this.y /= len || 1;
        return this;
    },

    /**
        Limit vector values.
        @method limit
        @param {game.Vector} vector
        @return {game.Vector}
    **/
    limit: function(vector) {
        this.x = this.x.limit(-vector.x, vector.x);
        this.y = this.y.limit(-vector.y, vector.y);
        return this;
    },

    /**
        Get angle vector angle or angle between two vectors.
        @method angle
        @param {Vector} [vector]
        @return {Number}
    **/
    angle: function(vector) {
        if (vector) {
            return Math.atan2(vector.y - this.y, vector.x - this.x);
        }
        else {
            return Math.atan2(this.y, this.x);
        }
    },

    /**
        Get angle between two vectors from origin.
        @method angleFromOrigin
        @param {game.Vector} vector
        @return {Number}
    **/
    angleFromOrigin: function(vector) {
        return Math.atan2(vector.y, vector.x) - Math.atan2(this.y, this.x);
    },

    /**
        Round vector values.
        @method round
        @return {game.Vector}
    **/
    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
});

});
