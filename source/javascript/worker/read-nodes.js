// Read all Node structures
export default function (lump, src) {
  return new Promise((success) => {
    const count = lump.length / 36;
    let elements = [];

    src.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        plane: src.readLong(),
        children: [ src.readLong(), src.readLong() ],
        min: [ src.readLong(), src.readLong(), src.readLong() ],
        max: [ src.readLong(), src.readLong(), src.readLong() ]
      });
    }

    success(elements);
  });
}
