export default function(lump, src) {
  return new Promise((success) => {
    const count = lump.length / 8;
    let elements = [];

    src.seek(lump.offset);
    
    for (let i = 0; i < count; ++i) {
      elements.push({
        plane: src.readLong(),
        shader: src.readLong()
      });
    }

    success(elements);
  });
}
