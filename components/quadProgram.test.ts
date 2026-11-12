import { afterEach, describe, expect, it, vi } from 'vitest';

import { bindQuad, quadProgram, uniformsOf } from './quadProgram';

// A WebGL context that notes each call by name, with what it was given.
function fakeGl(isLinked = true) {
  const calls: [string, ...unknown[]][] = [];
  const note =
    (name: string, result?: unknown) =>
    (...args: unknown[]) => {
      calls.push([name, ...args]);
      return result;
    };
  let shaders = 0;
  const gl = {
    VERTEX_SHADER: 'vertex',
    FRAGMENT_SHADER: 'fragment',
    LINK_STATUS: 'linked',
    ARRAY_BUFFER: 'array',
    STATIC_DRAW: 'static',
    FLOAT: 'float',
    createShader: (type: string) => {
      calls.push(['createShader', type]);
      return `shader${++shaders}`;
    },
    shaderSource: note('shaderSource'),
    compileShader: note('compileShader'),
    createProgram: note('createProgram', 'program'),
    attachShader: note('attachShader'),
    bindAttribLocation: note('bindAttribLocation'),
    linkProgram: note('linkProgram'),
    getProgramParameter: note('getProgramParameter', isLinked),
    getProgramInfoLog: note('getProgramInfoLog', 'what went wrong'),
    getUniformLocation: (_program: unknown, name: string) => `at ${name}`,
    createBuffer: note('createBuffer', 'buffer'),
    bindBuffer: note('bindBuffer'),
    bufferData: note('bufferData'),
    enableVertexAttribArray: note('enableVertexAttribArray'),
    vertexAttribPointer: note('vertexAttribPointer'),
  };
  return { gl: gl as unknown as WebGLRenderingContext, calls };
}

afterEach(() => vi.restoreAllMocks());

describe('quadProgram', () => {
  it('links the quad and the fragment, with the corners at attribute 0', () => {
    const { gl, calls } = fakeGl();
    expect(quadProgram(gl, 'void main() {}')).toBe('program');
    const names = calls.map(([name]) => name);
    // Bound before linking, which is when a binding takes effect.
    expect(names.indexOf('bindAttribLocation')).toBeLessThan(
      names.indexOf('linkProgram'),
    );
    expect(calls).toContainEqual([
      'bindAttribLocation',
      'program',
      0,
      'position',
    ]);
    expect(calls).toContainEqual(['shaderSource', 'shader2', 'void main() {}']);
    expect(calls).toContainEqual(['attachShader', 'program', 'shader1']);
    expect(calls).toContainEqual(['attachShader', 'program', 'shader2']);
    expect(calls.filter(([name]) => name === 'createShader')).toEqual([
      ['createShader', 'vertex'],
      ['createShader', 'fragment'],
    ]);
  });

  it('says why in the console when it fails to link', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    quadProgram(fakeGl(false).gl, '');
    expect(error).toHaveBeenCalledWith('what went wrong');
  });

  it('says nothing when it links', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    quadProgram(fakeGl().gl, '');
    expect(error).not.toHaveBeenCalled();
  });
});

describe('uniformsOf', () => {
  it('looks up each name', () => {
    const { gl } = fakeGl();
    expect(uniformsOf(gl, {} as WebGLProgram, ['uSize', 'uTime'])).toEqual({
      uSize: 'at uSize',
      uTime: 'at uTime',
    });
  });
});

describe('bindQuad', () => {
  it("feeds the canvas's four corners to attribute 0, two numbers each", () => {
    const { gl, calls } = fakeGl();
    bindQuad(gl);
    const data = calls.find(([name]) => name === 'bufferData')!;
    expect([...(data[2] as Float32Array)]).toEqual([
      -1, -1, 1, -1, -1, 1, 1, 1,
    ]);
    expect(calls).toContainEqual(['enableVertexAttribArray', 0]);
    expect(calls).toContainEqual([
      'vertexAttribPointer',
      0,
      2,
      'float',
      false,
      0,
      0,
    ]);
  });
});
