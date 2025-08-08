export function drawGraph(
  gl: WebGLRenderingContext,
  data: [number, number][],
  options?: {
    color?: [number, number, number, number],
    lineWidth?: number
  }
) {
  if (data.length === 0) return;

  const color = options?.color || [0.2, 0.7, 1, 1];
  const lineWidth = options?.lineWidth || 2;

  // Determine data bounds
  const xs = data.map(p => p[0]), ys = data.map(p => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  // Normalize to WebGL space (-1..1)
  const verts = new Float32Array(data.flatMap(([x, y]) => [
    ((x - xMin) / (xMax - xMin)) * 2 - 1,
    ((y - yMin) / (yMax - yMin)) * 2 - 1
  ]));

  // Shaders
  const vs = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;
  const fs = `
    precision mediump float;
    uniform vec4 u_color;
    void main() { gl_FragColor = u_color; }
  `;

  const prog = createProgram(gl, vs, fs);
  gl.useProgram(prog);

  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const colorLoc = gl.getUniformLocation(prog, 'u_color');
  gl.uniform4fv(colorLoc, color);

  gl.lineWidth(lineWidth);
  gl.drawArrays(gl.LINE_STRIP, 0, data.length);
}

// Minimal helper functions
function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || 'Shader error');
  }
  return sh;
}

function createProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || 'Program error');
  }
  return p;
}
