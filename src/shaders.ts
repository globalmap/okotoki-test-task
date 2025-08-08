export const vertexShaderSource = `
attribute vec2 a_pos;
attribute vec2 a_uv;

uniform mat4 u_projection;
uniform vec2 u_translation;
uniform vec2 u_scale;

varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  vec2 pos = a_pos * u_scale + u_translation;
  gl_Position = u_projection * vec4(pos, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `
precision highp float;

uniform sampler2D u_texture;
uniform vec4 u_color;
uniform float u_pxRange;

varying vec2 v_uv;

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  vec3 sample = texture2D(u_texture, v_uv).rgb;
  float sd = median(sample.r, sample.g, sample.b) - 0.5;

  float smoothing = u_pxRange * 0.5;

  float alpha = smoothstep(-smoothing, smoothing, sd);

  gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
}
`;
