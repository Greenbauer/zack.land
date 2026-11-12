// The WebGL set-up shared by the page's two picture effects, the pointer's
// bend (mediaBender.ts) and the melt (mediaMelter.ts): each draws a fragment
// shader over one quad that covers its whole canvas.

// The quad's vertex shader, its corners at attribute 0 (`position`), passing
// on where each pixel is from the canvas's top left.
const VERTEX = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    // From the top left, as the page counts.
    vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

// A program drawing `fragment` over the quad. One that fails to link says
// why in the console.
export function quadProgram(gl: WebGLRenderingContext, fragment: string) {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(program, 0, 'position');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.error(gl.getProgramInfoLog(program));
  return program;
}

// Where each of `names`, uniforms of `program`, is set.
export const uniformsOf = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  names: readonly string[],
): Record<string, WebGLUniformLocation | null> =>
  Object.fromEntries(
    names.map((name) => [name, gl.getUniformLocation(program, name)]),
  );

// The quad's four corners, in a buffer of their own, as attribute 0.
export function bindQuad(gl: WebGLRenderingContext) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}
