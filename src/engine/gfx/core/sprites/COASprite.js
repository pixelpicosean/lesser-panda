/**
 * Spriter plugin for LesserPanda engine
 * @version 0.3.0
 * @author Sean Bohan (pixelpicosean@gmail.com)
 *
 * Based on Spriter.js by:
 * - Jason Andersen jgandersen@gmail.com
 * - Isaac Burns isaacburns@gmail.com
 */

const Node = require('engine/gfx/core/Node');
const Sprite = require('engine/gfx/core/sprites/Sprite');
const { textureFromData } = require('engine/gfx/utils');

const loader = require('engine/loader');

const { baseUrl } = require('game/config');

/**
 * Spriter scon file loader and parser
 */
function atlasParser() {
  const parse = (key, scon, atlas) => {
    atlasParser[key] = new Data(scon, atlas);
    // console.log(`scon "${key}" is loaded`);
  };

  return function spriterLoader(res, next) {
    if (res.url.match(/\.scon$/)) {
      // Scon file already loaded
      if (atlasParser[res.name]) {
        return next();
      }

      const atlasName = res.url.slice(baseUrl.length + 1, -5);
      const scon = JSON.parse(res.data);

      // load the texture for the scon
      const loadOptions = {
        crossOrigin: res.crossOrigin,
        loadType: loader.Resource.LOAD_TYPE.XHR,
        parentResource: res,
      };
      this.add(`${atlasName}.json`, loadOptions, function(atlas) {
        parse(res.name, scon, atlas.textures);
      });
    }
    next();
  };
}
/**
 * Get the data object of a specific scon file asset key
 * @param  {String} sconKey Key of the scon file
 * @return {Data}   Data object created for the scon file
 */
function getData(sconKey) {
  return atlasParser[sconKey];
};
// Add parser as loader middleware
loader.use(atlasParser());

class Angle {
  constructor(rad = 0) {
    this.rad = rad;
  }

  get deg() {
    return this.rad * 180 / Math.PI;
  }
  set deg(value) {
    this.rad = value * Math.PI / 180;
  }

  get cos() {
    return Math.cos(this.rad);
  }

  get sin() {
    return Math.sin(this.rad);
  }

  /**
   * @return {Angle}
   */
  selfIdentity() {
    this.rad = 0.0;
    return this;
  }

  /**
   * @return {Angle}
   * @param {Angle} other
   */
  copy(other) {
    this.rad = other.rad;
    return this;
  }

  /**
   * @return {Angle}
   * @param {Angle} other
   * @param {Angle=} out
   */
  add(other, out) {
    return Angle.add(this, other, out);
  }

  /**
   * @return {Angle}
   * @param {Angle} other
   */
  selfAdd(other) {
    return Angle.add(this, other, this);
  }

  /**
   * @return {Angle}
   * @param {Angle} other
   * @param {number} pct
   * @param {number} spin
   * @param {Angle=} out
   */
  tween(other, pct, spin, out) {
    return Angle.tween(this, other, pct, spin, out);
  }

  /**
   * @return {Angle}
   * @param {Angle} other
   * @param {number} pct
   * @param {number} spin
   */
  selfTween(other, pct, spin) {
    return Angle.tween(this, other, pct, spin, this);
  }
}
/**
 * @return {Angle}
 * @param {Angle} a
 * @param {Angle} b
 * @param {Angle=} out
 */
Angle.add = function(a, b, out) {
  out = out || new Angle();
  out.rad = wrapAngleRadians(a.rad + b.rad);
  return out;
};
/**
 * @return {Angle}
 * @param {Angle} a
 * @param {Angle} b
 * @param {number} pct
 * @param {number} spin
 * @param {Angle=} out
 */
