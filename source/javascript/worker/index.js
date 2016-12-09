importScripts('/polyfill.min.js');

import request from '../net/request';
import BinaryFile from '../common/binary-reader';
import readHeader from './read-header';
import readEntities from './read-entities';
import readShaders from './read-shaders';
import readMeshVerts from './read-mesh-vertex';
import readVertices from './read-vertices';
import readLightmaps from './read-lightmaps';
import readFaces from './read-faces';
import readPlanes from './read-planes';
import readNodes from './read-nodes';
import readLeaves from './read-leaves';
import readLeafFaces from './read-leaf-faces';
import readLeafBrushes from './read-leaf-brushes';
import readBrushes from './read-brushes';
import readBrushSides from './read-brush-sides';
import readVisData from './read-visdata';
import compileMap from './compile-map';
import getLeaf from './get-leaf';
import buildVisibleList from './build-visibility-list';
import shader from '../shaders';

let header = null;
let shaders = null;
let meshVerts = null;
let lightmaps = null;
let verts = null;
let faces = null;
let planes = null;
let nodes = null;
let leaves = null;
let leafFaces = null;
let leafBrushes = null;
let brushes = null;
let brushSides = null;
let visData = null;
let visBuffer = null;
let visSize = null;

onmessage = function (message) {
  switch (message.data.type) {
    case 'load':
      request(message.data.url)
      .then((data) => {
        parseBSP(new BinaryFile(data), message.data.tesselationLevel);
      });
      break;

    case 'loadShaders':
      shader.loadList(message.data.sources);
      break;

    case 'trace':
      trace(
        message.data.traceId,
        message.data.start,
        message.data.end,
        message.data.radius,
        message.data.slide
      );
      break;

    case 'visibility': {
      const leafIndex = getLeaf(message.data.pos, nodes, planes);
      buildVisibleList(leafIndex, visBuffer, visSize, shaders, leaves, faces, leafFaces);
      break;
    }

    default:
      throw `Unexpected message type: ${message.data}`;
  }
};

// Parses the BSP file
const parseBSP = async function (src, tesselationLevel) {
  postMessage({
    type: 'status',
    message: 'Map downloaded, parsing level geometry...'
  });

  try {
    header = await readHeader(src);

    // Read map entities
    await readEntities(header.lumps[0], src);

    // Load visual map components
    shaders = await readShaders(header.lumps[1], src);
    meshVerts = await readMeshVerts(header.lumps[11], src);
    lightmaps = await readLightmaps(header.lumps[14], src);
    verts = await readVertices(header.lumps[10], src);
    faces = await readFaces(header.lumps[13], src);

    await compileMap(verts, faces, meshVerts, lightmaps, shaders, tesselationLevel);

    postMessage({
      type: 'status',
      message: 'Geometry compiled, parsing collision tree...'
    });

    // Load bsp components
    planes = await readPlanes(header.lumps[2], src);
    nodes = await readNodes(header.lumps[3], src);
    leaves = await readLeaves(header.lumps[4], src);
    leafFaces = await readLeafFaces(header.lumps[5], src);
    leafBrushes = await readLeafBrushes(header.lumps[6], src);
    brushes = await readBrushes(header.lumps[8], src);
    brushSides = await readBrushSides(header.lumps[9], src);
    visData = await readVisData(header.lumps[16], src);

    visBuffer = visData.buffer;
    visSize = visData.size;

    postMessage({
      type: 'bsp',
      bsp: {
        planes: planes,
        nodes: nodes,
        leaves: leaves,
        leafFaces: leafFaces,
        leafBrushes: leafBrushes,
        brushes: brushes,
        brushSides: brushSides,
        surfaces: shaders,
        visBuffer: visBuffer,
        visSize: visSize
      }
    });
  } catch (error) {
    throw error;
  }
};

import { vec3 } from 'gl-matrix';

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
      for (let i = 0; i < 3; i++) {
        end[i] = end[i] + endDist * (output.plane.normal[i]);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        end[i] = start[i] + output.fraction * (end[i] - start[i]);
      }
    }
  }

  postMessage({
    type: 'trace',
    traceId: traceId,
    end: end
  });
}

function traceNode(nodeIdx, startFraction, endFraction, start, end, radius, output) {
  if (nodeIdx < 0) { // Leaf node?
    var leaf = leaves[-(nodeIdx + 1)];
    for (var i = 0; i < leaf.leafBrushCount; i++) {
      var brush = brushes[leafBrushes[leaf.leafBrush + i]];
      var shader = shaders[brush.shader];
      if (brush.brushSideCount > 0 && (shader.contents & 1)) {
        traceBrush(brush, start, end, radius, output);
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
    traceNode(node.children[0], startFraction, endFraction, start, end, radius, output );
  } else if (startDist < -radius && endDist < -radius) {
    traceNode(node.children[1], startFraction, endFraction, start, end, radius, output );
  } else {
    var side;
    var fraction1, fraction2, middleFraction;
    var middle = [0, 0, 0];

    if (startDist < endDist) {
      side = 1; // back
      let iDist = 1 / (startDist - endDist);
      fraction1 = (startDist - radius + 0.03125) * iDist;
      fraction2 = (startDist + radius + 0.03125) * iDist;
    } else if (startDist > endDist) {
      side = 0; // front
      let iDist = 1 / (startDist - endDist);
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

    for (let i = 0; i < 3; i++) {
      middle[i] = start[i] + fraction1 * (end[i] - start[i]);
    }

    traceNode(node.children[side], startFraction, middleFraction, start, middle, radius, output );

    middleFraction = startFraction + (endFraction - startFraction) * fraction2;

    for (let i = 0; i < 3; i++) {
      middle[i] = start[i] + fraction2 * (end[i] - start[i]);
    }

    traceNode(node.children[side===0?1:0], middleFraction, endFraction, middle, end, radius, output );
  }
}

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
      let fraction = (startDist - 0.03125) / (startDist - endDist);
      if (fraction > startFraction) {
        startFraction = fraction;
        collisionPlane = plane;
      }
    } else { // line is leaving the brush
      let fraction = (startDist + 0.03125) / (startDist - endDist);
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
