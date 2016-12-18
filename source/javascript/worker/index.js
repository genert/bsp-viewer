importScripts('/polyfill.min.js');

import request from '../net/request';
import BinaryFile from '../common/binary-reader';
import readHeader from './read-header';
import readEntities from './read-entities';
import readTextures from './read-textures';
import readMeshVerts from './read-mesh-vertex';
import readVertices from './read-vertices';
import readLightmaps from './read-lightmaps';
import readFaces from './read-faces';
import readPlanes from './read-planes';
import readNodes from './read-nodes';
import readModels from './read-models';
import readLeaves from './read-leaves';
import readLeafFaces from './read-leaf-faces';
import readLeafBrushes from './read-leaf-brushes';
import readBrushes from './read-brushes';
import readBrushSides from './read-brush-sides';
import readVisData from './read-visdata';
import readEffects from './read-effects';
import compileMap from './compile-map';
import getLeaf from './get-leaf';
import buildVisibleList from './build-visibility-list';
import shader from '../shaders';
import trace from './trace';

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
let effects = null;
let models = null;

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
        message.data.slide,

        brushSides, leaves, leafBrushes, brushes, shaders, nodes, planes
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

const	LUMP_ENTITIES = 0;
const	LUMP_TEXTURES = 1;
const	LUMP_PLANES = 2;
const	LUMP_NODES = 3;
const	LUMP_LEAFS = 4;
const	LUMP_LEAFSURFACES = 5;
const	LUMP_LEAFBRUSHES = 6;
const	LUMP_MODELS = 7;
const	LUMP_BRUSHES = 8;
const	LUMP_BRUSHSIDES = 9;
const	LUMP_DRAWVERTS = 10;
const	LUMP_DRAWINDEXES = 11;
const	LUMP_EFFECTS = 12;
const	LUMP_SURFACES = 13;
const	LUMP_LIGHTMAPS = 14;
const	LUMP_LIGHTGRID = 15;
const	LUMP_VISIBILITY = 16;

// Parses the BSP file
const parseBSP = async function (src, tesselationLevel) {
  postMessage({
    type: 'status',
    message: 'Map downloaded, parsing level geometry...'
  });

  try {
    header = await readHeader(src);

    console.log(header);

    // Read map entities
    await readEntities(header.lumps[LUMP_ENTITIES], src);

    // Load visual map components
    shaders = await readTextures(header.lumps[LUMP_TEXTURES], src);
    meshVerts = await readMeshVerts(header.lumps[LUMP_DRAWINDEXES], src);
    lightmaps = await readLightmaps(header.lumps[LUMP_LIGHTMAPS], src);
    verts = await readVertices(header.lumps[LUMP_DRAWVERTS], src);
    faces = await readFaces(header.lumps[LUMP_SURFACES], src);

    await compileMap(verts, faces, meshVerts, lightmaps, shaders, tesselationLevel);

    postMessage({
      type: 'status',
      message: 'Geometry compiled, parsing collision tree...'
    });

    // Load bsp components
    planes = await readPlanes(header.lumps[LUMP_PLANES], src);
    nodes = await readNodes(header.lumps[LUMP_NODES], src);
    leaves = await readLeaves(header.lumps[LUMP_LEAFS], src);
    leafFaces = await readLeafFaces(header.lumps[LUMP_LEAFSURFACES], src);
    leafBrushes = await readLeafBrushes(header.lumps[LUMP_LEAFBRUSHES], src);
    brushes = await readBrushes(header.lumps[LUMP_BRUSHES], src);
    brushSides = await readBrushSides(header.lumps[LUMP_BRUSHSIDES], src);
    visData = await readVisData(header.lumps[LUMP_VISIBILITY], src);
    effects = await readEffects(header.lumps[LUMP_EFFECTS], src);
    models = await readModels(header.lumps[LUMP_MODELS], src);

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
