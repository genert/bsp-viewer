import ShaderBuilder from './shader-builder';

export default function (stageShader, stage) {
  const shader = new ShaderBuilder();

  shader.addVaryings({
    vTexCoord: 'vec2',
    vColor: 'vec4',
  });

  shader.addUniforms({
    texture: 'sampler2D',
    time: 'float',
  });

  shader.addLines(['vec4 texColor = texture2D(texture, vTexCoord.st);']);

  switch (stage.rgbGen) {
    case 'vertex':
      shader.addLines(['vec3 rgb = texColor.rgb * vColor.rgb;']);
      break;

    case 'wave':
      shader.addWaveform('rgbWave', stage.rgbWaveform);
      shader.addLines(['vec3 rgb = texColor.rgb * rgbWave;']);
      break;

    default:
      shader.addLines(['vec3 rgb = texColor.rgb;']);
      break;
  }

  switch (stage.alphaGen) {
    case 'wave':
      shader.addWaveform('alpha', stage.alphaWaveform);
      break;

    case 'lightingspecular':
      // For now this is VERY special cased. May not work well with all instances of lightingSpecular
      shader.addUniforms({
        lightmap: 'sampler2D'
      });
      shader.addVaryings({
        vLightCoord: 'vec2',
        vLight: 'float'
      });
      shader.addLines([
        'vec4 light = texture2D(lightmap, vLightCoord.st);',
        'rgb *= light.rgb;',
        'rgb += light.rgb * texColor.a * 0.6;', // This was giving me problems, so I'm ignorning an actual specular calculation for now
        'float alpha = 1.0;'
      ]);
      break;

    default:
      shader.addLines(['float alpha = texColor.a;']);
      break;
  }

  if (stage.alphaFunc) {
    switch (stage.alphaFunc) {
      case 'GT0':
        shader.addLines([
          'if(alpha == 0.0) { discard; }'
        ]);
        break;

      case 'LT128':
        shader.addLines([
          'if(alpha >= 0.5) { discard; }'
        ]);
        break;

      case 'GE128':
        shader.addLines([
          'if(alpha < 0.5) { discard; }'
        ]);
        break;

      default:
        break;
    }
  }

  shader.addLines(['gl_FragColor = vec4(rgb, alpha);']);

  return shader.getSource();
}
