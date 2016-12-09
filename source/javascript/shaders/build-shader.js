import buildVertexShader from './build-vertex-shader';
import buildFragmentShader from './build-fragment-shader';

export default function (shader, stage) {
  return {
    vertex: buildVertexShader(shader, stage),
    fragment: buildFragmentShader(shader, stage)
  };
}
