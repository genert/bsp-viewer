export default function (gl, cull) {
  if (!cull) {
    return gl.FRONT;
  }

  switch (cull.toLowerCase()) {
    case 'disable':
    case 'none': return null;
    case 'front': return gl.BACK;
    case 'back':
    default: return gl.FRONT;
  }
}
