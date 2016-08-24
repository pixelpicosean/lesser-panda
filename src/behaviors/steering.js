/**
 * Steering.
 */

import Behavior from 'engine/behavior';
import Vector from 'engine/vector';
import rnd from 'engine/rnd';
import { clamp } from 'engine/utils';

const VELOCITY_ESP = 0.001;
const VELOCITY_ESP_SQ = VELOCITY_ESP * VELOCITY_ESP;

export default class Steering extends Behavior {
  static TYPE = 'Steering';

  static DEFAULT_SETTINGS = {
    maxSpeed: 100,

    // Flee
    panicDistance: 100,

    // Wander
    wanderJitter: 100,
    wanderRadius: 100,
    wanderDistance: 10,
  };

  awake() {
    // Init variables
    this.force = Vector.create();
    this.wanderTarget = Vector.create();

    this.heading = Vector.create(1, 0);
    this.side = this.heading.clone().perp();

    this.panicDistanceSq = this.panicDistance * this.panicDistance;
  }

  update(_, dt) {
    // Update heading and side
    if (this.actor.body.velocity.squaredLength() > VELOCITY_ESP_SQ) {
      this.heading.copy(this.actor.body.velocity).normalize();
      this.side.copy(this.heading).perp();
    }
  }

  // Actions
  seek(targetPos) {
    let desiredVel = targetPos.clone()
      .subtract(this.actor.position)
      .normalize()
      .multiply(this.maxSpeed);

    return desiredVel.subtract(this.actor.body.velocity);
  }
  flee(targetPos) {
    // Do nothing when distance is large enough
    if (this.actor.position.squaredDistance(targetPos) > this.panicDistanceSq) {
      return Vector.create();
    }

    let desiredVel = this.actor.position.clone()
      .subtract(targetPos)
      .normalize()
      .multiply(this.maxSpeed);

    return desiredVel.subtract(this.actor.body.velocity);
  }
  arrive(targetPos, deceleration) {
    let toTarget = targetPos.clone().subtract(this.actor.position);
    let dist = toTarget.length();

    // Distance is larger than minimal distance
    if (dist > 4) {
      let speed = dist / (deceleration * 0.3);
      speed = Math.min(speed, this.maxSpeed);

      let desiredVel = toTarget.multiply(speed).divide(dist);

      return desiredVel.subtract(this.actor.body.velocity);
    }
    else {
      return toTarget.set(0);
    }
  }
  pursuit(evader) {
    let toEvader = evader.position.clone().subtract(this.actor.position);

    let selfHeading = this.actor.body.velocity.clone().normalize();
    let evaderHeading = evader.body.velocity.clone().normalize();

    let relativeHeading = selfHeading
      .dot(evaderHeading);

    if (toEvader.dot(selfHeading) > 0 && relativeHeading < -0.95) { // cos(18 deg) = 0.95
      return this.seek(evader.position);
    }

    let lookAheadTime = toEvader.length() / (this.maxSpeed + evader.body.velocity.length());

    return this.seek(evader.body.velocity.clone().multiply(lookAheadTime)
      .add(evader.position));
  }
  evade(pursuer) {
    let toPursuer = pursuer.position.clone().subtract(this.actor.position);

    let lookAheadTime = toPursuer.length() / (this.maxSpeed + pursuer.body.velocity.length());

    return this.flee(pursuer.body.velocity.clone().multiply(lookAheadTime).add(pursuer.position))
  }
  wander() {
    this.wanderTarget
      .add(rnd.realInRange(-this.wanderJitter, this.wanderJitter))
      .normalize()
      .multiply(this.wanderRadius);

    let targetLocal = this.wanderTarget.clone().add(this.wanderDistance, 0);
    let targetWorld = pointToWorldSpace(targetLocal, this.heading, this.side, this.actor.position);

    return targetWorld.subtract(this.actor.position);
  }

  interpose(agentA, agentB) {
    let midPoint = agentA.position.clone().add(agentB.position)
      .divide(2);

    let timeToReachMidPoint = this.actor.position.distance(midPoint) / this.maxSpeed;

    let aPos = agentA.body.velocity.clone().multiply(timeToReachMidPoint)
      .add(agentA.position);
    let bPos = agentB.body.velocity.clone().multiply(timeToReachMidPoint)
      .add(agentB.position);

    midPoint.copy(aPos).add(bPos).divide(2);

    Vector.recycle(aPos);
    Vector.recycle(bPos);

    return this.arrive(midPoint, 1);
  }
}

function pointToWorldSpace(point, heading, side, localPosition) {
  return point.add(localPosition);
}

Behavior.register('Steering', Steering);
