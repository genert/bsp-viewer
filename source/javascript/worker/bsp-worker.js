importScripts('/polyfill.min.js');

import request from '../net/request';
import BinaryFile from '../common/binary-reader';
import vertifyBsp from './vertify-bsp';
import readHeader from './read-header';
import readEntities from './read-entities';
import readShaders from './read-shaders';

onmessage = function (message) {
  switch (message.data.type) {
    case 'load':
      request(message.data.url)
        .then((data) => {
          parseBSP(new BinaryFile(data), message.data.tesselationLevel);
        });
      break;

    default:
      throw `Unexpected message type: ${message.data}`;
  }
};

// Parses the BSP file
async function parseBSP (src) {
  postMessage({
    type: 'status',
    message: 'Map downloaded, parsing level geometry...'
  });

  try {
    const header = await readHeader(src);

    if (!vertifyBsp()) {
      postMessage({
        type: 'status',
        message: 'Wrong BSP type!'
      });

      return;
    }

    const elements = await readEntities(header.lumps[0], src);

    postMessage({
      type: 'entities',
      entities: elements
    });

    const shaders = await readShaders(header.lumps[1], src);

    console.log(shaders);
  } catch (error) {
    throw error;
  }
}
