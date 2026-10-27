import { useFont } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Euler,
  Group,
  MeshPhysicalMaterial,
  Plane,
  ShapeGeometry,
  Vector2,
  Vector3,
  Vector4,
  WebGLProgramParametersWithUniforms,
} from 'three';

import { GLOSS, heading, SKIN_COLOR } from './MyHead';
import { skyAhead, skyRate } from './Sky';
import {
  Aim,
  Calibration,
  Check,
  chooseAim,
  NOW,
  shownAs,
  untoneMap,
} from './titleAim';
import { COLUMNS, letterMask, Mask, readWord } from './titleMask';
import { AimProbe, bendSheet, POINTS } from './titleProbe';
import { TitleWord, titleWords } from './titleWords';

// The home page's name drawn in the 3D scene, as flat letters in the head's
// skin: the same glossy black, reflecting the same turning sky. The page
// keeps the real heading in place, transparent, for screen readers, search
// and selection; each word here is laid over the spot its word takes there,
// at the same size, and follows it as the page reflows.
//
// Flat letters would each mirror one small patch of sky, all alike. The head
// shows the sky's colours because it curves; so the name's surface is lit as
// one gently curved sheet spanning both lines: its left end faces one way, its
// right end another, and the reflection sweeps across the sky between them,
// level or slanting from the ground to above the horizon, the way the old CSS
// gradient ran along the name, but from the real sky. It curves only along
// the name, so no line of it gets a horizon of its own: both share the one
// sweep.
//
// A mirror of the sky vanishes wherever it faces the same sky that is behind
// it, and dark glass vanishes over the dark head. So the sheet is turned
// (titleAim.ts) toward sky that stands out from what is behind every part of
// the name, and that shows as much of the sky's palette as it can: bright sky
// over the head or a dark sky, darker sky over a bright one. What each aim
// would show, now and where the sky is turning (Sky.tsx), is measured by
// three's own shading (titleProbe.ts); what is behind, and the letters as
// drawn, are read from the frame itself. The sheet turns calmly, at the
// world's pace, and keeps to a target a while rather than hunting.

// The title font (scripts/build-title-font.mjs).
const FONT = '/background/fonts/kanit.json';
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
const SWEEP = 0.9;
// The letters' reflections, this much brighter than a plain skin's: black
// glass facing you returns only a few percent of the sky, too little to show
// its colours.
const REFLECT = 6;
// The contrast each part of the name keeps with what is behind it. The
// name favours the sky's whole palette over WCAG's 3:1 for large text: over
// the mid-toned sky, 3:1 leaves only near white and near black, as the
// sky's own colours sit at its own brightness. 2:1 keeps every letter
// distinct from the sky and most of the palette. The subtitle keeps 4.5:1
// (Title.tsx), and the page's real heading stays for screen readers.
const TARGET = 2;
// How often (frames) the name is read and re-aimed.
const EVERY = 4;
// How fast the sheet eases to a new aim, per frame: when its colours drift,
// at a little under the pace the head and sky turn, so the name moves calmly
// with the world; when it flips between lighter and darker than what is
// behind it, in about half a second, as any path between the two passes
// through tones that blend into the sky.
const DRIFT = 0.6;
const FLIP = 0.08;
// While the name is not readable, it catches up at this many times the
// pace the head and sky turn, and at least CATCH_UP_LEAST: the head's idle
// wander is slow enough that matching it would leave the name unreadable for
// seconds.
const CATCH_UP = 2;
const CATCH_UP_LEAST = 0.03;
// While the sky swings fast, the name may catch up and flip faster too, in
// step with it: this much ease per radian the sky turns each frame, up to
// SWING_MOST.
const SWING = 10;
const SWING_MOST = 0.3;
// How far ahead (frames) the name looks at where the sky is turning, to stay
// readable on the way.
const AHEAD = [15, 30];
// After a flip, the name keeps its new side at least this long (ms), so it
// never flickers between the two.
const HOLD = 2000;
// After this long (ms) short of the target, the name flips if that would
// make it readable, even when its own side is only a little short.
const PATIENCE = 1000;
// The fastest the sheet turns, per frame, in tilt and sweep direction
// together: about a full tilt (45°) a second while the sky is still, so the
// name's colours never rush; while the sky turns, faster by FOLLOW per radian
// it turns that frame, so the name keeps pace with the world.
const FASTEST = 0.015;
const FOLLOW = 1;
// The sheet chooses a new target at most every DWELL ms, or every RECHOOSE
// ms while the name is unreadable.
const DWELL = 1500;
const RECHOOSE = 500;
// Reading the frame: after the colour grading draws it (priority 1).
const READ_PRIORITY = 2;

