// Much of this file is a simplified/dumbed-down version of the Q3 player movement code
// found in bg_pmove.c and bg_slidemove.c
import { vec3 } from 'gl-matrix';

let MOVEMENT_FRAMETIME = 0.30;

const MOVEMENT_STOPSPEED = 100.0;
const MOVEMENT_JUMPVELOCITY = 50;

const MOVEMENT_ACCELERATE = 10.0;
const MOVEMENT_AIR_ACCELERATE = 0.1;

const MOVEMENT_FRICTION = 6.0;
const MOVEMENT_OVERCLIP = 0.501;
const MOVEMENT_STEPSIZE = 18;

const MOVEMENT_GRAVITY = 20.0;

const MOVEMENT_PLAYER_RADIUS = 10.0;
const MOVEMENT_SCALE = 50;

export default class {
  constructor (bsp) {
    this._bsp = bsp;

    this._velocity = [0, 0, 0];
    this.position = [0, 0, 0];
    this.onGround = false;

    this.groundTrace = null;
  }

  applyFriction () {
    if (!this.onGround) {
      return;
    }

    const speed = vec3.length(this._velocity);
    const control = (speed < MOVEMENT_STOPSPEED) ? MOVEMENT_STOPSPEED : speed;
    const drop = control * MOVEMENT_FRICTION * MOVEMENT_FRAMETIME;

    let newSpeed = speed - drop;

    if (newSpeed < 0) {
      newSpeed = 0;
    }

    if (speed !== 0) {
      newSpeed /= speed;
      vec3.scale(this._velocity, this._velocity, newSpeed);
    } else {
      this._velocity = [0, 0, 0];
    }
  }

  groundCheck () {
    const checkPoint = [
      this.position[0],
      this.position[1],
      this.position[2] - MOVEMENT_PLAYER_RADIUS - 0.25
    ];

    this.groundTrace = this._bsp.trace(this.position, checkPoint, MOVEMENT_PLAYER_RADIUS);

    // Falling
    if (this.groundTrace.fraction == 1.0) {
      this.onGround = false;
      return;
    }

    // Jumping
    if (this._velocity[2] > 0 && vec3.dot(this._velocity, this.groundTrace.plane.normal) > 10) {
      this.onGround = false;
      return;
    }

    // Steep slope
    if (this.groundTrace.plane.normal[2] < 0.7) {
      this.onGround = false;
      return;
    }

    this.onGround = true;
  }

  clipVelocity (velIn, normal) {
    let backoff = vec3.dot(velIn, normal);

    if (backoff < 0) {
      backoff *= MOVEMENT_OVERCLIP;
    } else {
      backoff /= MOVEMENT_OVERCLIP;
    }

    const change = vec3.scale([0,0,0], normal, backoff);
    return vec3.subtract(change, velIn, change);
  }

  accelerate (dir, speed, accel) {
    const currentSpeed = vec3.dot(this._velocity, dir);
    const addSpeed = speed - currentSpeed;

    if (addSpeed <= 0) {
      return;
    }

    let accelSpeed = accel * MOVEMENT_FRAMETIME * speed;

    if (accelSpeed > addSpeed) {
      accelSpeed = addSpeed;
    }

    const accelDir = vec3.scale([0,0,0], dir, accelSpeed);
    vec3.add(this._velocity, this._velocity, accelDir);
  }

  jump () {
    if (!this.onGround) {
      return false;
    }

    this.onGround = false;
    this._velocity[2] = MOVEMENT_JUMPVELOCITY;

    // Make sure that the player isn't stuck in the ground
    var groundDist = vec3.dot(this.position, this.groundTrace.plane.normal) - this.groundTrace.plane.distance - MOVEMENT_PLAYER_RADIUS;
    vec3.add(this.position, this.position, vec3.scale([0, 0, 0], this.groundTrace.plane.normal, groundDist + 5));

    return true;
  }

  move (dir, frameTime) {
    MOVEMENT_FRAMETIME = frameTime * 0.0075;

    this.groundCheck();

    vec3.normalize(dir, dir);

    if (this.onGround) {
      this.walkMove(dir);
    } else {
      this.airMove(dir);
    }

    return this.position;
  }

  airMove (dir) {
    const speed = vec3.length(dir) * MOVEMENT_SCALE;
    this.accelerate(dir, speed, MOVEMENT_AIR_ACCELERATE);
    this.stepSlideMove(true);
  }

  walkMove (dir) {
    const speed = vec3.length(dir) * MOVEMENT_SCALE;

    this.applyFriction();
    this.accelerate(dir, speed, MOVEMENT_ACCELERATE);

    this._velocity = this.clipVelocity(this._velocity, this.groundTrace.plane.normal);

    if (!this._velocity[0] && !this._velocity[1]) {
      return;
    }

    this.stepSlideMove(false);
  }

