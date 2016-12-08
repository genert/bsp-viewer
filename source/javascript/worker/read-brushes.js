// Read all Brushes
export default function(lump, src) {
  return new Promise((success) => {
    const count = lump.length / 12;
    let elements = [];

    src.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        brushSide: src.readLong(),
        brushSideCount: src.readLong(),
        shader: src.readLong()
      });
    }

    success(elements);
  });
}
