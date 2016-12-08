export default function readHeader (source) {
  return new Promise((success) => {
    let header = {
      tag: source.readString(4),
      version: source.readULong(),
      lumps: []
    };

    for(let i = 0; i < 17; ++i) {
      let lump = {
        offset: source.readULong(),
        length: source.readULong()
      };

      header.lumps.push(lump);
    }

    success(header);
  });
}
