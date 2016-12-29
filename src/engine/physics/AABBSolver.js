const Vector = require('engine/Vector');
const { clamp } = require('engine/utils/math');
const { TOP, BOTTOM, LEFT, RIGHT, BOX, CIRC } = require('./const');

const Radian2Degree = 180 / Math.PI;

/**
 * AABB collision solver. This collision solver only supports
 * Box vs Box, Box vs Circle collisions.
 *
 * @class AABBSolver
 */
class AABBSolver {
  /**
   * @constructor
   */
  constructor() {
    this.resVecs = [
      new Vector(),
      new Vector(),
    ];
    this.res = Object.seal({
      angle: 0,
      angleInDegree: 0,

      set: function(angle) {
        this.angle = angle;
        this.angleInDegree = (angle * Radian2Degree) | 0;

        return this;
      },
    });
  }

  /**
   * Hit test a versus b.
   * @memberof AABBSolver#
   * @method hitTest
   * @param {Collider} a  First collider
   * @param {Collider} b  Second collider
   * @return {boolean} return true if bodies hit.
   */
  hitTest(a, b) {
    // Skip when shape is not available
    if (!a.shape || !b.shape) {return false;}

    if (a.shape.type === BOX && b.shape.type === BOX) {
      return !(
        a.bottom <= b.top ||
        a.top >= b.bottom ||
        a.left >= b.right ||
        a.right <= b.left
      );
    }

    if (a.shape.type === CIRC && b.shape.type === CIRC) {
      // AABB overlap
      if (!(
        a.bottom <= b.top ||
        a.top >= b.bottom ||
        a.left >= b.right ||
        a.right <= b.left)
      ) {
        return a.position.squaredDistance(b.position) < (a.shape.radius + b.shape.radius) * (a.shape.radius + b.shape.radius);
      }

      return false;
    }

    if ((a.shape.type === BOX && b.shape.type === CIRC) || (a.shape.type === CIRC && b.shape.type === BOX)) {
      let box = (a.shape.type === BOX) ? a : b;
      let circle = (a.shape.type === CIRC) ? a : b;

      // AABB overlap
      if (!(
        a.bottom <= b.top ||
        a.top >= b.bottom ||
        a.left >= b.right ||
        a.right <= b.left)
      ) {
        let distX = circle.position.x - clamp(circle.position.x, box.left, box.right);
        let distY = circle.position.y - clamp(circle.position.y, box.top, box.bottom);

        return (distX * distX + distY * distY) < (circle.shape.radius * circle.shape.radius);
      }
    }

    return false;
  }

