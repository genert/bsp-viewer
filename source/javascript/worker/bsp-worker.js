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
