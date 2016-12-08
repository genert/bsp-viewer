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

onmessage = function (message) {
  switch (message.data.type) {
    case 'load':
      request(message.data.url)
      .then((data) => {
        parseBSP(new BinaryFile(data), message.data.tesselationLevel);
      });
      break;

    default:
      throw `Unexpected message type: ${message.data}`;
  }
};

// Parses the BSP file
async function parseBSP (src, tesselationLevel) {
  postMessage({
    type: 'status',
    message: 'Map downloaded, parsing level geometry...'
  });

  try {
    const header = await readHeader(src);

    // Read map entities
    await readEntities(header.lumps[0], src);

    // Load visual map components
    const shaders = await readShaders(header.lumps[1], src);
    const meshVerts = await readMeshVerts(header.lumps[11], src);
    const lightmaps = await readLightmaps(header.lumps[14], src);
    const verts = await readVertices(header.lumps[10], src);
    const faces = await readFaces(header.lumps[13], src);

    await compileMap(verts, faces, meshVerts, lightmaps, shaders, tesselationLevel);

    postMessage({
      type: 'status',
      message: 'Geometry compiled, parsing collision tree...'
    });

    // Load bsp components
    const planes = await readPlanes(header.lumps[2], src);
    const nodes = await readNodes(header.lumps[3], src);
    const leaves = await readLeaves(header.lumps[4], src);
    const leafFaces = await readLeafFaces(header.lumps[5], src);
    const leafBrushes = await readLeafBrushes(header.lumps[6], src);
    const brushes = await readBrushes(header.lumps[8], src);
    const brushSides = await readBrushSides(header.lumps[9], src);
    const visData = await readVisData(header.lumps[16], src);

    const visBuffer = visData.buffer;
    const visSize = visData.size;

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
}