  slideMove (gravity) {
    var bumpcount;
    var numbumps = 4;
    var planes = [];
    var endVelocity = [0,0,0];

    if (gravity) {
      vec3.copy(endVelocity, this._velocity);
      endVelocity[2] -= MOVEMENT_GRAVITY * MOVEMENT_FRAMETIME;
      this._velocity[2] = (this._velocity[2] + endVelocity[2]) * 0.5;

      if (this.groundTrace && this.groundTrace.plane) {
        // slide along the ground plane
        this._velocity = this.clipVelocity(this._velocity, this.groundTrace.plane.normal);
      }
    }

    // never turn against the ground plane
    if (this.groundTrace && this.groundTrace.plane) {
      planes.push(vec3.copy([0,0,0], this.groundTrace.plane.normal));
    }

    // never turn against original velocity
    planes.push(vec3.normalize([0,0,0], this._velocity));

    var time_left = MOVEMENT_FRAMETIME;
    var end = [0,0,0];

    for (bumpcount=0; bumpcount < numbumps; ++bumpcount) {
      // calculate position we are trying to move to
      vec3.add(end, this.position, vec3.scale([0,0,0], this._velocity, time_left));

      // see if we can make it there
      var trace = this._bsp.trace(this.position, end, MOVEMENT_PLAYER_RADIUS);

      if (trace.allSolid) {
        // entity is completely trapped in another solid
        this._velocity[2] = 0;   // don't build up falling damage, but allow sideways acceleration
        return true;
      }

      if (trace.fraction > 0) {
        // actually covered some distance
        vec3.copy(this.position, trace.endPos);
      }

      if (trace.fraction == 1) {
        break;     // moved the entire distance
      }

      time_left -= time_left * trace.fraction;

      planes.push(vec3.copy([0,0,0], trace.plane.normal));

      //
      // modify velocity so it parallels all of the clip planes
      //

      // find a plane that it enters
      for (let i = 0; i < planes.length; ++i) {
        var into = vec3.dot(this._velocity, planes[i]);

        // move doesn't interact with the plane
        if (into >= 0.1) {
          continue;
        }

        // slide along the plane
        var clipVelocity = this.clipVelocity(this._velocity, planes[i]);
        var endClipVelocity = this.clipVelocity(endVelocity, planes[i]);

        // see if there is a second plane that the new move enters
        for (var j = 0; j < planes.length; j++) {
          if (j == i) {
            continue;
          }

          // move doesn't interact with the plane
          if (vec3.dot( clipVelocity, planes[j] ) >= 0.1) {
            continue;
          }

          // try clipping the move to the plane
          clipVelocity = this.clipVelocity(clipVelocity, planes[j]);
          endClipVelocity = this.clipVelocity(endClipVelocity, planes[j]);

          // see if it goes back into the first clip plane
          if (vec3.dot( clipVelocity, planes[i] ) >= 0) {
            continue;
          }

          // slide the original velocity along the crease
          var dir = [0,0,0];
          vec3.cross(dir, planes[i], planes[j]);
          vec3.normalize(dir, dir);
          var d = vec3.dot(dir, this._velocity);
          vec3.scale(clipVelocity, dir, d);

          vec3.cross(dir, planes[i], planes[j]);
          vec3.normalize(dir, dir);
          d = vec3.dot(dir, endVelocity);
          vec3.scale(endClipVelocity, dir, d);

          // see if there is a third plane the the new move enters
          for(var k = 0; k < planes.length; ++k) {
            if (k == i || k == j) {
              continue;
            }

            // move doesn't interact with the plane
            if (vec3.dot(clipVelocity, planes[k]) >= 0.1 ) {
              continue;
            }

            // stop dead at a tripple plane interaction
            this._velocity = [0,0,0];
            return true;
          }
        }

        // if we have fixed all interactions, try another move
        vec3.copy(this._velocity, clipVelocity);
        vec3.copy(endVelocity, endClipVelocity);
        break;
      }
    }

    if (gravity) {
      vec3.copy(this._velocity, endVelocity);
    }

    return (bumpcount !== 0);
  }

  stepSlideMove (gravity) {
    var start_o = vec3.copy([0,0,0], this.position);
    var start_v = vec3.copy([0,0,0], this._velocity);

    // We got exactly where we wanted to go first try
    if (this.slideMove( gravity ) === 0) {
      return;
    }

    var down = vec3.copy([0,0,0], start_o);
    down[2] -= MOVEMENT_STEPSIZE;
    var trace = this._bsp.trace(start_o, down, MOVEMENT_PLAYER_RADIUS);

    var up = [0,0,1];

    // never step up when you still have up velocity
    if (this._velocity[2] > 0 && (trace.fraction == 1.0 || vec3.dot(trace.plane.normal, up) < 0.7)) {
      return;
    }

    vec3.copy(up, start_o);
    up[2] += MOVEMENT_STEPSIZE;

    // test the player position if they were a stepheight higher
    trace = this._bsp.trace(start_o, up, MOVEMENT_PLAYER_RADIUS);

    // can't step up
    if (trace.allSolid) {
      return;
    }

    var stepSize = trace.endPos[2] - start_o[2];
    // try slidemove from this position
    vec3.copy(this.position, trace.endPos);
    vec3.copy(this._velocity, start_v);

    this.slideMove( gravity );

    // push down the final amount
    vec3.copy(down, this.position);
    down[2] -= stepSize;
    trace = this._bsp.trace(this.position, down, MOVEMENT_PLAYER_RADIUS);

    if (!trace.allSolid) {
      vec3.copy(this.position, trace.endPos);
    }

    if (trace.fraction < 1.0) {
      this._velocity = this.clipVelocity( this._velocity, trace.plane.normal );
    }
  }
}
