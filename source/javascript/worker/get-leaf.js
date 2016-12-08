import { vec3 } from 'gl-matrix';

export default function (pos, nodes, planes) {
  var index = 0;

  var node = null;
  var plane = null;
  var distance = 0;

  while (index >= 0) {
    node = nodes[index];
    plane = planes[node.plane];
    distance = vec3.dot(plane.normal, pos) - plane.distance;

    if (distance >= 0) {
      index = node.children[0];
    } else {
      index = node.children[1];
    }
  }

  return -(index+1);
}
