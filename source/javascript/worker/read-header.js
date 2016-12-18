import config from '../config';

const LUMP_LENGTH = 17;

export default function (source) {
  return new Promise((success, failure) => {
    let header = {
      tag: source.readString(4),
      version: source.readULong(),
      lumps: []
    };

    for (let i = 0; i < LUMP_LENGTH; ++i) {
      header.lumps.push({
        offset: source.readULong(),
        length: source.readULong()
      });
    }

    if (header.tag !== 'IBSP' || header.version !== config.ENGINE) {
      postMessage({
        type: 'status',
        message: 'Wrong BSP type!'
      });

      failure();
    }

    success(header);
  });
}
