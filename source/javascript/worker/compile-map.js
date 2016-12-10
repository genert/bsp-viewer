import tesselate from '../common/tesselate';
import config from '../config';

export default function (verts, faces, meshVerts, lightmaps, shaders, tesselationLevel) {
  return new Promise((success) => {
    postMessage({
      type: 'status',
      message: 'Map geometry parsed, compiling...'
    });

    // Per-face operations
    for (let i = 0; i < faces.length; ++i) {
      const face = faces[i];

      if (face.type === 1 || face.type === 2 || face.type === 3) {
        // Add face to the appropriate texture face list
        var shader = shaders[face.shader];
        shader.faces.push(face);
        var lightmap = lightmaps[face.lightmap];

        if (!lightmap) {
          lightmap = lightmaps[0];
        }

        // If face type is polygon (1) or mesh (3), transform lightmap coords to match position in combined texture.
        if (face.type === 1 || face.type === 3) {
          shader.geomType = face.type;

          for (let j = 0; j < face.meshVertCount; ++j) {
            let vert = verts[face.vertex + meshVerts[face.meshVert + j]];

            if (config.ENGINE === config.ENGINES.QUAKE3) {
              vert.lmNewCoord[0] = (vert.lmCoord[0] * lightmap.xScale) + lightmap.x;
              vert.lmNewCoord[1] = (vert.lmCoord[1] * lightmap.yScale) + lightmap.y;
            } else if (config.ENGINE === config.ENGINES.WOLFET) {
              vert.lmNewCoord[0] = (vert.lmCoord[0] * 0.25);
              vert.lmNewCoord[1] = (vert.lmCoord[1] * 0.25);
            }
          }
        } else {
          // Tesselate either patch (2) or billboard (4) faces.
          postMessage({
            type: 'status',
            message: `Tesselating face ${i} of ${faces.length}`
          });

          // Build Bezier curve
          tesselate(face, verts, meshVerts, tesselationLevel);

          for (let j = 0; j < face.vertCount; ++j) {
            let vert = verts[face.vertex + j];

            if (config.ENGINE === config.ENGINES.QUAKE3) {
              vert.lmNewCoord[0] = (vert.lmCoord[0] * lightmap.xScale) + lightmap.x;
              vert.lmNewCoord[1] = (vert.lmCoord[1] * lightmap.yScale) + lightmap.y;
            } else if (config.ENGINE === config.ENGINES.WOLFET) {
              vert.lmNewCoord[0] = (vert.lmCoord[0] * 0.25);
              vert.lmNewCoord[1] = (vert.lmCoord[1] * 0.25);
            }
          }
        }
      }
    }

    // Compile vert list
    var vertices = new Array(verts.length*14);
    var offset = 0;
    for(var i = 0; i < verts.length; ++i) {
      let vert = verts[i];

      vertices[offset++] = vert.pos[0];
      vertices[offset++] = vert.pos[1];
      vertices[offset++] = vert.pos[2];

      vertices[offset++] = vert.texCoord[0];
      vertices[offset++] = vert.texCoord[1];

      vertices[offset++] = vert.lmNewCoord[0];
      vertices[offset++] = vert.lmNewCoord[1];

      vertices[offset++] = vert.normal[0];
      vertices[offset++] = vert.normal[1];
      vertices[offset++] = vert.normal[2];

      vertices[offset++] = vert.color[0];
      vertices[offset++] = vert.color[1];
      vertices[offset++] = vert.color[2];
      vertices[offset++] = vert.color[3];
    }

    // Compile index list
    var indices = new Array();
    for (let i = 0; i < shaders.length; ++i) {
      let shader = shaders[i];

      if (shader.faces.length > 0) {
        shader.indexOffset = indices.length * 2; // Offset is in bytes

        for (let j = 0; j < shader.faces.length; ++j) {
          let face = shader.faces[j];
          face.indexOffset = indices.length * 2;

          for(let k = 0; k < face.meshVertCount; ++k) {
            indices.push(face.vertex + meshVerts[face.meshVert + k]);
          }

          shader.elementCount += face.meshVertCount;
        }
      }

      shader.faces = null; // Don't need to send this to the render thread.
    }

    // Send the compiled vertex/index data back to the render thread
    postMessage({
      type: 'geometry',
      vertices: vertices,
      indices: indices,
      surfaces: shaders
    });

    success();
  });
}
