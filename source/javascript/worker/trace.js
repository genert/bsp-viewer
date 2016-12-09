//
// BSP Collision Detection
//

function trace(traceId, start, end, radius, slide) {
  if(!radius) { radius = 0; }
  if(!slide) { slide = false; }

  if (!brushSides) { return end; }

  var output = {
    startsOut: true,
    allSolid: false,
    plane: null,
    fraction: 1
  };

  traceNode(0, 0, 1, start, end, radius, output);

  if(output.fraction != 1) { // collided with something
    if(slide && output.plane) {
      var endDist = Math.abs(vec3.dot( end, output.plane.normal ) - (output.plane.distance + radius + 0.03125));
      for (var i = 0; i < 3; i++) {
        end[i] = end[i] + endDist * (output.plane.normal[i]);
      }
    } else {
      for (var i = 0; i < 3; i++) {
        end[i] = start[i] + output.fraction * (end[i] - start[i]);
      }
    }
  }

  postMessage({
    type: 'trace',
    traceId: traceId,
    end: end
  });
};

function traceNode(nodeIdx, startFraction, endFraction, start, end, radius, output) {
  if (nodeIdx < 0) { // Leaf node?
    var leaf = leaves[-(nodeIdx + 1)];
    for (var i = 0; i < leaf.leafBrushCount; i++) {
      var brush = brushes[leafBrushes[leaf.leafBrush + i]];
      var shader = shaders[brush.shader];
      if (brush.brushSideCount > 0 && (shader.contents & 1)) {
        q3bsp.traceBrush(brush, start, end, radius, output);
      }
    }
    return;
  }

  // Tree node
  var node = nodes[nodeIdx];
  var plane = planes[node.plane];

  var startDist = vec3.dot(plane.normal, start) - plane.distance;
  var endDist = vec3.dot(plane.normal, end) - plane.distance;

  if (startDist >= radius && endDist >= radius) {
    q3bsp.traceNode(node.children[0], startFraction, endFraction, start, end, radius, output );
  } else if (startDist < -radius && endDist < -radius) {
    q3bsp.traceNode(node.children[1], startFraction, endFraction, start, end, radius, output );
  } else {
    var side;
    var fraction1, fraction2, middleFraction;
    var middle = [0, 0, 0];

    if (startDist < endDist) {
      side = 1; // back
      var iDist = 1 / (startDist - endDist);
      fraction1 = (startDist - radius + 0.03125) * iDist;
      fraction2 = (startDist + radius + 0.03125) * iDist;
    } else if (startDist > endDist) {
      side = 0; // front
      var iDist = 1 / (startDist - endDist);
      fraction1 = (startDist + radius + 0.03125) * iDist;
      fraction2 = (startDist - radius - 0.03125) * iDist;
    } else {
      side = 0; // front
      fraction1 = 1;
      fraction2 = 0;
    }

    if (fraction1 < 0) fraction1 = 0;
    else if (fraction1 > 1) fraction1 = 1;
    if (fraction2 < 0) fraction2 = 0;
    else if (fraction2 > 1) fraction2 = 1;

    middleFraction = startFraction + (endFraction - startFraction) * fraction1;

    for (var i = 0; i < 3; i++) {
      middle[i] = start[i] + fraction1 * (end[i] - start[i]);
    }

    q3bsp.traceNode(node.children[side], startFraction, middleFraction, start, middle, radius, output );

    middleFraction = startFraction + (endFraction - startFraction) * fraction2;

    for (var i = 0; i < 3; i++) {
      middle[i] = start[i] + fraction2 * (end[i] - start[i]);
    }

    q3bsp.traceNode(node.children[side===0?1:0], middleFraction, endFraction, middle, end, radius, output );
  }
};

function traceBrush(brush, start, end, radius, output) {
  var startFraction = -1;
  var endFraction = 1;
  var startsOut = false;
  var endsOut = false;
  var collisionPlane = null;

  for (var i = 0; i < brush.brushSideCount; i++) {
    var brushSide = brushSides[brush.brushSide + i];
    var plane = planes[brushSide.plane];

    var startDist = vec3.dot( start, plane.normal ) - (plane.distance + radius);
    var endDist = vec3.dot( end, plane.normal ) - (plane.distance + radius);

    if (startDist > 0) startsOut = true;
    if (endDist > 0) endsOut = true;

    // make sure the trace isn't completely on one side of the brush
    if (startDist > 0 && endDist > 0) { return; }
    if (startDist <= 0 && endDist <= 0) { continue; }

    if (startDist > endDist) { // line is entering into the brush
      var fraction = (startDist - 0.03125) / (startDist - endDist);
      if (fraction > startFraction) {
        startFraction = fraction;
        collisionPlane = plane;
      }
    } else { // line is leaving the brush
      var fraction = (startDist + 0.03125) / (startDist - endDist);
      if (fraction < endFraction)
      endFraction = fraction;
    }
  }

  if (startsOut === false) {
    output.startsOut = false;
    if (endsOut === false)
    output.allSolid = true;
    return;
  }

  if (startFraction < endFraction) {
    if (startFraction > -1 && startFraction < output.fraction) {
      output.plane = collisionPlane;
      if (startFraction < 0)
      startFraction = 0;
      output.fraction = startFraction;
    }
  }

  return;
}
