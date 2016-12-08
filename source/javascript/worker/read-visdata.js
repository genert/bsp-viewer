// Read all Vis Data
export default function (lump, src) {
  return new Promise((success) => {
    src.seek(lump.offset);

    var vecCount = src.readLong();
    var size = src.readLong();

    var byteCount = vecCount * size;
    var elements = new Array(byteCount);

    for (let i = 0; i < byteCount; ++i) {
      elements[i] = src.readUByte();
    }

    success({
      buffer: elements,
      size: size
    });
  });
}
