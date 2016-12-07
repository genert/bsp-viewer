import request from '../net/request';
import BinaryFile from '../common/binary-reader';
import readHeader from './read-header';
import readEntities from './read-entities';
import readShaders from './read-shaders';

onmessage = function (message) { // eslint-disable-line
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
function parseBSP(src, tesselationLevel = 5) {
  postMessage({
    type: 'status',
    message: 'Map downloaded, parsing level geometry...'
  });

  var header = readHeader(src);

  if(header.tag !== 'IBSP' || header.version !== 47) {
    postMessage({
      type: 'status',
      message: 'Incompatible BSP version.'
    });

    return;
  }

  readEntities(header.lumps[0], src, (elements) => {
    postMessage({
      type: 'entities',
      entities: elements
    });
  });

  const shaders = readShaders(header.lumps[1], src);
  console.log(shaders);
}
