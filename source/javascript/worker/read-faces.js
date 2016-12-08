// Read all face structures
export default function(lump, src) {
  return new Promise((success) => {
    const faceCount = lump.length / 104;
    let faces = [];

    src.seek(lump.offset);

    for (let i = 0; i < faceCount; ++i) {
      const face = {
        shader: src.readLong(),
        effect: src.readLong(),
        type: src.readLong(),
        vertex: src.readLong(),
        vertCount: src.readLong(),
        meshVert: src.readLong(),
        meshVertCount: src.readLong(),
        lightmap: src.readLong(),
        lmStart: [ src.readLong(), src.readLong() ],
        lmSize: [ src.readLong(), src.readLong() ],
        lmOrigin: [ src.readFloat(), src.readFloat(), src.readFloat() ],
        lmVecs: [
          [ src.readFloat(), src.readFloat(), src.readFloat() ],
          [ src.readFloat(), src.readFloat(), src.readFloat() ]
        ],
        normal: [ src.readFloat(), src.readFloat(), src.readFloat() ],
        size: [ src.readLong(), src.readLong() ],
        indexOffset: -1
      };

      faces.push(face);
    }

    success(faces);
  });
}