const plane = new Plane(new Vector3(0, 0, 1), -PLANE_Z);

// Where a point on the page lands on the letters' plane.
function onPlane(
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
type Sheet = {
  span: { value: Vector2 };
  aim: { value: Vector4 };
};

// The skin, its normals bent as the sheet's (in view space, whose axes the
// camera keeps lined up with the world's), by where each point sits on it.
function makeSkin(sheet: Sheet) {
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
const letterShapes = (font: ReturnType<typeof useFont>, text: string) =>
  font.generateShapes(text, EM, { letterSpacing: TRACKING });

// One word, laid over its word on the page, at its size.
function Word({
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
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

export default function TitleName() {
  const { camera, gl, scene } = useThree();
  // The words register from outside the canvas; look for them each frame
  // until they have, and again whenever the page changes them.
  const [entries, setEntries] = useState<TitleWord[]>([]);
  const [sheet] = useState<Sheet>(() => ({
    span: { value: new Vector2(-1, 1) },
    aim: { value: new Vector4(0, 0, 1, 0) },
  }));
  const [material] = useState(() => makeSkin(sheet));
  const font = useFont(FONT);
  const probe = useRef<AimProbe | null>(null);
  // Where each word's letters are, redrawn when its size changes.
  const masks = useRef(new Map<string, { key: string; mask: Mask }>());
  // How the page shows what the probe measures (titleAim.ts), learnt from
  // the letters as drawn.
  const calibration = useRef<Calibration>({ gain: 1, ceiling: 1 });
  const lastFlip = useRef(-Infinity);
  const lastChoice = useRef(-Infinity);
  // When the name last read at the target contrast.
  const lastReadable = useRef(0);
  const target = useRef<Aim>({ x: 0, y: 0, sweepX: 1, sweepY: 0 });
  // Whether the sheet is flipping to the target, and whether the name, as
  // last read, misses the target contrast.
  const flipping = useRef(false);
  const failing = useRef(false);
  const frame = useRef(0);
  const left = new Vector3();
  const right = new Vector3();
  const aim = new Vector4();
  const gap = new Vector4();

  useEffect(() => {
    const made = new AimProbe(material, SWEEP, AimProbe.lightsOf(scene));
    probe.current = made;
    return () => made.dispose();
  }, [material, scene]);

  useFrame(() => {
    if (titleWords.size !== entries.length)
      setEntries([...titleWords.values()]);
    // The sky, as the letters' own reflection map so its strength (REFLECT)
    // applies, turned with the scene's.
    if (material.envMap !== scene.environment)
      Object.assign(material, {
        envMap: scene.environment,
        needsUpdate: true,
      });
    material.envMapRotation.copy(scene.environmentRotation);
    if (!entries.length) return;

    // The sheet spans the whole name as the page lays it out.
    const boxes = entries.map(({ word }) => word.getBoundingClientRect());
    const middle = (boxes[0]!.top + boxes[0]!.bottom) / 2;
    onPlane(
      Math.min(...boxes.map((box) => box.left)),
      middle,
      camera,
      gl.domElement,
      left,
    );
    onPlane(
      Math.max(...boxes.map((box) => box.right)),
      middle,
      camera,
      gl.domElement,
      right,
    );
    sheet.span.value.set(left.x, right.x);
    const { x, y, sweepX, sweepY } = target.current;
    aim.set(x, y, sweepX, sweepY);
    if (
      flipping.current &&
      gap.subVectors(sheet.aim.value, aim).length() < 0.05
    )
      flipping.current = false;
    const swing = Math.min(SWING * skyRate(), SWING_MOST);
    const ease = flipping.current
      ? Math.max(FLIP, swing)
      : failing.current
        ? Math.max(CATCH_UP * heading.speed, CATCH_UP_LEAST, swing)
        : DRIFT * heading.speed;
    // Eased, and never faster than FASTEST.
    gap.subVectors(aim, sheet.aim.value).multiplyScalar(ease);
    const length = gap.length();
    const fastest = FASTEST + FOLLOW * skyRate();
    if (length > fastest) gap.multiplyScalar(fastest / length);
    sheet.aim.value.add(gap);
  });

  // Every few frames, once the frame is drawn: read the letters and what is
  // behind them, calibrate the probe on the letters, and choose where the
  // sheet faces.
  useFrame(() => {
    frame.current = (frame.current + 1) % EVERY;
    if (frame.current || !entries.length || !probe.current) return;
    const canvas = gl.domElement;
    const boxes = entries.map(({ word }) => word.getBoundingClientRect());
    const span = sheet.span.value;
    const letters: number[] = [];
    const checks: Check[] = [];
    const points: { position: Vector3; across: number }[] = [];
    entries.forEach((entry, k) => {
      const box = boxes[k]!;
      // A word the page is not laying out (hidden, or not yet sized) has
      // nothing to read.
      if (box.width < 1 || box.height < 1) return;
      const key = `${box.width}x${box.height}`;
      let mask = masks.current.get(entry.text);
      if (mask?.key !== key) {
        mask = {
          key,
          mask: letterMask(
            letterShapes(font, entry.text),
            box.width,
            box.height,
            entry.baseline.getBoundingClientRect().top - box.top,
            parseFloat(getComputedStyle(entry.word).fontSize),
          ),
        };
        masks.current.set(entry.text, mask);
      }
      const read = readWord(
        gl.getContext(),
        canvas,
        box,
        mask.mask,
        boxes.filter((_, j) => j !== k),
      );
      read.letters.forEach((letter, column) => {
        const behind = [read.above[column]!, read.below[column]!].filter(
          (l) => !Number.isNaN(l),
        );
        if (Number.isNaN(letter) || !behind.length || points.length >= POINTS)
          return;
        const position = onPlane(
          box.left + ((column + 0.5) / COLUMNS) * box.width,
          (box.top + box.bottom) / 2,
          camera,
          canvas,
          new Vector3(),
        );
        checks.push({ point: points.length, shown: letter, behind });
        letters.push(letter);
        points.push({
          position,
          across: (2 * position.x - span.x - span.y) / (span.y - span.x),
        });
      });
    });
    if (!points.length) return;
    const now = {
      x: sheet.aim.value.x,
      y: sheet.aim.value.y,
      sweepX: sheet.aim.value.z,
      sweepY: sheet.aim.value.w,
    };
    // The probe's view now, and where the sky is turning.
    const sky = {
      blurriness: scene.backgroundBlurriness,
      intensity: scene.backgroundIntensity,
    };
    const views = [
      scene.environmentRotation,
      ...AHEAD.map((frames) => skyAhead(frames, new Euler())),
    ].map((rotation) =>
      probe.current!.measure(gl, camera, material, points, now, rotation, sky),
    );
    const { light } = views[0]!;
    // Learn the calibration: the gain from the dark and middle tones, the
    // ceiling from the bright ones, each from its median miss.
    const median = (values: number[]) =>
      values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const cal = calibration.current;
    const gainMiss = median(
      letters
        .map((letter, point) => [letter, light(NOW, point)] as const)
        .filter(([letter]) => letter < 0.5)
        .map(([letter, l]) =>
          Math.log(
            untoneMap(Math.max(letter / cal.ceiling, 0.002)) /
              Math.max(l * cal.gain, 1e-4),
          ),
        ),
    );
    const ceilingMiss = median(
      letters
        .map(
          (letter, point) => [letter, shownAs(light(NOW, point), cal)] as const,
        )
        .filter(([letter, shown]) => letter > 0.6 && shown > 0.6)
        .map(([letter, shown]) => Math.log(letter / shown)),
    );
    if (gainMiss !== undefined) cal.gain *= Math.exp(0.3 * gainMiss);
    if (ceilingMiss !== undefined)
      cal.ceiling = Math.min(cal.ceiling * Math.exp(0.3 * ceilingMiss), 1);
    // A flip runs to its end before the next choice: on the way, the name
    // passes through the tones it is leaving.
    if (flipping.current) return;
    const ratio = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    failing.current = checks.some(({ shown, behind }) =>
      behind.some((b) => ratio(shown, b) < TARGET),
    );
    const time = performance.now();
    if (!failing.current) lastReadable.current = time;
    // The name keeps to a target a while: choosing afresh on every reading,
    // each step on the way shows a slightly better aim and the name never
    // settles. It chooses again after DWELL, or after RECHOOSE while it is
    // unreadable.
    if (time - lastChoice.current < (failing.current ? RECHOOSE : DWELL))
      return;
    lastChoice.current = time;
    const chosen = chooseAim(
      views,
      checks,
      calibration.current,
      now,
      TARGET,
      time - lastFlip.current > HOLD,
      time - lastReadable.current > PATIENCE,
    );
    target.current = chosen.aim;
    if (chosen.flip) {
      flipping.current = true;
      lastFlip.current = time;
    }
  }, READ_PRIORITY);

  return entries.map((entry) => (
    <Word key={entry.text} entry={entry} material={material} />
  ));
}
