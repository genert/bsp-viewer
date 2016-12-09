//
// Default Shaders
//
export const DEFAULT_VERTEX_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;
attribute vec2 lightCoord;
attribute vec4 color;

varying vec2 vTexCoord;
varying vec2 vLightmapCoord;
varying vec4 vColor;

uniform mat4 modelViewMat;
uniform mat4 projectionMat;

void main(void) {
  vec4 worldPosition = modelViewMat * vec4(position, 1.0);
  vTexCoord = texCoord;
  vColor = color;
  vLightmapCoord = lightCoord;
  gl_Position = projectionMat * worldPosition;
}
`;

export const DEFAULT_FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec2 vLightmapCoord;
uniform sampler2D texture;
uniform sampler2D lightmap;

void main(void) {
  vec4 diffuseColor = texture2D(texture, vTexCoord);
  vec4 lightColor = texture2D(lightmap, vLightmapCoord);
  gl_FragColor = vec4(diffuseColor.rgb * lightColor.rgb, diffuseColor.a);
}
`;

export const DEFAULT_MODEL_FRAGMENT = `
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTexCoord;
varying vec4 vColor;
uniform sampler2D texture;

void main(void) {
  vec4 diffuseColor = texture2D(texture, vTexCoord);
  gl_FragColor = vec4(diffuseColor.rgb * vColor.rgb, diffuseColor.a);
}
`;
