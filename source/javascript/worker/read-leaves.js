// Read all Leaf structures
export default function (lump, src) {
  return new Promise((success) => {
    var count = lump.length / 48;
    var elements = [];

    src.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        cluster: src.readLong(),
        area: src.readLong(),
        min: [ src.readLong(), src.readLong(), src.readLong() ],
        max: [ src.readLong(), src.readLong(), src.readLong() ],
        leafFace: src.readLong(),
        leafFaceCount: src.readLong(),
        leafBrush: src.readLong(),
        leafBrushCount: src.readLong()
      });
    }

    success(elements);
  });
}
