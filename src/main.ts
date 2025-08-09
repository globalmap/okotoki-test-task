import { loadImage, createProgram } from './utils';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import { TextRenderer } from './textRenderer';
import { drawGraph } from './graph';
import { generatePoints } from './utils/generatePoints';

(async () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl');
  if (!gl) {
    alert('WebGL not supported');
    return;
  }

  const pixelRange = 48;

  // Load atlas image and JSON from /public folder
  const [atlasImage, atlasData] = await Promise.all([
    loadImage('/atlas_regular.png'),
    fetch('/atlas_regular.json').then(res => res.json())
  ]);

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  // Setup texture
  const texture = gl.createTexture();
  if (!texture) throw new Error('Failed to create texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasImage);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Setup orthographic projection matrix for 2D pixel space
  function ortho(left: number, right: number, bottom: number, top: number) {
    return new Float32Array([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -1, 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1
    ]);
  }
  const proj = ortho(0, canvas.width, canvas.height, 0);
  const u_projection = gl.getUniformLocation(program, 'u_projection');
  gl.uniformMatrix4fv(u_projection, false, proj);

  // Initialize the text renderer
  const textRenderer = new TextRenderer(gl, atlasData, atlasImage, pixelRange);
  textRenderer.setupAttributes(program);

  const title = 'BTC / USDT';
  const fontSize = 26;

  const textWidth = textRenderer.measureTextWidth(title, fontSize);

  // Render some text
  textRenderer.renderText(program, title, (canvas.width - textWidth) / 2, 40, fontSize, [0, 0, 0, 1]);

  // Generate 200 points simulating currency data, starting at 38.5 with 0.5% volatility
  const currencyData = generatePoints(200, 38.5, 0.005); 

  drawGraph(gl, currencyData, {
    color: [1, 0.5, 0, 1],
    lineWidth: 10,
  });
})();
