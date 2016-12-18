//
// BSP Tree Collision Detection
//
import { vec3 } from 'gl-matrix';

const TRACE_OFFSET = 0.03125;

export default class {
  _bsp = null;

  constructor (bsp) {
    this._bsp = bsp;
  }

  trace (start, end, radius = 0) {
    let output = {
      allSolid: false,
      startSolid: false,
      fraction: 1.0,
      endPos: end,
      plane: null
    };

    if (!this._bsp) {
      return output;
    }

    this.traceNode(0, 0, 1, start, end, radius, output);

    // Collided with something
    if (output.fraction !== 1.0) {
      for (let i = 0; i < 3; i++) {
        output.endPos[i] = start[i] + output.fraction * (end[i] - start[i]);
      }
    }

    return output;
  }

  traceNode (nodeIdx, startFraction, endFraction, start, end, radius, output) {
    if (nodeIdx < 0) { // Leaf node?
      let leaf = this._bsp.leaves[-(nodeIdx + 1)];

      for (let i = 0; i < leaf.leafBrushCount; i++) {
        let brush = this._bsp.brushes[this._bsp.leafBrushes[leaf.leafBrush + i]];
        let surface = this._bsp.surfaces[brush.shader];

        if (brush.brushSideCount > 0 && surface.contents & 1) {
          this.traceBrush(brush, start, end, radius, output);
        }
      }

      return;
    }

    // Tree node
    let node = this._bsp.nodes[nodeIdx];
    let plane = this._bsp.planes[node.plane];

    let startDist = vec3.dot(plane.normal, start) - plane.distance;
    let endDist = vec3.dot(plane.normal, end) - plane.distance;

    if (startDist >= radius && endDist >= radius) {
      this.traceNode(node.children[0], startFraction, endFraction, start, end, radius, output );
    } else if (startDist < -radius && endDist < -radius) {
      this.traceNode(node.children[1], startFraction, endFraction, start, end, radius, output );
    } else {
      let side;
      let fraction1, fraction2, middleFraction;
      let middle = [0, 0, 0];

      if (startDist < endDist) {
        let iDist = 1 / (startDist - endDist);

        side = 1; // back

        fraction1 = (startDist - radius + TRACE_OFFSET) * iDist;
        fraction2 = (startDist + radius + TRACE_OFFSET) * iDist;
      } else if (startDist > endDist) {
        let iDist = 1 / (startDist - endDist);

        side = 0; // front

        fraction1 = (startDist + radius + TRACE_OFFSET) * iDist;
        fraction2 = (startDist - radius - TRACE_OFFSET) * iDist;
      } else {
        side = 0; // front
        fraction1 = 1;
        fraction2 = 0;
      }

      if (fraction1 < 0) {
        fraction1 = 0;
      } else if (fraction1 > 1) {
        fraction1 = 1;
      }

      if (fraction2 < 0) {
        fraction2 = 0;
      } else if (fraction2 > 1) {
        fraction2 = 1;
      }

      middleFraction = startFraction + (endFraction - startFraction) * fraction1;

      for (let i = 0; i < 3; i++) {
        middle[i] = start[i] + fraction1 * (end[i] - start[i]);
      }

      this.traceNode(node.children[side], startFraction, middleFraction, start, middle, radius, output );

      middleFraction = startFraction + (endFraction - startFraction) * fraction2;

      for (let i = 0; i < 3; i++) {
        middle[i] = start[i] + fraction2 * (end[i] - start[i]);
      }

      this.traceNode(node.children[side === 0 ? 1 : 0], middleFraction, endFraction, middle, end, radius, output );
    }
  }

  traceBrush (brush, start, end, radius, output) {
    let startFraction = -1;
    let endFraction = 1;
    let startsOut = false;
    let endsOut = false;
    let collisionPlane = null;

    for (let i = 0; i < brush.brushSideCount; i++) {
      var brushSide = this._bsp.brushSides[brush.brushSide + i];
      var plane = this._bsp.planes[brushSide.plane];

      var startDist = vec3.dot( start, plane.normal ) - (plane.distance + radius);
      var endDist = vec3.dot( end, plane.normal ) - (plane.distance + radius);

      if (startDist > 0) startsOut = true;
      if (endDist > 0) endsOut = true;

      // make sure the trace isn't completely on one side of the brush
      if (startDist > 0 && endDist > 0) {
        return;
      }

      if (startDist <= 0 && endDist <= 0) {
        continue;
      }

      if (startDist > endDist) { // line is entering into the brush
        let fraction = (startDist - TRACE_OFFSET) / (startDist - endDist);

        if (fraction > startFraction) {
          startFraction = fraction;
          collisionPlane = plane;
        }
      } else { // line is leaving the brush
        let fraction = (startDist + TRACE_OFFSET) / (startDist - endDist);
        
        if (fraction < endFraction) {
          endFraction = fraction;
        }
      }
    }

    if (startsOut === false) {
      output.startSolid = true;

      if (endsOut === false) {
        output.allSolid = true;
      }

      return;
    }

    if (startFraction < endFraction) {
      if (startFraction > -1 && startFraction < output.fraction) {
        output.plane = collisionPlane;

        if (startFraction < 0) {
          startFraction = 0;
        }

        output.fraction = startFraction;
      }
    }

    return;
  }
}