Angle.tween = function(a, b, pct, spin, out) {
  out = out || new Angle();
  out.rad = tweenAngleRadians(a.rad, b.rad, pct, spin);
  return out;
};

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Vector} other
   * @return {Vector}
   */
  copy(other) {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  /**
   * @param {Vector} other
   * @param {Vector=} out
   * @return {Vector}
   */
  add(other, out) {
    return Vector.add(this, other, out);
  }

  /**
   * @param {Vector} other
   * @return {Vector}
   */
  selfAdd(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  /**
   * @param {Vector} other
   * @param {number} pct
   * @param {Vector=} out
   * @return {Vector}
   */
  tween(other, pct, out) {
    return Vector.tween(this, other, pct, out);
  }

  /**
   * @param {Vector} other
   * @param {number} pct
   * @return {Vector}
   */
  selfTween(other, pct) {
    return Vector.tween(this, other, pct, this);
  }
}
/**
 * @param {Vector} a
 * @param {Vector} b
 * @param {Vector=} out
 * @return {Vector}
 */
Vector.add = function(a, b, out) {
  out = out || new Vector();
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
};
/**
 * @param {Vector} a
 * @param {Vector} b
 * @param {number} pct
 * @param {Vector=} out
 * @return {Vector}
 */
Vector.tween = function(a, b, pct, out) {
  out = out || new Vector();
  out.x = tween(a.x, b.x, pct);
  out.y = tween(a.y, b.y, pct);
  return out;
};

class Transform {
  constructor() {
    this.position = new Vector();
    this.rotation = new Angle();
    this.scale = new Vector(1, 1);
  }
  copy(other) {
    this.position.copy(other.position);
    this.rotation.copy(other.rotation);
    this.scale.copy(other.scale);
    return this;
  }
  load(json) {
    this.position.x = loadFloat(json, 'x', 0.0);
    this.position.y = loadFloat(json, 'y', 0.0);
    this.rotation.deg = loadFloat(json, 'angle', 0.0);
    this.scale.x = loadFloat(json, 'scale_x', 1.0);
    this.scale.y = loadFloat(json, 'scale_y', 1.0);
    return this;
  }
}
Transform.equal = function(a, b, epsilon = 1e-6) {
  if (Math.abs(a.position.x - b.position.x) > epsilon) {
    return false;
  }
  if (Math.abs(a.position.y - b.position.y) > epsilon) {
    return false;
  }
  if (Math.abs(a.rotation.rad - b.rotation.rad) > epsilon) {
    return false;
  }
  if (Math.abs(a.scale.x - b.scale.x) > epsilon) {
    return false;
  }
  if (Math.abs(a.scale.y - b.scale.y) > epsilon) {
    return false;
  }
  return true;
};
Transform.identity = function(out = new Transform()) {
  out.position.x = 0.0;
  out.position.y = 0.0;
  out.rotation.rad = 0.0;
  out.scale.x = 1.0;
  out.scale.y = 1.0;
  return out;
};
/**
 * @param {Transform} space
 * @param {number} x
 * @param {number} y
 * @return {Transform}
 */
Transform.translate = function(space, x, y) {
  x *= space.scale.x;
  y *= space.scale.y;
  let rad = space.rotation.rad;
  let c = Math.cos(rad);
  let s = Math.sin(rad);
  let tx = c * x - s * y;
  let ty = s * x + c * y;
  space.position.x += tx;
  space.position.y += ty;
  return space;
};

/**
 * @param {Transform} space
 * @param {number} rad
 * @return {Transform}
 */
Transform.rotate = function(space, rad) {
  space.rotation.rad = wrapAngleRadians(space.rotation.rad + rad);
  return space;
};

/**
 * @param {Transform} space
 * @param {number} x
 * @param {number} y
 * @return {Transform}
 */
Transform.scale = function(space, x, y) {
  space.scale.x *= x;
  space.scale.y *= y;
  return space;
};

/**
 * @param {Transform} space
 * @param {Transform=} out
 * @return {Transform}
 */
Transform.invert = function(space, out = new Transform()) {
  // invert
  // out.sca = space.sca.inv();
  // out.rot = space.rot.inv();
  // out.pos = space.pos.neg().rotate(space.rot.inv()).mul(space.sca.inv());

  let inv_scale_x = 1.0 / space.scale.x;
  let inv_scale_y = 1.0 / space.scale.y;
  let inv_rotation = -space.rotation.rad;
  let inv_x = -space.position.x;
  let inv_y = -space.position.y;
  out.scale.x = inv_scale_x;
  out.scale.y = inv_scale_y;
  out.rotation.rad = inv_rotation;
  let x = inv_x;
  let y = inv_y;
  let rad = inv_rotation;
  let c = Math.cos(rad);
  let s = Math.sin(rad);
  let tx = c * x - s * y;
  let ty = s * x + c * y;
  out.position.x = tx * inv_scale_x;
  out.position.y = ty * inv_scale_y;
  return out;
};

/**
 * @param {Transform} a
 * @param {Transform} b
 * @param {Transform=} out
 * @return {Transform}
 */
Transform.combine = function(a, b, out = new Transform()) {
  // combine
  // out.pos = b.pos.mul(a.sca).rotate(a.rot).add(a.pos);
  // out.rot = b.rot.mul(a.rot);
  // out.sca = b.sca.mul(a.sca);

  let x = b.position.x * a.scale.x;
  let y = b.position.y * a.scale.y;
  let rad = a.rotation.rad;
  let c = Math.cos(rad);
  let s = Math.sin(rad);
  let tx = c * x - s * y;
  let ty = s * x + c * y;
  out.position.x = tx + a.position.x;
  out.position.y = ty + a.position.y;
  if ((a.scale.x * a.scale.y) < 0.0) {
    out.rotation.rad = wrapAngleRadians(a.rotation.rad - b.rotation.rad);
  } else {
    out.rotation.rad = wrapAngleRadians(b.rotation.rad + a.rotation.rad);
  }
  out.scale.x = b.scale.x * a.scale.x;
  out.scale.y = b.scale.y * a.scale.y;
  return out;
};

/**
 * @param {Transform} ab
 * @param {Transform} a
 * @param {Transform=} out
 * @return {Transform}
 */
Transform.extract = function(ab, a, out = new Transform()) {
  // extract
  // out.sca = ab.sca.mul(a.sca.inv());
  // out.rot = ab.rot.mul(a.rot.inv());
  // out.pos = ab.pos.add(a.pos.neg()).rotate(a.rot.inv()).mul(a.sca.inv());

  out.scale.x = ab.scale.x / a.scale.x;
  out.scale.y = ab.scale.y / a.scale.y;
  if ((a.scale.x * a.scale.y) < 0.0) {
    out.rotation.rad = wrapAngleRadians(a.rotation.rad + ab.rotation.rad);
  } else {
    out.rotation.rad = wrapAngleRadians(ab.rotation.rad - a.rotation.rad);
  }
  let x = ab.position.x - a.position.x;
  let y = ab.position.y - a.position.y;
  let rad = -a.rotation.rad;
  let c = Math.cos(rad);
  let s = Math.sin(rad);
  let tx = c * x - s * y;
  let ty = s * x + c * y;
  out.position.x = tx / a.scale.x;
  out.position.y = ty / a.scale.y;
  return out;
};

/**
 * @param {Transform} space
 * @param {Vector} v
 * @param {Vector=} out
 * @return {Vector}
 */
Transform.transform = function(space, v, out = new Vector()) {
  let x = v.x * space.scale.x;
  let y = v.y * space.scale.y;
  let rad = space.rotation.rad;
  let c = Math.cos(rad);
  let s = Math.sin(rad);
  let tx = c * x - s * y;
  let ty = s * x + c * y;
  out.x = tx + space.position.x;
  out.y = ty + space.position.y;
  return out;
};

/**
 * @param {Transform} space
 * @param {Vector} v
 * @param {Vector=} out
 * @return {Vector}
 */
Transform.untransform = function(space, v, out = new Vector()) {
  let x = v.x - space.position.x;
  let y = v.y - space.position.y;
  let rad = -space.rotation.rad;
  let c = Math.cos(rad);
  let s = Math.sin(rad);
  let tx = c * x - s * y;
  let ty = s * x + c * y;
  out.x = tx / space.scale.x;
  out.y = ty / space.scale.y;
  return out;
};

/**
 * @param {Transform} a
 * @param {Transform} b
 * @param {number} tween
 * @param {number} spin
 * @param {Transform=} out
 * @return {Transform}
 */
Transform.tween = function(a, b, twn, spin, out) {
  out.position.x = tween(a.position.x, b.position.x, twn);
  out.position.y = tween(a.position.y, b.position.y, twn);
  out.rotation.rad = tweenAngleRadians(a.rotation.rad, b.rotation.rad, twn, spin);
  out.scale.x = tween(a.scale.x, b.scale.x, twn);
  out.scale.y = tween(a.scale.y, b.scale.y, twn);
  return out;
};

class Bone {
  constructor() {
    /** @type {number} */
    this.id = -1;
    /** @type {String} */
    this.type = 'bone';
    /** @type {number} */
    this.parentID = -1;
    /** @type {Transform} */
    this.localSpace = new Transform();
    /** @type {Transform} */
    this.worldSpace = new Transform();
  }

  load(json) {
    this.id = loadInt(json, 'id', -1);
    this.parentID = loadInt(json, 'parent', -1);

    this.localSpace.load(json);
    this.worldSpace.copy(this.localSpace);

    return this;
  }

  /**
   * @param {Bone} other
   * @return {Bone}
   */
  copy(other) {
    this.parentID = other.parentID;
    this.localSpace.copy(other.localSpace);
    this.worldSpace.copy(other.worldSpace);
    return this;
  }

  /**
   * @param {Bone} other
   * @param {number} tween
   * @param {number} spin
   * @return {void}
   */
  tween(other, tween, spin) {
    Transform.tween(this.localSpace, other.localSpace, tween, spin, this.localSpace);
  }
}

class BoneRef {
  constructor() {
    /** @type {number} */
    this.id = -1;
    /** @type {number} */
    this.parentID = -1;
    /** @type {number} */
    this.timelineID = -1;
    /** @type {number} */
    this.keyframeID = -1;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {BoneRef}
   */
  load(json) {
    this.id = loadInt(json, 'id', -1);
    this.parentID = loadInt(json, 'parent', -1);
    this.timelineID = loadInt(json, 'timeline', -1);
    this.keyframeID = loadInt(json, 'key', -1);
    return this;
  }

  /**
   * @param {BoneRef} other
   * @return {BoneRef}
   */
  copy(other) {
    this.id = other.id;
    this.parentID = other.parentID;
    this.timelineID = other.timelineID;
    this.keyframeID = other.keyframeID;
    return this;
  }
}

class SpriteObject {
  constructor() {
    /** @type {number} */
    this.id = -1;
    /** @type {String} */
    this.type = 'sprite';
    /** @type {number} */
    this.parentID = -1;
    /** @type {number} */
    this.folderID = -1;
    /** @type {number} */
    this.fileID = -1;
    /** @type {Transform} */
    this.localSpace = new Transform();
    /** @type {Transform} */
    this.worldSpace = new Transform();
    /** @type {boolean} */
    this.defaultPivot = false;
    /** @type {Vector} */
    this.pivot = new Vector(0, 1);
    /** @type {number} */
    this.zIndex = 0;
    /** @type {number} */
    this.alpha = 1;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {SpriteObject}
   */
  load(data, json) {
    this.id = loadInt(json, 'id', -1);
    this.parentID = loadInt(json, 'parent', -1);
    this.folderID = loadInt(json, 'folder', -1);
    this.fileID = loadInt(json, 'file', -1);
    this.localSpace.load(json);
    this.worldSpace.copy(this.localSpace);
    if ((typeof(json['pivot_x']) !== 'undefined') ||
      (typeof(json['pivot_y']) !== 'undefined')) {
      this.pivot.x = loadFloat(json, 'pivot_x', 0);
      this.pivot.y = loadFloat(json, 'pivot_y', 1);
    } else {
      this.defaultPivot = true;
      this.pivot.copy(data.getFilePivot(this.folderID, this.fileID));
    }
    this.zIndex = loadInt(json, 'zIndex', 0);
    this.alpha = loadFloat(json, 'a', 1);
    return this;
  }

  /**
   * @param {SpriteObject} other
   * @return {SpriteObject}
   */
  copy(other) {
    this.parentID = other.parentID;
    this.folderID = other.folderID;
    this.fileID = other.fileID;
    this.localSpace.copy(other.localSpace);
    this.worldSpace.copy(other.worldSpace);
    this.defaultPivot = other.defaultPivot;
    this.pivot.copy(other.pivot);
    this.zIndex = other.zIndex;
    this.alpha = other.alpha;
    return this;
  }

  /**
   * @param {SpriteObject} other
   * @param {number} twn
   * @param {number} spin
   */
  tween(other, twn, spin) {
    Transform.tween(this.localSpace, other.localSpace, twn, spin, this.localSpace);
    this.alpha = tween(this.alpha, other.alpha, twn);
  }
}

class ObjRef {
  constructor() {
    /** @type {number} */
    this.id = -1;
    /** @type {number} */
    this.parentID = -1;
    /** @type {number} */
    this.timelineID = -1;
    /** @type {number} */
    this.keyframeID = -1;
    /** @type {number} */
    this.zIndex = 0;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {ObjRef}
   */
  load(json) {
    this.id = loadInt(json, 'id', -1);
    this.parentID = loadInt(json, 'parent', -1);
    this.timelineID = loadInt(json, 'timeline', -1);
    this.keyframeID = loadInt(json, 'key', -1);
    this.zIndex = loadInt(json, 'zIndex', 0);
    return this;
  }

  /**
   * @param {ObjRef} other
   * @return {ObjRef}
   */
  copy(other) {
    this.id = other.id;
    this.parentID = other.parentID;
    this.timelineID = other.timelineID;
    this.keyframeID = other.keyframeID;
    this.zIndex = other.zIndex;
    return this;
  }
}

class BoxObject {
  constructor() {
    this.type = 'box';
    this.parentID = -1;
    this.localSpace = new Transform();
    this.worldSpace = new Transform();
    this.pivot = new Vector(0, 1);
  }

  /**
   * @param {Object.<string,?>} json
   * @return {BoxObject}
   */
  load(json) {
    this.parentID = loadInt(json, 'parent', -1);
    this.localSpace.load(json);
    this.worldSpace.copy(this.localSpace);
    this.pivot.x = loadFloat(json, 'pivot_x', 0);
    this.pivot.y = loadFloat(json, 'pivot_y', 1);
    return this;
  }

  /**
   * @param {BoxObject} other
   * @return {BoxObject}
   */
  copy(other) {
    this.parentID = other.parentID;
    this.localSpace.copy(other.localSpace);
    this.worldSpace.copy(other.worldSpace);
    this.pivot.copy(other.pivot);
    return this;
  }

  /**
   * @param {BoxObject} other
   * @param {number} tween
   * @param {number} spin
   */
  tween(other, twn, spin) {
    Transform.tween(this.localSpace, other.localSpace, twn, spin, this.localSpace);
  }
}

class PointObject {
  constructor() {
    this.type = 'point';
    this.parentID = -1;
    this.localSpace = new Transform();
    this.worldSpace = new Transform();
  }

  /**
   * @param {Object.<string,?>} json
   * @return {PointObject}
   */
  load(json) {
    this.parentID = loadInt(json, 'parent', -1);
    this.localSpace.load(json);
    this.worldSpace.copy(this.localSpace);
    return this;
  }

  /**
   * @param {PointObject} other
   * @return {PointObject}
   */
  copy(other) {
    this.parentID = other.parentID;
    this.localSpace.copy(other.localSpace);
    this.worldSpace.copy(other.worldSpace);
    return this;
  }

  /**
   * @param {PointObject} other
   * @param {number} tween
   * @param {number} spin
   */
  tween(other, twn, spin) {
    Transform.tween(this.localSpace, other.localSpace, twn, spin, this.localSpace);
  }
}

class Keyframe {
  constructor() {
    /** @type {number} */
    this.id = -1;
    /** @type {number} */
    this.time = 0;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {Keyframe}
   */
  load(json) {
    this.id = loadInt(json, 'id', -1);
    this.time = loadInt(json, 'time', 0);
    return this;
  }
}
/**
 * @param {Array.<Keyframe>} array
 * @param {number} time
 * @return {number}
 */
Keyframe.find = function(array, time) {
  if (array.length <= 0) {
    return -1;
  }
  if (time < array[0].time) {
    return -1;
  }
  let last = array.length - 1;
  if (time >= array[last].time) {
    return last;
  }
  let lo = 0;
  let hi = last;
  if (hi === 0) {
    return 0;
  }
  let current = hi >> 1;
  while (true) {
    if (array[current + 1].time <= time) {
      lo = current + 1;
    } else {
      hi = current;
    }
    if (lo === hi) {
      return lo;
    }
    current = (lo + hi) >> 1;
  }
}

/**
 * @param {Keyframe} a
 * @param {Keyframe} b
 * @return {number}
 */
Keyframe.compare = function(a, b) {
  return a.time - b.time;
};

class MainlineKeyframe extends Keyframe {
  constructor() {
    super();

    /** @type {Array.<Bone|BoneRef>} */
    this.bones = null;
    /** @type {Array.<Object|ObjRef>} */
    this.objects = null;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {MainlineKeyframe}
   */
  load(data, json) {
    super.load(json);

    let i, len;

    // combine bones and bone_refs into one array and sort by id
    this.bones = [];

    json.bone_ref = makeArray(json.bone_ref);
    for (i = 0, len = json.bone_ref.length; i < len; i++) {
      this.bones.push(new BoneRef().load(json.bone_ref[i]));
    }

    this.bones = this.bones.sort(function(a, b) {
      return a.id - b.id;
    });

    // combine objects and object_refs into one array and sort by id
    this.objects = [];

    json.object_ref = makeArray(json.object_ref);
    for (i = 0, len = json.object_ref.length; i < len; i++) {
      this.objects.push(new ObjRef().load(json.object_ref[i]));
    }

    this.objects = this.objects.sort(function(a, b) {
      return a.id - b.id;
    });

    return this;
  }
}

class Mainline {
  constructor() {
    /** @type {Array.<MainlineKeyframe>} */
    this.keyframes = [];
  }

  /**
   * @param {Object.<string,?>} json
   * @return {Mainline}
   */
  load(data, json) {
    json.key = makeArray(json.key);
    for (let i = 0, len = json.key.length; i < len; i++) {
      this.keyframes.push(new MainlineKeyframe().load(data, json.key[i]));
    }
    this.keyframes = this.keyframes.sort(Keyframe.compare);
    return this;
  }
}

class TimelineKeyframe extends Keyframe {
  constructor(type = 'unknown') {
    super();

    /** @type {string} */
    this.type = type;
    /** @type {number} */
    this.spin = 1; // 1: counter-clockwise, -1: clockwise
    /**
     * Curve types
     * value:
     *   0: instant
     *   1: linear
     *   2: quadratic
     *   3: cubic
     *   4: quartic
     *   5: quintic
     *   6: bezier
     * @type {number}
     */
    this.curve = 1;
    /** @type {number} */
    this.c1 = 0;
    /** @type {number} */
    this.c2 = 0;
    /** @type {number} */
    this.c3 = 0;
    /** @type {number} */
    this.c4 = 0;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {TimelineKeyframe}
   */
  load(json) {
    super.load(json);
    this.spin = loadInt(json, 'spin', 1);
    this.curve = loadInt(json, 'curve_type', 1);
    this.c1 = loadInt(json, 'c1', 0);
    this.c2 = loadInt(json, 'c2', 0);
    this.c3 = loadInt(json, 'c3', 0);
    this.c4 = loadInt(json, 'c4', 0);
    return this;
  }

  evaluateCurve(time, time1, time2) {
    if (time1 === time2) return 0;
    let t = (time - time1) / (time2 - time1);
    switch (this.curve) {
      // instant
      case 0:
        return 0;
      // linear
      case 1:
        return t;
      // quadratic
      case 2:
        return interpolateQuadratic(0.0, this.c1, 1.0, t);
      // cubic
      case 3:
        return interpolateCubic(0.0, this.c1, this.c2, 1.0, t);
      // quartic
      case 4:
        return interpolateQuartic(0.0, this.c1, this.c2, this.c3, 1.0, t);
      // quintic
      case 5:
        return interpolateQuintic(0.0, this.c1, this.c2, this.c3, this.c4, 1.0, t);
      // bezier
      case 6:
        return interpolateBezier(this.c1, this.c2, this.c3, this.c4, t);
    }
    return 0;
  }
}

class BoneTimelineKeyframe extends TimelineKeyframe {
  constructor() {
    super('bone');

    /** @type {Bone} */
    this.bone = null;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {TimelineKeyframe}
   */
  load(json) {
    super.load(json);
    this.bone = new Bone().load(json.bone || {});
    return this;
  }
}

class ObjectTimelineKeyframe extends TimelineKeyframe {
  constructor() {
    super('sprite');

    /** @type {Object} */
    this.object = null;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {TimelineKeyframe}
   */
  load(data, json) {
    super.load(json);
    this.object = new SpriteObject().load(data, json.object || {});
    return this;
  }
}

class BoxTimelineKeyframe extends TimelineKeyframe {
  constructor() {
    super('box');
    this.box = null;
  }
  load(json) {
    super.load(json);
    this.box = new BoxObject().load(json.object || {});
    return this;
  }
}

class PointTimelineKeyframe extends TimelineKeyframe {
  constructor() {
    super('point');
    this.point = null;
  }
  load(json) {
    super.load(json);
    this.point = new PointObject().load(json.object || {});
    return this;
  }
}

/**
 * @constructor
 */
class Timeline {
  constructor() {
    /** @type {number} */
    this.id = -1;
    /** @type {string} */
    this.name = '';
    /** @type {string} */
    this.type = 'sprite';
    /** @type {number} */
    this.index = -1;

    /** @type {Array.<TimelineKeyframe>} */
    this.keyframes = null;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {Timeline}
   */
  load(data, json) {
    let i, len;

    this.id = loadInt(json, 'id', -1);
    this.name = loadString(json, 'name', '');
    this.type = loadString(json, 'object_type', 'sprite');
    this.index = loadInt(json, 'obj', -1);

    this.keyframes = [];
    json.key = makeArray(json.key);
    switch (this.type) {
      case 'sprite':
        for (i = 0, len = json.key.length; i < len; i++) {
          this.keyframes.push(new ObjectTimelineKeyframe().load(data, json.key[i]));
        }
        break;
      case 'bone':
        for (i = 0, len = json.key.length; i < len; i++) {
          this.keyframes.push(new BoneTimelineKeyframe().load(json.key[i]));
        }
        break;
      case 'box':
        for (i = 0, len = json.key.length; i < len; i++) {
          this.keyframes.push(new BoxTimelineKeyframe().load(json.key[i]));
        }
        break;
      case 'point':
        for (i = 0, len = json.key.length; i < len; i++) {
          this.keyframes.push(new PointTimelineKeyframe().load(json.key[i]));
        }
        break;
      case 'sound':
      case 'entity':
      case 'variable':
      default:
        console.log('TODO: Timeline::load', this.type);
        break;
    }
    this.keyframes = this.keyframes.sort(Keyframe.compare);

    // TODO: meta

    return this;
  }
}

class EventlineKeyframe {
  constructor(json) {
    this.id = loadInt(json, 'id', -1);
    this.time = loadInt(json, 'time', 0);
  }
}

class Eventline {
  constructor(json) {
    this.id = loadInt(json, 'id', -1);
    this.name = loadString(json, 'name', '');
    this.keys = [];

    for (let i = 0, len = json.key.length; i < len; i++) {
      this.keys.push(new EventlineKeyframe(json.key[i]));
    }
    this.keys = this.keys.sort(Keyframe.compare);
  }
}

class VallineKeyframe {
  constructor(type, json) {
    this.id = loadInt(json, 'id', -1);
    this.time = loadInt(json, 'time', 0);
    switch (type) {
      case 'float':
        this.val = loadFloat(json, 'val', 0);
        break;
      case 'int':
        this.val = loadInt(json, 'val', 0);
        break;
      case 'string':
        this.val = loadString(json, 'val', '');
        break;
    }
  }
}

class Valline {
  constructor(varDefs, json) {
    this.id = loadInt(json, 'id', -1);
    this.def = loadInt(json, 'def', -1);
    this.name = varDefs[this.def].name;
    this.keys = [];

    let type = varDefs[this.def].type;

    for (let i = 0, len = json.key.length; i < len; i++) {
      this.keys.push(new VallineKeyframe(type, json.key[i]));
    }
    this.keys = this.keys.sort(Keyframe.compare);
  }
}

class TaglineKeyframe {
  constructor(tagDefs, json) {
    this.id = loadInt(json, 'id', -1);
    this.time = loadInt(json, 'time', 0);
    this.tags = [];
    let tag;
    for (let i = 0; i < json.tag.length; i++) {
      tag = json.tag[i];
      // { id, tagName }
      this.tags.push({
        id: tag.id,
        name: tagDefs[tag.t]
      });
    }
  }
}

class Tagline {
  constructor(tagDefs, json) {
    this.keys = [];

    for (let i = 0, len = json.key.length; i < len; i++) {
      this.keys.push(new TaglineKeyframe(tagDefs, json.key[i]));
    }
    this.keys = this.keys.sort(Keyframe.compare);
  }
}

class Animation {
  constructor(ent) {
    this.entity = ent;
    /** @type {number} */
    this.id = -1;
    /** @type {string} */
    this.name = '';
    /** @type {number} */
    this.length = 0;
    /** @type {string} */
    this.looping = 'true'; // 'true', 'false' or 'ping_pong'
    /** @type {number} */
    this.loopTo = 0;
    /** @type {Mainline} */
    this.mainline = null;
    /** @type {Array.<Timeline>} */
    this.timelines = null;
    /**
     * @type {Array.<Eventline>}
     * @optional
     */
    this.eventlines = null;
    /**
     * @type {Array.<Valline>}
     * @optional
     */
    this.vallines = null;
    /** @type {number} */
    this.minTime = 0;
    /** @type {number} */
    this.maxTime = 0;
  }

  /**
   * @param {Object.<string,?>} json
   * @return {Animation}
   */
  load(data, json) {
    this.id = loadInt(json, 'id', -1);
    this.name = loadString(json, 'name', '');
    this.length = loadInt(json, 'length', 0);
    this.looping = loadString(json, 'looping', 'true');
    this.loopTo = loadInt(json, 'loop_to', 0);

    json.mainline = json.mainline || {};
    this.mainline = new Mainline().load(data, json.mainline);

    let i, len;

    this.timelines = [];
    json.timeline = makeArray(json.timeline);
    for (i = 0, len = json.timeline.length; i < len; i++) {
      this.timelines.push(new Timeline().load(data, json.timeline[i]));
    }

    if (json.eventline) {
      this.eventlines = [];
      for (i = 0, len = json.eventline.length; i < len; i++) {
        this.eventlines.push(new Eventline(json.eventline[i]));
      }
    }

    if (json.meta) {
      // Value line
      if (json.meta.valline) {
        this.vallines = [];
        for (i = 0, len = json.meta.valline.length; i < len; i++) {
          this.vallines.push(new Valline(this.entity.indexedVars, json.meta.valline[i]));
        }
      }
      // Tag line
      if (json.meta.tagline) {
        this.tagline = new Tagline(data.tagMap, json.meta.tagline);
      }
    }

    this.minTime = 0;
    this.maxTime = this.length;

    return this;
  }
}

class Variable {
  constructor(json) {
    this.id = loadInt(json, 'id', -1);
    this.name = loadString(json, 'name', '');
    this.type = loadString(json, 'type', 'int');
    switch (this.type) {
      case 'float':
        this.default = loadFloat(json, 'default', 0);
        break;
      case 'int':
        this.default = loadInt(json, 'default', 0);
        break;
      case 'string':
        this.default = loadString(json, 'default', '');
        break;
    }
  }
}

class Entity {
  constructor(data, json) {
    /** @type {Number} */
    this.id = loadInt(json, 'id', -1);
    /** @type {String} */
    this.name = loadString(json, 'name', '');
    /** @type {Object.<string,Animation>} */
    this.anims = {};
    /** @type {Array.<string>} */
    this.animNames = [];
    /** @type {Object.<string,Variable>} */
    this.namedVars = {};
    /** @type {Object.<int,Variable>} */
    this.indexedVars = {};

    // Create variables
    json.var_defs = json.var_defs || [];
    for (let i = 0, len = json.var_defs.length; i < len; i++) {
      let variable = new Variable(json.var_defs[i]);
      this.namedVars[variable.name] = variable;
      this.indexedVars[variable.id] = variable;
    }

    // Create animations
    for (let i = 0, len = json.animation.length; i < len; i++) {
      let animation = new Animation(this).load(data, json.animation[i]);
      this.anims[animation.name] = animation;
      this.animNames.push(animation.name);
    }
  }
}

class COASprite extends Node {
  /**
   * COASprite(cutout animation sprite) is the represent of "entity" in Spriter
   * @param {String} sconKey    Which scon file to use for this animation
   * @param {String} entityName Name of the entity you want to create
   */
  constructor(sconKey, entityName) {
    super();
    this.scale.y = -1; // FIXME: inverse the transform instead of set y scale

    /** @type {Data} */
    this.data = getData(sconKey);
    /** @type {Entity} */
    this.entity = this.data.getEntity(entityName);

    /** @type {Array.<{tagID, tagName}>} Available tags */
    this.tags = [];

    /** @type {Object.<String, Object>} tagged variables */
    this.vars = {};

    // Create variables with default value
    let variable;
    for (let k in this.entity.namedVars) {
      variable = this.entity.namedVars[k];
      this.vars[variable.name] = variable.default;
    }

    /** @type {Array.<Bone>} */
    this.bones = [];
    /** @type {Array.<Object>} */
    this.objects = [];
    /** @type {string} */
    this.currAnimName = '';
    /** @type {number} */
    this.time = 0;
    /** @type {number} */
    this.elapsedTime = 0;

    /** @type {Boolean} Whether current animation is ended */
    this.isEnd = true;
    /** @type {Boolean} Whether stop instead of loop at the end of current animation */
    this.stopAtEnd = false;

    /** @type {boolean} */
    this.dirty = true;

    /** @type {Boolean} Whether this object is in the gfx updating list */
    this._willTick = false;

    /**
     * Stores all the sprite instances for this entity
     * @type {Sprite}
     * @private
     */
    this.sprites = {};
  }

  update(dt) {
    if (this.currAnimName !== '') {
      this.updateAnimation(dt);
    }
  }

  /**
   * Play an animation by its name
   * @param  {String} animName    Name of the animation
   * @param  {Boolean} stopAtEnd  Whether stop when animation is finished
   */
  play(animName, stopAtEnd) {
    this.stopAtEnd = !!stopAtEnd;
    this.isEnd = false;
    this.currAnimName = animName;

    let anim = this.currAnim();
    if (anim) {
      this.time = anim.minTime;
    }

    this.elapsedTime = 0;
    this.dirty = true;

    // Request updates
    if (!this._willTick) {
      this._willTick = true;
      this.system.requestAnimate(this);
    }
  }
  stop() {
    this.isEnd = true;

    // No more updates
    if (this._willTick) {
      this._willTick = false;
      this.system.cancelAnimate(this);
    }

    return this;
  }
  /**
   * Get current animation object
   * @return {Animation}
   */
  currAnim() {
    return this.entity.anims[this.currAnimName];
  }
  /**
   * Set time of current animation
   * @param {Number} time Time(ms)
   */
  setTime(time) {
    let anim = this.currAnim();
    if (anim) {
      if (time >= anim.maxTime) {
        if (this.stopAtEnd) {
          time = anim.maxTime;
          if (!this.isEnd) {
            // Mark as ended
            this.isEnd = true;
            // Remove from the updating list
            if (this._willTick) {
              this._willTick = false;
              this.system.cancelAnimate(this);
            }
            this.emit('finish', this.currAnimName);
          }
        }
        else {
          time = wrap(time, anim.minTime, anim.maxTime);
          this.emit('loop', this.currAnimName);
        }
      }
    }

    if (this.time !== time) {
      this.time = time;
      this.elapsedTime = 0;
      this.dirty = true;
    }
  }
  updateAnimation(elapsed) {
    // Update timer
    this.setTime(this.time + elapsed);

    // Update body parts
    if (!this.dirty) {
      return;
    }
    this.dirty = false;

    let anim = this.currAnim();

    let time = this.time;
    let elapsedTime = this.elapsedTime;
    this.elapsedTime = 0; // reset for next update

    let sprAnim = this;
    let i, len;

    if (anim) {
      let mainline_keyframe_array = anim.mainline.keyframes;
      let mainline_keyframe_index = Keyframe.find(mainline_keyframe_array, time);
      let mainline_keyframe = mainline_keyframe_array[mainline_keyframe_index];

      let timelines = anim.timelines;

      // Update bones
      let data_bone_array = mainline_keyframe.bones;
      let pose_bone_array = sprAnim.bones;

      let data_bone;
      for (i = 0, len = data_bone_array.length; i < len; i++) {
        data_bone = data_bone_array[i];
        let pose_bone = pose_bone_array[i] = (pose_bone_array[i] || new Bone());

        let timelineID = data_bone.timelineID;
        let keyframeID = data_bone.keyframeID;
        let timeline = timelines[timelineID];
        let timeline_keyframe_array = timeline.keyframes;
        let timeline_keyframe = timeline_keyframe_array[keyframeID];

        let time1 = timeline_keyframe.time;
        let bone1 = timeline_keyframe.bone;
        pose_bone.copy(bone1);
        pose_bone.parentID = data_bone.parentID; // set parent from bone_ref

        // see if there's something to tween with
        let keyframe_index2 = (keyframeID + 1) % timeline_keyframe_array.length;
        if (keyframeID !== keyframe_index2) {
          let timeline_keyframe2 = timeline_keyframe_array[keyframe_index2];
          let time2 = timeline_keyframe2.time;
          if (time2 < time1) {
            time2 = anim.length;
          }
          let bone2 = timeline_keyframe2.bone;

          let tween = timeline_keyframe.evaluateCurve(time, time1, time2);
          pose_bone.tween(bone2, tween, timeline_keyframe.spin);
        }
      };

      // Clamp output bone array
      pose_bone_array.length = data_bone_array.length;

      let bone;
      for (i = 0, len = pose_bone_array.length; i < len; i++) {
        bone = pose_bone_array[i];
        let parent_bone = pose_bone_array[bone.parentID];
        if (parent_bone) {
          Transform.combine(parent_bone.worldSpace, bone.localSpace, bone.worldSpace);
        } else {
          bone.worldSpace.copy(bone.localSpace);
        }
      };

      // Update objects
      let data_object_array = mainline_keyframe.objects;
      let pose_object_array = sprAnim.objects;

      let data_object;
      for (i = 0, len = data_object_array.length; i < len; i++) {
        data_object = data_object_array[i];
        let pose_object = pose_object_array[i] = (pose_object_array[i] || new SpriteObject());

        let timelineID = data_object.timelineID;
        let keyframeID = data_object.keyframeID;
        let timeline = timelines[timelineID];
        let timeline_keyframe_array = timeline.keyframes;
        let timeline_keyframe = timeline_keyframe_array[keyframeID];

        let time1 = timeline_keyframe.time;
        let object1 = timeline_keyframe.object;

        pose_object.copy(object1);
        pose_object.parentID = data_object.parentID; // set parent from object_ref

        // see if there's something to tween with
        let keyframe_index2 = (keyframeID + 1) % timeline_keyframe_array.length;
        if (keyframeID !== keyframe_index2) {
          let timeline_keyframe2 = timeline_keyframe_array[keyframe_index2];
          let time2 = timeline_keyframe2.time;
          if (time2 < time1) {
            time2 = anim.length;
          }
          let object2 = timeline_keyframe2.object;

          let tween = timeline_keyframe.evaluateCurve(time, time1, time2);
          pose_object.tween(object2, tween, timeline_keyframe.spin);
        }
      };

      // Clamp output object array
      pose_object_array.length = data_object_array.length;

      // Remove children, add them back later to ensure the
      // correct z-index
      for (i = 0, len = this.children.length; i < len; i++) {
        this.children[i].parent = null;
      }
      this.children.length = 0;

      // Update transform of objects
      let object;
      for (i = 0, len = pose_object_array.length; i < len; i++) {
        object = pose_object_array[i];
        let bone = pose_bone_array[object.parentID];
        if (bone) {
          Transform.combine(bone.worldSpace, object.localSpace, object.worldSpace);
        } else {
          object.worldSpace.copy(object.localSpace);
        }
        let texture = sprAnim.data.getFileTexture(object.folderID, object.fileID);
        let offset_x = (0.5 - object.pivot.x) * texture.width;
        let offset_y = (0.5 - object.pivot.y) * texture.height;
        Transform.translate(object.worldSpace, offset_x, offset_y);

        // TODO: update object transform
        let timelineID = data_object_array[i].timelineID;
        let timeline = timelines[timelineID];

        let sprites = sprAnim.sprites;
        let sprite = sprites[timeline.name];
        if (!sprite) {
          let obj = timeline.keyframes[0].object;
          sprite = new Sprite(sprAnim.data.getFileTexture(obj.folderID, obj.fileID));
          sprite.anchor.set(0.5, 0.5);
          sprite.name = timeline.name;
          sprites[timeline.name] = sprite;
        }
        // Apply transform
        let model = object.worldSpace;
        sprite.position.set(model.position.x, model.position.y);
        sprite.rotation = model.rotation.rad;
        sprite.scale.set(model.scale.x, -model.scale.y);
        sprite.alpha = object.alpha;

        sprite.parent = sprAnim;
        sprAnim.children.push(sprite);
      }

      // Update variables (valline)
      let vallines = anim.vallines;
      if (vallines) {
        let valline, j, jlen, valKey;
        for (i = 0, len = vallines.length; i < len; i++) {
          valline = vallines[i];
          for (j = 0, jlen = valline.keys.length; j < jlen; j++) {
            valKey = valline.keys[j];
            // This key is between last frame and this frame
            if (valKey.time <= time && valKey.time >= time - elapsed) {
              this.vars[valline.name] = valKey.val;
              this.emit('valline', valline.name, valKey.val);
            }
          }
        }
      }

      // Update tags (tagline)
      let tagline = anim.tagline;
      if (tagline) {
        let tag;
        for (i = 0, len = tagline.keys.length; i < len; i++) {
          tag = tagline.keys[i];
          // This key is between last frame and this frame
          if (tag.time <= time && tag.time >= time - elapsed) {
            this.tags = tag.tags;
            this.emit('tagline', tag.tags);
          }
        }
      }

      // Update events (eventlines)
      let eventlines = anim.eventlines;
      if (eventlines) {
        let eventline, j, jlen, event;
        for (i = 0, len = eventlines.length; i < len; i++) {
          eventline = eventlines[i];
          for (j = 0, jlen = eventline.keys.length; j < jlen; j++) {
            event = eventline.keys[j];
            // This key is between last frame and this frame
            if (event.time <= time && event.time >= time - elapsed) {
              this.emit('eventline', eventline.name);
            }
          }
        }
      }
    }
  }
}

class Data {
  /**
   * Data is the in memory structure that stores data of a scon file
   */
  constructor(scon, atlas) {
    /**
     * Scon data object
     * @type {Object}
     */
    this.scon = scon;

    this.atlas = atlas;
    /** @type {Array<Array<Texture>>} textures[folderID][fileID] */
    this.textures = [];

    /** @type {Object} entityName -> entity map */
    this.entityMap = {};
    /** @type {Array<String>} entity definiation names list */
    this.entityNames = [];

    /** @type {Object} tagID -> tagName */
    this.tagMap = {};

    /** Scon file version */
    this.sconVersion = loadString(scon, 'scon_version', '');
    /** Scon file generator application */
    this.generator = loadString(scon, 'generator', '');
    /** Scon file generator application version */
    this.generatorVersion = loadString(scon, 'generator_version', '');

    let i, len, j, jlen, folder, files, file, texture;
    // Fetch folder and file data
    for (i = 0, len = scon.folder.length; i < len; i++) {
      folder = scon.folder[i];
      files = [];

      for (j = 0, jlen = folder.file.length; j < jlen; j++) {
        file = folder.file[j];
        texture = atlas[file.name];
        texture.pivot = new Vector(file.pivot_x || 0, file.pivot_y || 1);
        files.push(texture);
      }

      this.textures.push(files);
    }

    // Construct tag map
    let tag;
    scon.tag_list = scon.tag_list || [];
    for (i = 0, len = scon.tag_list.length; i < len; i++) {
      tag = scon.tag_list[i];
      this.tagMap[tag.id] = tag.name;
    }

    // Construct entity data map
    let entityDef, entity;
    for (i = 0, len = scon.entity.length; i < len; i++) {
      entityDef = scon.entity[i];
      entity = new Entity(this, entityDef);
      this.entityMap[entityDef.name] = entity;
      this.entityNames.push(entityDef.name);
    }
  }

  getFilePivot(folderIdx, fileIdx) {
    return this.textures[folderIdx][fileIdx].pivot;
  };

  getFileTexture(folderIdx, fileIdx) {
    return this.textures[folderIdx][fileIdx];
  };

  /**
   * Get entity object
   * @param  {String} entityName Name of the entity
   * @return {Entity}
   */
  getEntity(entityName) {
    return this.entityMap[entityName];
  };

  /**
   * @return {Array.<string>}
   */
  getEntityKeys() {
    return this.entityNames;
  }
}

/**
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {number=} def
 * @return {number}
 */
function loadFloat(json, key, def) {
  let value = json[key];
  switch (typeof(value)) {
    case 'string':
      return parseFloat(value);
    case 'number':
      return value;
    default:
      return def || 0;
  }
}

/**
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {number=} def
 * @return {number}
 */
function loadInt(json, key, def) {
  let value = json[key];
  switch (typeof(value)) {
    case 'string':
      return parseInt(value, 10);
    case 'number':
      return 0 | value;
    default:
      return def || 0;
  }
}

/**
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {string=} def
 * @return {string}
 */
function loadString(json, key, def) {
  let value = json[key];
  switch (typeof(value)) {
    case 'string':
      return value;
    default:
      return def || '';
  }
}

/**
 * @param {*} value
 * @return {Array}
 */
function makeArray(value) {
  if ((typeof(value) === 'object') && (typeof(value.length) === 'number')) {
    return value;
  }
  if (typeof(value) !== 'undefined') {
    return [value];
  }
  return [];
}

/**
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function wrap(num, min, max) {
  if (min < max) {
    if (num < min) {
      return max - ((min - num) % (max - min));
    } else {
      return min + ((num - min) % (max - min));
    }
  }
  else if (min === max) {
    return min;
  }
  else {
    return num;
  }
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @return {number}
 */
function interpolateLinear(a, b, t) {
  return a + ((b - a) * t);
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} t
 * @return {number}
 */
function interpolateQuadratic(a, b, c, t) {
  return interpolateLinear(interpolateLinear(a, b, t), interpolateLinear(b, c, t), t);
}
/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} t
 * @return {number}
 */
function interpolateCubic(a, b, c, d, t) {
  return interpolateLinear(interpolateQuadratic(a, b, c, t), interpolateQuadratic(b, c, d, t), t);
}
/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} e
 * @param {number} t
 * @return {number}
 */
function interpolateQuartic(a, b, c, d, e, t) {
  return interpolateLinear(interpolateCubic(a, b, c, d, t), interpolateCubic(b, c, d, e, t), t);
}
/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} e
 * @param {number} f
 * @param {number} t
 * @return {number}
 */
function interpolateQuintic(a, b, c, d, e, f, t) {
  return interpolateLinear(interpolateQuartic(a, b, c, d, e, t), interpolateQuartic(b, c, d, e, f, t), t);
}
/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} t
 * @return {number}
 */
function interpolateBezier(x1, y1, x2, y2, t) {
  function SampleCurve(a, b, c, t) {
    return ((a * t + b) * t + c) * t;
  }

  function SampleCurveDerivativeX(ax, bx, cx, t) {
    return (3.0 * ax * t + 2.0 * bx) * t + cx;
  }

  function SolveEpsilon(duration) {
    return 1.0 / (200.0 * duration);
  }

  function Solve(ax, bx, cx, ay, by, cy, x, epsilon) {
    return SampleCurve(ay, by, cy, SolveCurveX(ax, bx, cx, x, epsilon));
  }

  function SolveCurveX(ax, bx, cx, x, epsilon) {
    let t0;
    let t1;
    let t2;
    let x2;
    let d2;
    let i;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {
      x2 = SampleCurve(ax, bx, cx, t2) - x;
      if (Math.abs(x2) < epsilon) return t2;

      d2 = SampleCurveDerivativeX(ax, bx, cx, t2);
      if (Math.abs(d2) < epsilon) break;

      t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;

    if (t2 < t0) return t0;
    if (t2 > t1) return t1;

    while (t0 < t1) {
      x2 = SampleCurve(ax, bx, cx, t2);
      if (Math.abs(x2 - x) < epsilon) return t2;
      if (x > x2) t0 = t2;
      else t1 = t2;
      t2 = (t1 - t0) * 0.5 + t0;
    }

    return t2; // Failure.
  }

  let duration = 1;
  let cx = 3.0 * x1;
  let bx = 3.0 * (x2 - x1) - cx;
  let ax = 1.0 - cx - bx;
  let cy = 3.0 * y1;
  let by = 3.0 * (y2 - y1) - cy;
  let ay = 1.0 - cy - by;

  return Solve(ax, bx, cx, ay, by, cy, t, SolveEpsilon(duration));
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @return {number}
 */
function tween(a, b, t) {
  return a + ((b - a) * t);
}

/**
 * @param {number} angle
 * @return {number}
 */
function wrapAngleRadians(angle) {
  if (angle <= 0) {
    return ((angle - Math.PI) % (2 * Math.PI)) + Math.PI;
  }
  else {
    return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
  }
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @param {number} spin
 * @return {number}
 */
function tweenAngleRadians(a, b, t, spin) {
  if (spin === 0) {
    return a;
  }
  else if (spin > 0) {
    if ((b - a) < 0) {
      b += 2 * Math.PI;
    }
  }
  else if (spin < 0) {
    if ((b - a) > 0) {
      b -= 2 * Math.PI;
    }
  }

  return wrapAngleRadians(a + (wrapAngleRadians(b - a) * t));
}

module.exports = COASprite;
