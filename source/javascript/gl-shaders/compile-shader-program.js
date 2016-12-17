export default function (gl, vertexSrc, fragmentSrc) {
  // Create fragment shader.
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(fragmentShader, fragmentSrc);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Create vertex shader.
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSrc);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    gl.deleteShader(vertexShader);
    return null;
  }

  // Attach shaders.
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    gl.deleteProgram(shaderProgram);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Set up attributes.
  const attribCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
  shaderProgram.attrib = {};

  for (let i = 0; i < attribCount; i++) {
    let attrib = gl.getActiveAttrib(shaderProgram, i);

    shaderProgram.attrib[attrib.name] = gl.getAttribLocation(shaderProgram, attrib.name);
  }

  // Set up attributes.
  const uniformCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
  shaderProgram.uniform = {};

  for (let i = 0; i < uniformCount; i++) {
    let uniform = gl.getActiveUniform(shaderProgram, i);
    shaderProgram.uniform[uniform.name] = gl.getUniformLocation(shaderProgram, uniform.name);
  }

  return shaderProgram;
}