  /**
   * Hit response a versus b.
   * @memberof AABBSolver#
   * @method hitResponse
   * @param {Collider} a    First collider
   * @param {Collider} b    Second collider
   * @param {boolean}  a2b  Whether first collider receives hit response
   * @param {boolean}  b2a  Whether second collider receives hit response
   */
  hitResponse(a, b, a2b, b2a) {
    let pushA = false, pushB = false, pushBox = false, pushCircle = false;
    let resA = this.resVecs[0].set(0), resB = this.resVecs[1].set(0);
    let angle, dist, overlapX, overlapY;

    if (a.shape.type === BOX && b.shape.type === BOX) {
      // a.bottom <-> b.top
      if (a.lastBottom <= b.lastTop) {
        pushA = (a2b && a.collide(b, BOTTOM));
        pushB = (b2a && b.collide(a, TOP));

        if (pushA && pushB) {
          resA.y = (b.top - a.bottom) * 0.5;
          resB.y = (a.bottom - b.top) * 0.5;
        }
        else if (pushA) {
          resA.y = (b.top - a.bottom);
        }
        else if (pushB) {
          resB.y = (a.bottom - b.top);
        }
      }
      // a.top <-> b.bottom
      else if (a.lastTop >= b.lastBottom) {
        pushA = (a2b && a.collide(b, TOP));
        pushB = (b2a && b.collide(a, BOTTOM));

        if (pushA && pushB) {
          resA.y = (b.bottom - a.top) * 0.5;
          resB.y = (a.top - b.bottom) * 0.5;
        }
        else if (pushA) {
          resA.y = (b.bottom - a.top);
        }
        else if (pushB) {
          resB.y = (a.top - b.bottom);
        }
      }
      else if (a.lastRight <= b.lastLeft) {
        pushA = (a2b && a.collide(b, RIGHT));
        pushB = (b2a && b.collide(a, LEFT));

        if (pushA && pushB) {
          resA.x = (b.left - a.right) * 0.5;
          resB.x = (a.right - b.left) * 0.5;
        }
        else if (pushA) {
          resA.x = (b.left - a.right);
        }
        else if (pushB) {
          resB.x = (a.right - b.left);
        }
      }
      else if (a.lastLeft >= b.lastRight) {
        pushA = (a2b && a.collide(b, LEFT));
        pushB = (b2a && b.collide(a, RIGHT));

        if (pushA && pushB) {
          resA.x = (b.right - a.left) * 0.5;
          resB.x = (a.left - b.right) * 0.5;
        }
        else if (pushA) {
          resA.x = (b.right - a.left);
        }
        else if (pushB) {
          resB.x = (a.left - b.right);
        }
      }
      // These 2 box have already overlapped with each other
      else {
        // Calculate the shortest overlap (x or y) and apply
        overlapX = (a.position.x < b.position.x) ? (a.right - b.left) : (a.left - b.right);
        overlapY = (a.position.y < b.position.y) ? (a.bottom - b.top) : (a.top - b.bottom);

        if (Math.abs(overlapX) > Math.abs(overlapY)) {
          pushA = (a2b && a.collide(b, overlapY> 0 ? BOTTOM : TOP));
          pushB = (b2a && b.collide(a, overlapY> 0 ? TOP : BOTTOM));

          if (pushA && pushB) {
            overlapY /= 2;

            resA.y = -overlapY;
            resB.y = +overlapY;
          }
          else if (pushA) {
            resA.y = -overlapY;
          }
          else if (pushB) {
            resB.y = +overlapY;
          }
        }
        else {
          pushA = (a2b && a.collide(b, overlapX> 0 ? RIGHT : LEFT));
          pushB = (b2a && b.collide(a, overlapX> 0 ? LEFT : RIGHT));

          if (pushA && pushB) {
            overlapY /= 2;

            resA.y = -overlapY;
            resB.y = +overlapY;
          }
          else if (pushA) {
            resA.y = -overlapY;
          }
          else if (pushB) {
            resB.y = +overlapY;
          }
        }
      }
    }
    else if (a.shape.type === CIRC && b.shape.type === CIRC) {
      angle = b.position.angle(a.position);
      dist = a.shape.radius + b.shape.radius;

      pushA = (a2b && a.collide(b, this.res.set(+angle)));
      pushB = (b2a && b.collide(a, this.res.set(-angle)));

      if (pushA && pushB) {
        resA.x = Math.cos(angle) * dist * 0.5;
        resA.y = Math.sin(angle) * dist * 0.5;
        resB.x = -resA.x;
        resB.y = -resA.y;
      }
      else if (pushA) {
        resA.x = Math.cos(angle) * dist;
        resA.y = Math.sin(angle) * dist;
      }
      else if (pushB) {
        resB.x = -Math.cos(angle) * dist;
        resB.y = -Math.sin(angle) * dist;
      }
    }
    else {
      let box, circle, box2circle, circle2box;
      if (a.shape.type === BOX && b.shape.type === CIRC) {
        box = a;
        circle = b;
        box2circle = a2b;
        circle2box = b2a;
      }
      else {
        box = b;
        circle = a;
        box2circle = b2a;
        circle2box = a2b;
      }
      let innerCount = 0;
      let closeX = circle.position.x;
      if (closeX < box.left) {
        closeX = box.left;
        innerCount += 1;
      }
      else if (closeX > box.right) {
        closeX = box.right;
        innerCount += 1;
      }
      let closeY = circle.position.y;
      if (closeY < box.top) {
        closeY = box.top;
        innerCount += 1;
      }
      else if (closeY > box.bottom) {
        closeY = box.bottom;
        innerCount += 1;
      }

      // A corner of the box is inside the circle
      if (innerCount === 2) {
        let radiusSq = circle.shape.radius * circle.shape.radius;
        overlapX = Math.sqrt(radiusSq - (closeY - circle.position.y) * (closeY - circle.position.y)) - Math.abs(closeX - circle.position.x);
        overlapY = Math.sqrt(radiusSq - (closeX - circle.position.x) * (closeX - circle.position.x)) - Math.abs(closeY - circle.position.y);
        overlapX = Math.max(0, overlapX);
        overlapY = Math.max(0, overlapY);

        angle = Math.atan2(b.velocity.y - a.velocity.y, b.velocity.x - a.velocity.x);

        pushA = (a2b && a.collide(b, this.res.set(-angle)));
        pushB = (b2a && b.collide(a, this.res.set(+angle)));

        if (pushA && pushB) {
          resA.x = overlapX * Math.cos(angle) * 0.5;
          resA.y = overlapY * Math.sin(angle) * 0.5;
          resB.x = -resA.x;
          resB.y = -resA.y;
        }
        else if (pushA) {
          resA.x = overlapX * Math.cos(angle);
          resA.y = overlapY * Math.sin(angle);
        }
        else if (pushB) {
          resB.x = -overlapX * Math.cos(angle);
          resB.y = -overlapY * Math.sin(angle);
        }
      }
      else {
        if (closeX === box.left) {
          overlapX = (circle.position.x + circle.shape.radius) - box.left;

          pushBox = (box2circle && box.collide(circle, LEFT));
          pushCircle = (circle2box && circle.collide(box, RIGHT));

          if (pushBox && pushCircle) {
            resA.x = overlapX * 0.5;
            resB.x = -resA.x;
          }
          else if (pushBox) {
            resA.x = overlapX;
          }
          else if (pushCircle) {
            resB.x = -overlapX;
          }
        }
        else if (closeX === box.right) {
          overlapX = box.right - (circle.position.x - circle.shape.radius);

          pushBox = (box2circle && box.collide(circle, RIGHT));
          pushCircle = (circle2box && circle.collide(box, LEFT));

          if (pushBox && pushCircle) {
            resA.x = -overlapX * 0.5;
            resB.x = -resA.x;
          }
          else if (pushBox) {
            resA.x = -overlapX;
          }
          else if (pushCircle) {
            resB.x = +overlapX;
          }
        }
        else if (closeY === box.top) {
          overlapY = (circle.position.y + circle.shape.radius) - box.top;

          pushBox = (box2circle && box.collide(circle, TOP));
          pushCircle = (circle2box && circle.collide(box, BOTTOM));

          if (pushBox && pushCircle) {
            resA.y = overlapY * 0.5;
            resB.y = -resA.y;
          }
          else if (pushBox) {
            resA.y = overlapY;
          }
          else if (pushCircle) {
            resB.y = -overlapY;
          }
        }
        else if (closeY === box.bottom) {
          overlapY = box.bottom - (circle.position.y - circle.shape.radius);

          pushBox = (box2circle && box.collide(circle, BOTTOM));
          pushCircle = (circle2box && circle.collide(box, TOP));

          if (pushBox && pushCircle) {
            resA.y = overlapY * 0.5;
            resB.y = -resA.y;
          }
          else if (pushBox) {
            resA.y = overlapY;
          }
          else if (pushCircle) {
            resB.y = -overlapY;
          }
        }

        box.position.x += resA.x;
        box.position.y += resA.y;
        circle.position.x += resB.x;
        circle.position.y += resB.y;

        resA.set(0);
        resB.set(0);
      }
    }

    // Apply response to colliders
    a.position.x += resA.x;
    a.position.y += resA.y;
    b.position.x += resB.x;
    b.position.y += resB.y;
  }
}

/**
 * AABBSolver factory
 * @return {AABBSolver} solver instance.
 */
module.exports = function() {
  return new AABBSolver();
};
