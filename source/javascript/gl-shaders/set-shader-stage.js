export default function (gl, shader, shaderStage, time) {
  var stage = shaderStage;

  if (!stage) {
    stage = defaultShader.stages[0];
  }

  if(stage.animFreq) {
    // Texture animation seems like a natural place for setInterval, but that approach has proved error prone.
    // It can easily get out of sync with other effects (like rgbGen pulses and whatnot) which can give a
    // jittery or flat out wrong appearance. Doing it this way ensures all effects are synced.
    var animFrame = Math.floor(time*stage.animFreq) % stage.animTexture.length;
    stage.texture = stage.animTexture[animFrame];
  }

  gl.blendFunc(stage.blendSrc, stage.blendDest);

  if(stage.depthWrite && !shader.sky) {
    gl.depthMask(true);
  } else {
    gl.depthMask(false);
  }

  gl.depthFunc(stage.depthFunc);

  var program = stage.program;
  if(!program) {
    if(shader.model) {
      program = modelProgram;
    } else {
      program = defaultProgram;
    }
  }

  gl.useProgram(program);

  var texture = stage.texture;

  if(!texture) {
    texture = defaultTexture;
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(program.uniform.texture, 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (program.uniform.lightmap && config.LIGHTMAPS_ENABLED) {
    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(program.uniform.lightmap, 1);
    gl.bindTexture(gl.TEXTURE_2D, lightmap);
  }

  if(program.uniform.time) {
    gl.uniform1f(program.uniform.time, time);
  }

  return program;
}
