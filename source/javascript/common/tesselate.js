//
// Curve Tesselation
//
import { vec3 } from 'gl-matrix';

function getCurvePoint3 (c0, c1, c2, dist) {
  let a = null;
  let b = 1.0 - dist;

  return vec3.add(
    a = vec3.add(
      a = vec3.scale([0, 0, 0], c0, (b*b)),
      a,
      vec3.scale([0, 0, 0], c1, (2*b*dist))
    ),
    a,
    vec3.scale([0, 0, 0], c2, (dist*dist))
  );
}

function getCurvePoint2 (c0, c1, c2, dist) {
  let a = null;
  let b = 1.0 - dist;

  const c30 = [c0[0], c0[1], 0];
  const c31 = [c1[0], c1[1], 0];
  const c32 = [c2[0], c2[1], 0];

  var res = vec3.add(
    a = vec3.add(
      a = vec3.scale([0, 0, 0], c30, (b*b)),
      a,
      vec3.scale([0, 0, 0], c31, (2*b*dist))
    ),
    a,
    vec3.scale([0, 0, 0], c32, (dist*dist))
  );

  return [res[0], res[1]];
}


export default function tesselate (face, verts, meshVerts, level) {
  var off = face.vertex;

  var L1 = level + 1;

  face.vertex = verts.length;
  face.meshVert = meshVerts.length;

  face.vertCount = 0;
  face.meshVertCount = 0;

  for (let py = 0; py < face.size[1]-2; py += 2) {
    for (let px = 0; px < face.size[0]-2; px += 2) {
      var rowOff = (py*face.size[0]);

      // Store control points
      var c0 = verts[off+rowOff+px], c1 = verts[off+rowOff+px+1], c2 = verts[off+rowOff+px+2];
      rowOff += face.size[0];
      var c3 = verts[off+rowOff+px], c4 = verts[off+rowOff+px+1], c5 = verts[off+rowOff+px+2];
      rowOff += face.size[0];
      var c6 = verts[off+rowOff+px], c7 = verts[off+rowOff+px+1], c8 = verts[off+rowOff+px+2];

      var indexOff = face.vertCount;
      face.vertCount += L1 * L1;

      // Tesselate!
      for (let i = 0; i < L1; ++i) {
        var a = i / level;

        var pos = getCurvePoint3(c0.pos, c3.pos, c6.pos, a);
        var lmCoord = getCurvePoint2(c0.lmCoord, c3.lmCoord, c6.lmCoord, a);
        var texCoord = getCurvePoint2(c0.texCoord, c3.texCoord, c6.texCoord, a);
        var color = getCurvePoint3(c0.color, c3.color, c6.color, a);

        var vert = {
          pos: pos,
          texCoord: texCoord,
          lmCoord: lmCoord,
          color: [color[0], color[1], color[2], 1],
          lmNewCoord: [ 0, 0 ],
          normal: [0, 0, 1]
        };

        verts.push(vert);
      }

      for (let i = 1; i < L1; i++) {
        let a = i / level;

        let pc0 = getCurvePoint3(c0.pos, c1.pos, c2.pos, a);
        let pc1 = getCurvePoint3(c3.pos, c4.pos, c5.pos, a);
        let pc2 = getCurvePoint3(c6.pos, c7.pos, c8.pos, a);

        let tc0 = getCurvePoint3(c0.texCoord, c1.texCoord, c2.texCoord, a);
        let tc1 = getCurvePoint3(c3.texCoord, c4.texCoord, c5.texCoord, a);
        let tc2 = getCurvePoint3(c6.texCoord, c7.texCoord, c8.texCoord, a);

        let lc0 = getCurvePoint3(c0.lmCoord, c1.lmCoord, c2.lmCoord, a);
        let lc1 = getCurvePoint3(c3.lmCoord, c4.lmCoord, c5.lmCoord, a);
        let lc2 = getCurvePoint3(c6.lmCoord, c7.lmCoord, c8.lmCoord, a);

        let cc0 = getCurvePoint3(c0.color, c1.color, c2.color, a);
        let cc1 = getCurvePoint3(c3.color, c4.color, c5.color, a);
        let cc2 = getCurvePoint3(c6.color, c7.color, c8.color, a);

        for (let j = 0; j < L1; j++) {
          let b = j / level;

          let pos = getCurvePoint3(pc0, pc1, pc2, b);
          let texCoord = getCurvePoint2(tc0, tc1, tc2, b);
          let lmCoord = getCurvePoint2(lc0, lc1, lc2, b);
          let color = getCurvePoint3(cc0, cc1, cc2, a);

          let vert = {
            pos: pos,
            texCoord: texCoord,
            lmCoord: lmCoord,
            color: [color[0], color[1], color[2], 1],
            lmNewCoord: [ 0, 0 ],
            normal: [0, 0, 1]
          };

          verts.push(vert);
        }
      }

      face.meshVertCount += level * level * 6;

      for (let row = 0; row < level; ++row) {
        for (let col = 0; col < level; ++col) {
          meshVerts.push(indexOff + (row + 1) * L1 + col);
          meshVerts.push(indexOff + row * L1 + col);
          meshVerts.push(indexOff + row * L1 + (col+1));

          meshVerts.push(indexOff + (row + 1) * L1 + col);
          meshVerts.push(indexOff + row * L1 + (col+1));
          meshVerts.push(indexOff + (row + 1) * L1 + (col+1));
        }
      }
    }
  }
}
