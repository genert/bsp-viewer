//
// Parses Quake 3 shader files (.shader)
//
import request from '../net/request';
import parse from './parse';

export default function (sources, onload) {
  for (let i = 0; i < sources.length; i++) {
    const url = sources[i];

    request(url)
      .then((response) => {
        parse(url, response, onload);
      });
  }
}
