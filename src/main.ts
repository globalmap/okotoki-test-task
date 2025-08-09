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
  const [atlasImage, atlasData, boldAtlasImage, boldAtlasData] = await Promise.all([
    loadImage('/atlas_regular.png'),
    fetch('/atlas_regular.json').then(res => res.json()),
    loadImage('/atlas_bold.png'),
    fetch('/atlas_bold.json').then(res => res.json())
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
  const textRenderer = new TextRenderer(gl, pixelRange);
  textRenderer.addAtlas('regular', atlasData, atlasImage);
  textRenderer.addAtlas('bold', boldAtlasData, boldAtlasImage);
  textRenderer.setupAttributes(program);

  const title = 'BTC / USDT · Binance';
  const fontSize = 24;

  // Measure and render the bold part of the title
  const boldPart = 'BTC / USDT';
  const boldFontSize = 24;
  const boldTextWidth = textRenderer.measureTextWidth(boldPart, boldFontSize, 'bold');
  const boldX = (canvas.width - textRenderer.measureTextWidth(title, fontSize, 'regular')) / 2;

  // Render the bold part in gray
  textRenderer.renderText(program, boldPart, boldX, 40, boldFontSize, [0.4, 0.4, 0.4, 1], 'bold');

  // Render the remaining part of the title in regular font
  const regularPart = ' · Binance';
  const regularX = boldX + boldTextWidth;

  textRenderer.renderText(program, regularPart, regularX, 40, fontSize, [0.5, 0.5, 0.5, 1], 'regular');

  // Render the price in bold and black
  const price = '114,900.00';
  const priceFontSize = 48;
  const priceWidth = textRenderer.measureTextWidth(price, priceFontSize, 'bold');
  const priceX = (canvas.width - priceWidth) / 2;

  textRenderer.renderText(program, price, priceX, 60, priceFontSize, [0, 0, 0, 1], 'bold');

  // Render the percentage change in blue
  const percentageChange = '1.00%';
  const percentageFontSize = 20;
  const percentageWidth = textRenderer.measureTextWidth(percentageChange, percentageFontSize, 'regular');
  const percentageX = (canvas.width - percentageWidth) / 2 - 40; // Adjusted spacing for better alignment

  textRenderer.renderText(program, percentageChange, percentageX, 130, percentageFontSize, [0, 0, 1, 1], 'regular');

  // Render the additional value in blue
  const additionalValue = '1,140.87';
  const additionalFontSize = 20;
  const additionalValueWidth = textRenderer.measureTextWidth(additionalValue, additionalFontSize, 'regular');
  const additionalX = (canvas.width - additionalValueWidth) / 2 + 40; // Adjusted spacing for better alignment

  textRenderer.renderText(program, additionalValue, additionalX, 130, additionalFontSize, [0, 0, 1, 1], 'regular');


  // Generate 200 points simulating currency data, starting at 38.5 with 0.5% volatility
  const currencyData = generatePoints(200, 38.5, 0.005);

  drawGraph(gl, currencyData, {
    color: [1, 0.5, 0, 1],
    lineWidth: 10,
  });

  // Add a new point every 100ms
  setInterval(() => {
    const lastPoint = currencyData[currencyData.length - 1];
    const newPoint = generatePoints(1, lastPoint[1], 0.005)[0]; // Generate only one new point
    currencyData.push([lastPoint[0] + 1, newPoint[1]]); // Append the new point with incremented x value
    currencyData.shift(); // Keep the array size constant

    // Clear the canvas and reset background color
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Reset WebGL state
    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Re-initialize text renderer attributes
    textRenderer.setupAttributes(program);

    // Re-render the text
    textRenderer.renderText(program, boldPart, boldX, 40, boldFontSize, [0.4, 0.4, 0.4, 1], 'bold');
    textRenderer.renderText(program, regularPart, regularX, 40, fontSize, [0.5, 0.5, 0.5, 1], 'regular');
    textRenderer.renderText(program, price, priceX, 60, priceFontSize, [0, 0, 0, 1], 'bold');
    textRenderer.renderText(program, percentageChange, percentageX, 130, percentageFontSize, [0, 0, 1, 1], 'regular');
    textRenderer.renderText(program, additionalValue, additionalX, 130, additionalFontSize, [0, 0, 1, 1], 'regular');

    // Re-draw the graph
    drawGraph(gl, currencyData, {
      color: [1, 0.5, 0, 1],
      lineWidth: 10,
    });
  }, 300);
})();
