/**
 * Steering.
 */

const Behavior = require('engine/Behavior');
const Vector = require('engine/Vector');
const rnd = require('engine/rnd');
const { clamp } = require('engine/utils/math');

const VelocityEsp = 0.001;
const VelocityEspSq = VelocityEsp * VelocityEsp;

const DefaultSettings = {
  MaxSpeed: 100,

  // Flee
  PanicDistance: 100,

  // Wander
  WanderJitter: 100,
  WanderRadius: 100,
  WanderDistance: 10,
};

class Steering extends Behavior {
  constructor() {
    super();

    this.type = 'Steering';

    // Constants
    this.MaxSpeed = 100;

    this.PanicDistance = 100;

    this.WanderJitter = 100;
    this.WanderRadius = 100;
    this.WanderDistance = 10;

    // Properties
    this.force = Vector.create();
    this.wanderTarget = Vector.create();

    this.heading = Vector.create(1, 0);
    this.side = this.heading.clone().perp();

    this.panicDistanceSq = this.PanicDistance * this.PanicDistance;
  }

  init(ent, settings) {
    super.init(ent);

    Object.assign(this, DefaultSettings, settings);

    this.entity.canFixedTick = true;

    // Init variables
    this.force.set(0, 0);
    this.wanderTarget.set(0, 0);

    this.heading.set(1, 0);
    this.side.copy(this.heading).perp();

    this.panicDistanceSq = this.PanicDistance * this.PanicDistance;
  }
  fixedUpdate(_, dt) {
    // Update heading and side
    if (this.entity.body.velocity.squaredLength() > VelocityEspSq) {
      this.heading.copy(this.entity.body.velocity).normalize();
      this.side.copy(this.heading).perp();
    }
  }

  // Actions
  seek(targetPos) {
    let desiredVel = targetPos.clone()
      .subtract(this.entity.position)
      .normalize()
      .multiply(this.maxSpeed);

    return desiredVel.subtract(this.entity.body.velocity);
  }
  flee(targetPos) {
    // Do nothing when distance is large enough
    if (this.entity.position.squaredDistance(targetPos) > this.panicDistanceSq) {
      return Vector.create();
    }

    let desiredVel = this.entity.position.clone()
      .subtract(targetPos)
      .normalize()
      .multiply(this.maxSpeed);

    return desiredVel.subtract(this.entity.body.velocity);
  }
  arrive(targetPos, deceleration) {
    let toTarget = targetPos.clone().subtract(this.entity.position);
    let dist = toTarget.length();

    // Distance is larger than minimal distance
    if (dist > 4) {
      let speed = dist / (deceleration * 0.3);
      speed = Math.min(speed, this.maxSpeed);

      let desiredVel = toTarget.multiply(speed).divide(dist);

      return desiredVel.subtract(this.entity.body.velocity);
    }
    else {
      return toTarget.set(0);
    }
  }
  pursuit(evader) {
    let toEvader = evader.position.clone().subtract(this.entity.position);

    let selfHeading = this.entity.body.velocity.clone().normalize();
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
    let toPursuer = pursuer.position.clone().subtract(this.entity.position);

    let lookAheadTime = toPursuer.length() / (this.maxSpeed + pursuer.body.velocity.length());

    return this.flee(pursuer.body.velocity.clone().multiply(lookAheadTime).add(pursuer.position))
  }
  wander() {
    this.wanderTarget
      .add(rnd.realInRange(-this.wanderJitter, this.wanderJitter))
      .normalize()
      .multiply(this.wanderRadius);

    let targetLocal = this.wanderTarget.clone().add(this.wanderDistance, 0);
    let targetWorld = pointToWorldSpace(targetLocal, this.heading, this.side, this.entity.position);

    return targetWorld.subtract(this.entity.position);
  }

  interpose(agentA, agentB) {
    let midPoint = agentA.position.clone().add(agentB.position)
      .divide(2);

    let timeToReachMidPoint = this.entity.position.distance(midPoint) / this.maxSpeed;

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

module.exports = Steering;
