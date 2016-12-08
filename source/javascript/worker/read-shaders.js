export default function readShaders (lump, source) {
  return new Promise((success) => {
    let count = lump.length / 72;
    let elements = [];

    source.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      const shader = {
        shaderName: source.readString(64),
        flags: source.readLong(),
        contents: source.readLong(),
        shader: null,
        faces: [],
        indexOffset: 0,
        elementCount: 0,
        visible: true
      };

      elements.push(shader);
    }

    success(elements);
  });
}
