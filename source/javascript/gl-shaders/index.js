//
// Transforms a parsed Q3 shader definition into a set of WebGL compatible states
//
import { mat4 } from 'gl-matrix';
import config from '../config';
import translateDepthFunc from './translate-depth-func';
import translateCull from './translate-cull';
import translateBlend from './translate-blend';
import createSolidTexture from './create-solid-texture';
import loadTextureByURL from './load-texture-by-url';
import compileShaderProgram from './compile-shader-program';

import mainVertexShader from '../../shaders/main.vert';
import mainFragmentShader from '../../shaders/main.frag';
import modelFragmentShader from '../../shaders/model.frag';

var q3glshader = {};

q3glshader.lightmap = null;
q3glshader.white = null;
q3glshader.defaultShader = null;
q3glshader.defaultTexture = null;
q3glshader.texMat = mat4.create();
q3glshader.defaultProgram = null;

q3glshader.init = function(gl, lightmap = null) {
  if (config.LIGHTMAPS_ENABLED) {
    q3glshader.lightmap = lightmap;
  }

  q3glshader.white = createSolidTexture(gl, [255,255,255,255]);

  q3glshader.defaultProgram = compileShaderProgram(gl, mainVertexShader, mainFragmentShader);
  q3glshader.modelProgram = compileShaderProgram(gl, mainVertexShader, modelFragmentShader);

  var image = new Image();
  q3glshader.defaultTexture = gl.createTexture();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, q3glshader.defaultTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src = '/no-shader.png';

  // Load default stage
  q3glshader.defaultShader = q3glshader.buildDefault(gl);
};

//
// Shader building
//

q3glshader.build = function(gl, shader) {
  var glShader = {
    cull: translateCull(gl, shader.cull),
    sort: shader.sort,
    sky: shader.sky,
    blend: shader.blend,
    name: shader.name,
    stages: []
  };

  for(var j = 0; j < shader.stages.length; ++j) {
    var stage = shader.stages[j];
    var glStage = stage;

    glStage.texture = null;
    glStage.blendSrc = translateBlend(gl, stage.blendSrc);
    glStage.blendDest = translateBlend(gl, stage.blendDest);
    glStage.depthFunc = translateDepthFunc(gl, stage.depthFunc);

    glShader.stages.push(glStage);
  }

  return glShader;
};

q3glshader.buildDefault = function(gl, surface) {
  var diffuseStage = {
    map: (surface ? surface.shaderName + '.jpg' : null),
    isLightmap: false,
    blendSrc: gl.ONE,
    blendDest: gl.ZERO,
    depthFunc: gl.LEQUAL,
    depthWrite: true
  };

  if(surface) {
    q3glshader.loadTexture(gl, surface, diffuseStage);
  } else {
    diffuseStage.texture = q3glshader.defaultTexture;
  }

  var glShader = {
    cull: gl.FRONT,
    blend: false,
    sort: 3,
    stages: [ diffuseStage ]
  };

  return glShader;
};

//
// Texture loading
//
q3glshader.loadShaderMaps = function(gl, surface, shader) {
  for (var i = 0; i < shader.stages.length; ++i) {
    var stage = shader.stages[i];
    if(stage.map) {
      q3glshader.loadTexture(gl, surface, stage);
    }

    if (stage.shaderSrc && !stage.program) {
      stage.program = compileShaderProgram(gl, stage.shaderSrc.vertex, stage.shaderSrc.fragment);
    }
  }
};

q3glshader.loadTexture = function(gl, surface, stage) {
  if (!stage.map) {
    stage.texture = q3glshader.white;
    return;
  } else if (stage.map == '$lightmap') {
    stage.texture = (surface.geomType != 3 ? q3glshader.lightmap : q3glshader.white);
    return;
  } else if (stage.map == '$whiteimage') {
    stage.texture = q3glshader.white;
    return;
  }

  stage.texture = q3glshader.defaultTexture;

  if (stage.map == 'anim') {
    stage.animTexture = [];
    for(var i = 0; i < stage.animMaps.length; ++i) {
      var animLoad = function(i) {
        stage.animTexture[i] = q3glshader.defaultTexture;
        loadTextureByURL(gl, stage, stage.animMaps[i], function(texture) {
          stage.animTexture[i] = texture;
        });
      };
      animLoad(i);
    }
    stage.animFrame = 0;
  } else {
    loadTextureByURL(gl, stage, stage.map, function(texture) {
      stage.texture = texture;
    });
  }
};

//
// Render state setup
//

q3glshader.setShaderStage = function(gl, shader, shaderStage, time) {
  var stage = shaderStage;
  if(!stage) {
    stage = q3glshader.defaultShader.stages[0];
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
      program = q3glshader.modelProgram;
    } else {
      program = q3glshader.defaultProgram;
    }
  }

  gl.useProgram(program);

  var texture = stage.texture;
  if(!texture) { texture = q3glshader.defaultTexture; }

  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(program.uniform.texture, 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if(program.uniform.lightmap && config.LIGHTMAPS_ENABLED) {
    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(program.uniform.lightmap, 1);
    gl.bindTexture(gl.TEXTURE_2D, q3glshader.lightmap);
  }

  if(program.uniform.time) {
    gl.uniform1f(program.uniform.time, time);
  }

  return program;
};

export default q3glshader;
