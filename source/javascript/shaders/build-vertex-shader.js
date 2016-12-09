import ShaderBuilder from './shader-builder';

export default function(stageShader, stage) {
  const shader = new ShaderBuilder();

  shader.addAttribs({
    position: 'vec3',
    normal: 'vec3',
    color: 'vec4',
  });

  shader.addVaryings({
    vTexCoord: 'vec2',
    vColor: 'vec4',
  });

  shader.addUniforms({
    modelViewMat: 'mat4',
    projectionMat: 'mat4',
    time: 'float',
  });

  if (stage.isLightmap) {
    shader.addAttribs({ lightCoord: 'vec2' });
  } else {
    shader.addAttribs({ texCoord: 'vec2' });
  }

  shader.addLines(['vec3 defPosition = position;']);

  for (let i = 0; i < stageShader.vertexDeforms.length; ++i) {
    const deform = stageShader.vertexDeforms[i];

    switch (deform.type) {
      case 'wave':
        var name = 'deform' + i;
        var offName = 'deformOff' + i;

        shader.addLines([
          'float ' + offName + ' = (position.x + position.y + position.z) * ' + deform.spread.toFixed(4) + ';'
        ]);

        var phase = deform.waveform.phase;
        deform.waveform.phase = phase.toFixed(4) + ' + ' + offName;
        shader.addWaveform(name, deform.waveform);
        deform.waveform.phase = phase;

        shader.addLines([
          'defPosition += normal * ' + name + ';'
        ]);

        break;

      default:
        break;
    }
  }

  shader.addLines(['vec4 worldPosition = modelViewMat * vec4(defPosition, 1.0);']);
  shader.addLines(['vColor = color;']);

  if (stage.tcGen == 'environment') {
    shader.addLines([
      'vec3 viewer = normalize(-worldPosition.xyz);',
      'float d = dot(normal, viewer);',
      'vec3 reflected = normal*2.0*d - viewer;',
      'vTexCoord = vec2(0.5, 0.5) + reflected.xy * 0.5;'
    ]);
  } else {
    // Standard texturing
    if (stage.isLightmap) {
      shader.addLines(['vTexCoord = lightCoord;']);
    } else {
      shader.addLines(['vTexCoord = texCoord;']);
    }
  }

  // tcMods
  for (let i = 0; i < stage.tcMods.length; ++i) {
    const tcMod = stage.tcMods[i];

    switch (tcMod.type) {
      case 'rotate':
        shader.addLines([
          'float r = ' + tcMod.angle.toFixed(4) + ' * time;',
          'vTexCoord -= vec2(0.5, 0.5);',
          'vTexCoord = vec2(vTexCoord.s * cos(r) - vTexCoord.t * sin(r), vTexCoord.t * cos(r) + vTexCoord.s * sin(r));',
          'vTexCoord += vec2(0.5, 0.5);',
        ]);
        break;

      case 'scroll':
        shader.addLines([
          'vTexCoord += vec2(' + tcMod.sSpeed.toFixed(4) + ' * time, ' + tcMod.tSpeed.toFixed(4) + ' * time);'
        ]);
        break;

      case 'scale':
        shader.addLines([
          'vTexCoord *= vec2(' + tcMod.scaleX.toFixed(4) + ', ' + tcMod.scaleY.toFixed(4) + ');'
        ]);
        break;

      case 'stretch':
        shader.addWaveform('stretchWave', tcMod.waveform);
        shader.addLines([
          'stretchWave = 1.0 / stretchWave;',
          'vTexCoord *= stretchWave;',
          'vTexCoord += vec2(0.5 - (0.5 * stretchWave), 0.5 - (0.5 * stretchWave));',
        ]);
        break;

      case 'turb':
        var tName = 'turbTime' + i;
        shader.addLines([
          'float ' + tName + ' = ' + tcMod.turbulance.phase.toFixed(4) + ' + time * ' + tcMod.turbulance.freq.toFixed(4) + ';',
          'vTexCoord.s += sin( ( ( position.x + position.z )* 1.0/128.0 * 0.125 + ' + tName + ' ) * 6.283) * ' + tcMod.turbulance.amp.toFixed(4) + ';',
          'vTexCoord.t += sin( ( position.y * 1.0/128.0 * 0.125 + ' + tName + ' ) * 6.283) * ' + tcMod.turbulance.amp.toFixed(4) + ';'
        ]);
        break;

      default:
        break;
    }
  }

  switch (stage.alphaGen) {
    case 'lightingspecular':
      shader.addAttribs({ lightCoord: 'vec2' });
      shader.addVaryings({ vLightCoord: 'vec2' });
      shader.addLines([ 'vLightCoord = lightCoord;' ]);
      break;

    default:
      break;
  }

  shader.addLines(['gl_Position = projectionMat * worldPosition;']);

  return shader.getSource();
}
