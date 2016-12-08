// Read all Plane structures
export default function (lump, src) {
  return new Promise((success) => {
    const count = lump.length / 16;
    let elements = [];

    src.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        normal: [ src.readFloat(), src.readFloat(), src.readFloat() ],
        distance: src.readFloat()
      });
    }

    success(elements);
  });
}
