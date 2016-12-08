export default function readShaders (lump, src) {
  return new Promise((success) => {
    var count = lump.length / 72;
    var elements = [];

    src.seek(lump.offset);

    for(var i = 0; i < count; ++i) {
      var shader = {
        shaderName: src.readString(64),
        flags: src.readLong(),
        contents: src.readLong(),
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
