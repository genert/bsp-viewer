//
// WebGL Shader builder utility
//
class shaderBuilder {
  attrib = {};
  varying = {};
  uniform = {};

  functions = {};

  statements = [];

  addAttribs (attribs) {
    for (var name in attribs) {
      this.attrib[name] = 'attribute ' + attribs[name] + ' ' + name + ';';
    }
  }

  addVaryings (varyings) {
    for (var name in varyings) {
      this.varying[name] = 'varying ' + varyings[name] + ' ' + name + ';';
    }
  }

  addUniforms (uniforms) {
    for (var name in uniforms) {
      this.uniform[name] = 'uniform ' + uniforms[name] + ' ' + name + ';';
    }
  }

  addFunction (name, lines) {
    this.functions[name] = lines.join('\n');
  }

  addLines (statements) {
    for (let i = 0; i < statements.length; ++i) {
      this.statements.push(statements[i]);
    }
  }

  getSource () {
    var src = '\
    #ifdef GL_ES \n\
    precision highp float; \n\
    #endif \n';

    for(let i in this.attrib) {
      src += this.attrib[i] + '\n';
    }

    for(let i in this.varying) {
      src += this.varying[i] + '\n';
    }

    for(let i in this.uniform) {
      src += this.uniform[i] + '\n';
    }

    for(let i in this.functions) {
      src += this.functions[i] + '\n';
    }

    src += 'void main(void) {\n\t';
    src += this.statements.join('\n\t');
    src += '\n}\n';

    return src;
  }

  addWaveform (name, wf, timeVar) {
    let funcName = null;

    if(!wf) {
      this.statements.push('float ' + name + ' = 0.0;');
      return;
    }

    if(!timeVar) { timeVar = 'time'; }

    if(typeof(wf.phase) === 'number') {
      wf.phase = wf.phase.toFixed(4);
    }

    switch(wf.funcName) {
      case 'sin':
        this.statements.push('float ' + name + ' = ' + wf.base.toFixed(4) + ' + sin((' + wf.phase + ' + ' + timeVar + ' * ' + wf.freq.toFixed(4) + ') * 6.283) * ' + wf.amp.toFixed(4) + ';');
        return;
      case 'square': funcName = 'square'; this.addSquareFunc(); break;
      case 'triangle': funcName = 'triangle'; this.addTriangleFunc(); break;
      case 'sawtooth': funcName = 'fract'; break;
      case 'inversesawtooth': funcName = '1.0 - fract'; break;
      default:
        this.statements.push('float ' + name + ' = 0.0;');
        return;
    }
    this.statements.push('float ' + name + ' = ' + wf.base.toFixed(4) + ' + ' + funcName + '(' + wf.phase + ' + ' + timeVar + ' * ' + wf.freq.toFixed(4) + ') * ' + wf.amp.toFixed(4) + ';');
  }

  addSquareFunc () {
    this.addFunction('square', [
      'float square(float val) {',
      '   return (mod(floor(val*2.0)+1.0, 2.0) * 2.0) - 1.0;',
      '}',
    ]);
  }

  addTriangleFunc () {
    this.addFunction('triangle', [
      'float triangle(float val) {',
      '   return abs(2.0 * fract(val) - 1.0);',
      '}',
    ]);
  }
}

export default shaderBuilder;
