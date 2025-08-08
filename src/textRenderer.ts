interface Glyph {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
}

interface AtlasData {
  info: {
    size: number;
  };
  common: {
    scaleW: number;
    scaleH: number;
  };
  chars: Glyph[];
}

const quadVerts = new Float32Array([
  // x, y, u, v
  0, 0, 0, 0,
  1, 0, 1, 0,
  0, 1, 0, 1,
  0, 1, 0, 1,
  1, 0, 1, 0,
  1, 1, 1, 1
]);

export class TextRenderer {
  private gl: WebGLRenderingContext;
  private atlasData: AtlasData;
  private atlasWidth: number;
  private atlasHeight: number;
  private pixelRange: number;
  private buffer: WebGLBuffer;

  constructor(gl: WebGLRenderingContext, atlasData: AtlasData, atlasImage: HTMLImageElement, pixelRange: number) {
    this.gl = gl;
    this.atlasData = atlasData;
    this.atlasWidth = atlasImage.width;
    this.atlasHeight = atlasImage.height;
    this.pixelRange = pixelRange;

    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Failed to create buffer');
    this.buffer = buffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.DYNAMIC_DRAW);
  }

  public setupAttributes(program: WebGLProgram) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const a_pos = gl.getAttribLocation(program, 'a_pos');
    const a_uv = gl.getAttribLocation(program, 'a_uv');

    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(a_uv);
    gl.vertexAttribPointer(a_uv, 2, gl.FLOAT, false, 16, 8);
  }

  public renderText(program: WebGLProgram, text: string, x: number, y: number, size: number, color: [number, number, number, number]) {
    const gl = this.gl;
    const scale = size / this.atlasData.info.size;
    let cursorX = x;
    let cursorY = y;

    const u_color = gl.getUniformLocation(program, 'u_color');
    const u_pxRange = gl.getUniformLocation(program, 'u_pxRange');
    const u_scale = gl.getUniformLocation(program, 'u_scale');
    const u_translation = gl.getUniformLocation(program, 'u_translation');

    gl.uniform4f(u_color, color[0], color[1], color[2], color[3]);
    gl.uniform1f(u_pxRange, this.pixelRange / this.atlasHeight);

    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      const glyph = this.atlasData.chars.find(g => g.id === ch);
      if (!glyph) {
        cursorX += scale * this.atlasData.info.size * 0.5;
        continue;
      }

      const uvLeft = glyph.x / this.atlasWidth;
      const uvRight = (glyph.x + glyph.width) / this.atlasWidth;
      const uvTop = glyph.y / this.atlasHeight;
      const uvBottom = (glyph.y + glyph.height) / this.atlasHeight;

      const glyphWidth = glyph.width;
      const glyphHeight = glyph.height;

      const glyphX = cursorX + glyph.xoffset * scale;
      const glyphY = cursorY + glyph.yoffset * scale;

      gl.uniform2f(u_scale, glyphWidth * scale, glyphHeight * scale);
      gl.uniform2f(u_translation, glyphX, glyphY);

      const uvVerts = new Float32Array([
        0, 0, uvLeft, uvTop,
        1, 0, uvRight, uvTop,
        0, 1, uvLeft, uvBottom,
        0, 1, uvLeft, uvBottom,
        1, 0, uvRight, uvTop,
        1, 1, uvRight, uvBottom,
      ]);
      const vertsGlyph = new Float32Array(24);
      for (let v = 0; v < 6; v++) {
        vertsGlyph[v * 4 + 0] = quadVerts[v * 4 + 0];
        vertsGlyph[v * 4 + 1] = quadVerts[v * 4 + 1];
        vertsGlyph[v * 4 + 2] = uvVerts[v * 4 + 2];
        vertsGlyph[v * 4 + 3] = uvVerts[v * 4 + 3];
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertsGlyph);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      cursorX += glyph.xadvance * scale;
    }
  }
}
