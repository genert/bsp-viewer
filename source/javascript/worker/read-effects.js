export default function (lump, source) {
  return new Promise((success) => {
    const count = lump.length / (64 + 4 + 4);
    let elements = [];

    source.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        name: source.readString(64),
        brush: source.readLong(),
        unknown: source.readLong()
      });
    }

    success(elements);
  });
}
