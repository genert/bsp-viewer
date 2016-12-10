export default function (gl, shader) {
  if (!shader) {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
  } else if (shader.cull && !shader.sky) {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(shader.cull);
  } else {
    gl.disable(gl.CULL_FACE);
  }

  return true;
}
