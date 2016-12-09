export default function (source) {
  return new Promise((success, failure) => {
    let header = {
      tag: source.readString(4),
      version: source.readULong(),
      lumps: []
    };

    for (let i = 0; i < 17; ++i) {
      header.lumps.push({
        offset: source.readULong(),
        length: source.readULong()
      });
    }

    if (header.tag !== 'IBSP' || header.version !== 46) {
      postMessage({
        type: 'status',
        message: 'Wrong BSP type!'
      });

      failure();
    }

    success(header);
  });
}
