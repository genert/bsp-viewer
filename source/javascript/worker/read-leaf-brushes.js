// Read all Leaf Brushes
export default function (lump, src) {
  return new Promise((success) => {
    const count = lump.length / 4;
    let elements = [];

    src.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push(src.readLong());
    }

    success(elements);
  });
}
