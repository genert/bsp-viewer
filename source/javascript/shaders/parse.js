import buildShaderSource from './build-shader';
import ShaderTokenizer from './shader-tokenizer';
import parseShader from './parse-shader';

export default function (url, src, onload) {
  var shaders = [];

  var tokens = new ShaderTokenizer(src);

  // Parse a shader
  while(!tokens.EOF()) {
    var name = tokens.next();
    var shader = parseShader(name, tokens);

    if (shader) {
      shader.url = url;

      if (shader.stages) {
        for(var i = 0; i < shader.stages.length; ++i) {
          // Build a WebGL shader program out of the stage parameters set here
          shader.stages[i].shaderSrc = buildShaderSource(shader, shader.stages[i]);
        }
      }
    }

    shaders.push(shader);
  }

  // Send shaders to gl Thread
  onload(shaders);
}
