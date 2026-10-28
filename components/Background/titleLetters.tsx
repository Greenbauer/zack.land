import { useFont } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  Camera,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  Plane,
  ShapeGeometry,
  Vector2,
  Vector3,
  Vector4,
  WebGLProgramParametersWithUniforms,
} from 'three';

import { TITLE_LAYER } from './focusBlur';
import { GLOSS, SKIN_COLOR } from './MyHead';
import { bendSheet } from './titleProbe';
import { TitleWord } from './titleWords';

// The name's letters (TitleName.tsx): each word drawn as flat letters in the
// head's skin on a plane in front of the head, laid over its word on the
// page, the skin's normals bent as one curved sheet across the whole name.

// The title font (scripts/build-title-font.mjs).
export const FONT = '/background/fonts/kanit.json';
// three's TTFLoader stores glyphs at 100000 / 72 units to the em against a
// resolution of 1000, so shapes of size 1 are 1.39 em: this size makes them
// one em.
const EM = (1000 * 72) / 100000;
// The heading's letter spacing (tracking-wider, 0.05em), in font units.
const TRACKING = 0.05;
// The letters sit on this plane, between the camera (at 250) and the head,
// well clear of the nose (57) as the head turns.
const PLANE_Z = 110;
// How far the sheet's normal tips at its left and right ends, as the tangent
// of the angle. A reflection turns twice as far as its surface, so 0.9 sweeps
// the reflection through about 85° each way.
export const SWEEP = 0.9;
// The letters' reflections, this much brighter than a plain skin's: black
// glass facing you returns only a few percent of the sky, too little to show
// its colours.
const REFLECT = 6;

const plane = new Plane(new Vector3(0, 0, 1), -PLANE_Z);

// Where a point on the page lands on the letters' plane.
export function onPlane(
  x: number,
  y: number,
  camera: Camera,
  canvas: HTMLCanvasElement,
  target: Vector3,
) {
  const bounds = canvas.getBoundingClientRect();
  const ray = new Vector3(
    ((x - bounds.left) / bounds.width) * 2 - 1,
    -((y - bounds.top) / bounds.height) * 2 + 1,
    0.5,
  )
    .unproject(camera)
    .sub(camera.position)
    .normalize();
  const t =
    -(camera.position.dot(plane.normal) + plane.constant) /
    ray.dot(plane.normal);
  return target.copy(camera.position).addScaledVector(ray, t);
}

// The name's sheet: its left and right ends on the letters' plane (x), and
// its facing (x, y: a tilt of the whole sheet; z: how far and which way its
// curve sweeps across).
export type Sheet = {
  span: { value: Vector2 };
  aim: { value: Vector4 };
};

// The skin, its normals bent as the sheet's (in view space, whose axes the
// camera keeps lined up with the world's), by where each point sits on it.
export function makeSkin(sheet: Sheet) {
  const skin = new MeshPhysicalMaterial({
    color: SKIN_COLOR,
    ...GLOSS,
    envMapIntensity: REFLECT,
  });
  skin.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uSheetSpan = sheet.span;
    shader.uniforms.uSheetAim = sheet.aim;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vSheetX;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvSheetX = (modelMatrix * vec4(transformed, 1.0)).x;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vSheetX;
        uniform vec2 uSheetSpan;
        uniform vec4 uSheetAim;
        ${bendSheet(SWEEP)}`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        float sheetAcross = clamp(
          (2.0 * vSheetX - uSheetSpan.x - uSheetSpan.y) / (uSheetSpan.y - uSheetSpan.x),
          -1.0, 1.0);
        normal = sheetBend(normal, sheetAcross, uSheetAim);`,
      )
      .replace(
        '#include <clearcoat_normal_fragment_maps>',
        `#include <clearcoat_normal_fragment_maps>
        clearcoatNormal = sheetBend(clearcoatNormal, sheetAcross, uSheetAim);`,
      );
  };
  return skin;
}

// A word's letters, in ems from the left end of its baseline: drawn by
// Word, and read by the page's mask (titleMask.ts), so both match.
export const letterShapes = (font: ReturnType<typeof useFont>, text: string) =>
  font.generateShapes(text, EM, { letterSpacing: TRACKING });

// One word, laid over its word on the page, at its size.
// Puts a title's letters on the titles' layer, drawn over the focus blur
// (focusBlur.ts).
const onTitleLayer = (mesh: Mesh | null) => mesh?.layers.set(TITLE_LAYER);

export function Word({
  entry,
  material,
}: {
  entry: TitleWord;
  material: MeshPhysicalMaterial;
}) {
  const group = useRef<Group>(null);
  const { camera, gl } = useThree();
  const font = useFont(FONT);
  // Flat: the letters' outlines, filled, facing the camera.
  const geometry = useMemo(
    () => new ShapeGeometry(letterShapes(font, entry.text), 8),
    [font, entry.text],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const origin = new Vector3();
  const across = new Vector3();

  useFrame(() => {
    const node = group.current;
    if (!node) return;
    const word = entry.word.getBoundingClientRect();
    const baseline = entry.baseline.getBoundingClientRect().top;
    const fontSize = parseFloat(getComputedStyle(entry.word).fontSize);
    onPlane(word.left, baseline, camera, gl.domElement, origin);
    onPlane(word.left + fontSize, baseline, camera, gl.domElement, across);
    node.position.copy(origin);
    node.scale.setScalar(across.distanceTo(origin));
  });

  return (
    <group ref={group}>
      <mesh ref={onTitleLayer} geometry={geometry} material={material} />
    </group>
  );
}
