import parseWaveform from './parse-waveform';

export default function (tokens) {
  let stage = {
    map: null,
    clamp: false,
    tcGen: 'base',
    rgbGen: 'identity',
    rgbWaveform: null,
    alphaGen: '1.0',
    alphaFunc: null,
    alphaWaveform: null,
    blendSrc: 'GL_ONE',
    blendDest: 'GL_ZERO',
    hasBlendFunc: false,
    tcMods: [],
    animMaps: [],
    animFreq: 0,
    depthFunc: 'lequal',
    depthWrite: true
  };

  // Parse a shader
  while (!tokens.EOF()) {
    var token = tokens.next();

    if (token === '}') {
      break;
    }

    switch (token.toLowerCase()) {
      case 'clampmap':
        stage.clamp = true;
        break;

      case 'map':
        stage.map = tokens.next().replace(/(\.jpg|\.tga)/, '.png');
        break;

      case 'animmap':
        stage.map = 'anim';
        stage.animFreq = parseFloat(tokens.next());
        var nextMap = tokens.next();
        while(nextMap.match(/(\.jpg|\.tga)/)) {
          stage.animMaps.push(nextMap.replace(/(\.jpg|\.tga)/, '.png'));
          nextMap = tokens.next();
        }
        tokens.prev();
        break;

      case 'rgbgen':
        stage.rgbGen = tokens.next().toLowerCase();

        switch (stage.rgbGen) {
          case 'wave':
            stage.rgbWaveform = parseWaveform(tokens);

            if (!stage.rgbWaveform) {
              stage.rgbGen == 'identity';
            }

            break;
        }
        break;

      case 'alphagen':
        stage.alphaGen = tokens.next().toLowerCase();

        switch (stage.alphaGen) {
          case 'wave':
            stage.alphaWaveform = parseWaveform(tokens);

            if(!stage.alphaWaveform) {
              stage.alphaGen == '1.0';
            }
            break;

          default: break;
        }
        break;

      case 'alphafunc':
        stage.alphaFunc = tokens.next().toUpperCase();
        break;

      case 'blendfunc':
        stage.blendSrc = tokens.next();
        stage.hasBlendFunc = true;

        if(!stage.depthWriteOverride) {
          stage.depthWrite = false;
        }

        switch (stage.blendSrc) {
          case 'add':
            stage.blendSrc = 'GL_ONE';
            stage.blendDest = 'GL_ONE';
            break;

          case 'blend':
            stage.blendSrc = 'GL_SRC_ALPHA';
            stage.blendDest = 'GL_ONE_MINUS_SRC_ALPHA';
            break;

          case 'filter':
            stage.blendSrc = 'GL_DST_COLOR';
            stage.blendDest = 'GL_ZERO';
            break;

          default:
            stage.blendDest = tokens.next();
            break;
        }
        break;

      case 'depthfunc':
        stage.depthFunc = tokens.next().toLowerCase();
        break;

      case 'depthwrite':
        stage.depthWrite = true;
        stage.depthWriteOverride = true;
        break;

      case 'tcmod': {
        const tcMod = {
          type: tokens.next().toLowerCase()
        };

        switch (tcMod.type) {
          case 'rotate':
            tcMod.angle = parseFloat(tokens.next()) * (3.1415/180);
            break;

          case 'scale':
            tcMod.scaleX = parseFloat(tokens.next());
            tcMod.scaleY = parseFloat(tokens.next());
            break;

          case 'scroll':
            tcMod.sSpeed = parseFloat(tokens.next());
            tcMod.tSpeed = parseFloat(tokens.next());
            break;

          case 'stretch':
            tcMod.waveform = parseWaveform(tokens);

            if(!tcMod.waveform) {
              tcMod.type == null;
            }

            break;

          case 'turb':
            tcMod.turbulance = {
              base: parseFloat(tokens.next()),
              amp: parseFloat(tokens.next()),
              phase: parseFloat(tokens.next()),
              freq: parseFloat(tokens.next())
            };
            break;

          default: tcMod.type == null; break;
        }

        if (tcMod.type) {
          stage.tcMods.push(tcMod);
        }

        break;
      }

      case 'tcgen':
        stage.tcGen = tokens.next();
        break;

      default: break;
    }
  }

  if (stage.blendSrc === 'GL_ONE' && stage.blendDest === 'GL_ZERO') {
    stage.hasBlendFunc = false;
    stage.depthWrite = true;
  }

  stage.isLightmap = stage.map == '$lightmap';

  return stage;
}
