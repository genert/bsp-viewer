import parseStage from './parse-stage';
import parseWaveform from './parse-waveform';

export default function (name, tokens) {
  var brace = tokens.next();
  if(brace != '{') {
    return null;
  }

  var shader = {
    name: name,
    cull: 'back',
    sky: false,
    blend: false,
    opaque: false,
    sort: 0,
    vertexDeforms: [],
    stages: []
  };

  // Parse a shader
  while(!tokens.EOF()) {
    var token = tokens.next().toLowerCase();
    if(token == '}') { break; }

    switch (token) {
      case '{': {
        var stage = parseStage(tokens);

        // I really really really don't like doing this, which basically just forces lightmaps to use the 'filter' blendmode
        // but if I don't a lot of textures end up looking too bright. I'm sure I'm jsut missing something, and this shouldn't
        // be needed.
        if(stage.isLightmap && (stage.hasBlendFunc)) {
          stage.blendSrc = 'GL_DST_COLOR';
          stage.blendDest = 'GL_ZERO';
        }

        // I'm having a ton of trouble getting lightingSpecular to work properly,
        // so this little hack gets it looking right till I can figure out the problem
        if(stage.alphaGen == 'lightingspecular') {
          stage.blendSrc = 'GL_ONE';
          stage.blendDest = 'GL_ZERO';
          stage.hasBlendFunc = false;
          stage.depthWrite = true;
          shader.stages = [];
        }

        if(stage.hasBlendFunc) { shader.blend = true; } else { shader.opaque = true; }

        shader.stages.push(stage);
      } break;

      case 'cull':
        shader.cull = tokens.next();
        break;

      case 'deformvertexes':
        var deform = {
          type: tokens.next().toLowerCase()
        };

        switch(deform.type) {
          case 'wave':
            deform.spread = 1.0 / parseFloat(tokens.next());
            deform.waveform = parseWaveform(tokens);
            break;
          default: deform = null; break;
        }

        if(deform) { shader.vertexDeforms.push(deform); }
        break;

      case 'sort':
        var sort = tokens.next().toLowerCase();
        switch(sort) {
          case 'portal': shader.sort = 1; break;
          case 'sky': shader.sort = 2; break;
          case 'opaque': shader.sort = 3; break;
          case 'banner': shader.sort = 6; break;
          case 'underwater': shader.sort = 8; break;
          case 'additive': shader.sort = 9; break;
          case 'nearest': shader.sort = 16; break;
          default: shader.sort = parseInt(sort); break;
        }
        break;

      case 'surfaceparm':
        var param = tokens.next().toLowerCase();

        switch(param) {
          case 'sky':
            shader.sky = true;
            break;
          default: break;
        }
        break;

      default: break;
    }
  }

  if(!shader.sort) {
    shader.sort = (shader.opaque ? 3 : 9);
  }

  return shader;
}
