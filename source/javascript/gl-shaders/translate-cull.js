import { normalizeFactor } from '../common/shaders';

export default function (gl, cull) {
  if (!cull) {
    return gl.FRONT;
  }

  switch (normalizeFactor(cull)) {
    case 'disable':
    case 'none': return null;
    case 'front': return gl.BACK;
    case 'back':
    default: return gl.FRONT;
  }
}
