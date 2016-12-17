import { normalizeFactor } from '../common/shaders';

export default function (gl, blend) {
  if(!blend) {
    return gl.ONE;
  }

  switch (normalizeFactor(blend, true)) {
    case 'GL_ONE': return gl.ONE;
    case 'GL_ZERO': return gl.ZERO;
    case 'GL_DST_COLOR': return gl.DST_COLOR;
    case 'GL_ONE_MINUS_DST_COLOR': return gl.ONE_MINUS_DST_COLOR;
    case 'GL_SRC_ALPHA': return gl.SRC_ALPHA;
    case 'GL_ONE_MINUS_SRC_ALPHA': return gl.ONE_MINUS_SRC_ALPHA;
    case 'GL_SRC_COLOR': return gl.SRC_COLOR;
    case 'GL_ONE_MINUS_SRC_COLOR': return gl.ONE_MINUS_SRC_COLOR;
    default: return gl.ONE;
  }
}
