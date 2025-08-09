import { createProgram } from "./utils";

function createFillVertices(points: [number, number][]): Float32Array {
  const fillVerts: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    fillVerts.push(x, -1); // projection onto X axis (lower bound)
    fillVerts.push(x, y);  // the graph point itself
  }

  return new Float32Array(fillVerts);
}


export function drawGraph(
  gl: WebGLRenderingContext,
  data: [number, number][],
  options?: {
    color?: [number, number, number, number],
    fillColor?: [number, number, number, number],
    lineWidth?: number
  }
) {
  if (data.length === 0) return;

  const color = options?.color || [0.2, 0.7, 1, 1];
  const fillColor = options?.fillColor || [0.2, 0.7, 1, 0.3];
  const lineWidth = options?.lineWidth || 2;

  // Determine data bounds
  const xs = data.map(p => p[0]), ys = data.map(p => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  // Limit the graph to the upper half
  const yScale = 0.2;        
  const yOffset = 0.0;      

  // Normalize points
  const normalized = data.flatMap(([x, y]) => [
    ((x - xMin) / (xMax - xMin)) * 2 - 1,
    (((y - yMin) / (yMax - yMin)) * 2 - 1) * yScale + yOffset
  ]);

  // Compile shaders (the same for line and fill)
  const vs = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;
  const fs = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;

  const program = createProgram(gl, vs, fs);
  gl.useProgram(program);

  const aPos = gl.getAttribLocation(program, 'a_pos');
  const uColor = gl.getUniformLocation(program, 'u_color');

  // --- Draw fill ---

  // Create vertices for fill
  const fillVerts = createFillVertices(
    normalized.reduce<[number, number][]>((acc, val, i) => {
      if (i % 2 === 0) acc.push([val, normalized[i + 1]]);
      return acc;
    }, [])
  );

  const fillBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, fillBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fillVerts, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.uniform4fv(uColor, fillColor);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, fillVerts.length / 2);

  // --- Draw line on top ---
  const lineVerts = new Float32Array(normalized);
  const lineBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, lineVerts, gl.STATIC_DRAW);

  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(uColor, color);
  gl.lineWidth(lineWidth);
  gl.drawArrays(gl.LINE_STRIP, 0, data.length);
}
