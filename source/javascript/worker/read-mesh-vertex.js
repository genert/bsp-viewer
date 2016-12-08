export default function (lump, source) {
  return new Promise((success) => {
    const count = lump.length / 4;
    let meshVerts = [];

    source.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      meshVerts.push(source.readLong());
    }

    success(meshVerts);
  });
}
