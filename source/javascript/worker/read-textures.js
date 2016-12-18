export default function (lump, source) {
  return new Promise((success) => {
    let count = lump.length / (64 + 4 + 4);
    let elements = [];

    source.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        shaderName: source.readString(64),  // Texture name.
        flags: source.readLong(),           // Surface flags.
        contents: source.readLong(),        // Content flags.

        shader: null,
        faces: [],
        indexOffset: 0,
        elementCount: 0,
        visible: true
      });
    }

    success(elements);
  });
}
