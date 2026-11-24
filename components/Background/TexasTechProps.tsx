import { useFrame } from '@react-three/fiber';
import { RefObject, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  RepeatWrapping,
  RingGeometry,
  SRGBColorSpace,
  Vector2,
} from 'three';

import { Cap, CAP_PARTS, loadCap } from './capGeometry';
import { headKnock } from './headKnock';
import { headMood } from './headMood';
import { turnHead } from './headTurn';
import type { StoryProp } from './storyCue';
import { drapeSurface, everyFace, frameAt } from './tortillaDrape';
import {
  AZIMUTHS,
  FLIES,
  flyerAt,
  FLYERS,
  throwAt,
  TORTILLA_RADIUS,
} from './tortillaFlight';
import { holdOf, poseThrow } from './tortillaPose';
import { useOnceCued } from './useOnceCued';

// The home page's Texas Tech chapter, on the head itself: a graduation cap
// (capGeometry.ts) that drops onto it and turns with it, as the sunglasses
// do, and tortillas flying past behind it, as they did at every kickoff, one
// of which hits it now and then (tortillaFlight.ts). `amounts` is how far in
// each prop is (StoryProps.tsx).

// How much of the sky's light a tortilla takes: less than all, so the scene's
// lamps shade its bends (under the sky alone it was one flat white).
const TORTILLA_SKY = 0.5;

// A flour tortilla's face: pale and floury, with scattered toasted blisters
// (each a small cluster, dark in the middle), no two alike.
function tortillaFace() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#e7cd97';
  g.fillRect(0, 0, 512, 512);
  let seed = 23;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Faint mottling, as the dough cooks unevenly.
  for (let k = 0; k < 60; k++) {
    g.fillStyle = `rgba(226, 205, 160, ${0.08 + rand() * 0.12})`;
    g.beginPath();
    g.ellipse(
      rand() * 512,
      rand() * 512,
      20 + rand() * 50,
      14 + rand() * 36,
      rand() * 3,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  // The blisters: where it puffed and touched the pan.
  for (let k = 0; k < 20; k++) {
    const [x, y] = [50 + rand() * 412, 50 + rand() * 412];
    for (let n = 0; n < 2 + Math.floor(rand() * 4); n++) {
      const [bx, by] = [x + (rand() - 0.5) * 36, y + (rand() - 0.5) * 36];
      const size = 6 + rand() * 16;
      const spot = g.createRadialGradient(bx, by, 0, bx, by, size);
      const dark = rand();
      spot.addColorStop(
        0,
        `rgba(${110 + dark * 50}, ${62 + dark * 40}, 22, ${0.75 + rand() * 0.2})`,
      );
      spot.addColorStop(0.6, 'rgba(176, 120, 60, 0.45)');
      spot.addColorStop(1, 'rgba(200, 160, 100, 0)');
      g.fillStyle = spot;
      g.beginPath();
      g.ellipse(
        bx,
        by,
        size,
        size * (0.6 + rand() * 0.4),
        rand() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// The cap's cloth: a fine twill, as a normal map that repeats across it.
const WEAVE_DEPTH = new Vector2(0.35, 0.35);
function clothWeave() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  const image = g.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      // Diagonal ribs: the slope across each rib tips the normal.
      const along = ((x + y) % 8) / 8;
      const tip = Math.cos(along * Math.PI * 2) * 0.5;
      const k = (y * size + x) * 4;
      image.data[k] = 128 + tip * 90;
      image.data[k + 1] = 128 + tip * 90;
      image.data[k + 2] = 255;
      image.data[k + 3] = 255;
    }
  g.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(60, 60);
  return texture;
}

// A tortilla's shape: a thin round (its edge only just uneven), bending a
// little as a soft one does in the air (two sides up, two down).
function tortillaShape(radius: number) {
  const shape = new RingGeometry(0.001, radius, 64, 14);
  const position = shape.getAttribute('position');
  for (let k = 0; k < position.count; k++) {
    const [x, y] = [position.getX(k), position.getY(k)];
    const out = Math.hypot(x, y) / radius;
    const round = Math.atan2(y, x);
    const edge =
      1 + out * (0.008 * Math.sin(round * 5 + 1) + 0.006 * Math.sin(round * 9));
    position.setXYZ(
      k,
      x * edge,
      y * edge,
      radius * out * out * 0.035 * Math.sin(round * 2 + 0.6),
    );
  }
  shape.computeVertexNormals();
  return shape;
}

function carried(geometry: BufferGeometry) {
  const count = geometry.getAttribute('position').count;
  for (const name of ['headWeight', 'turnWeight'])
    geometry.setAttribute(
      name,
      new Float32BufferAttribute(new Float32Array(count).fill(1), 1),
    );
  return geometry;
}

// Sets how far the head turns `geometry` (turnHead), 0 to 1: a tortilla on
// the head turns with it, and not at all in the air.
function turnWith(geometry: BufferGeometry, head: number) {
  for (const name of ['headWeight', 'turnWeight']) {
    const weight = geometry.getAttribute(name);
    if (weight.getX(0) === head) continue;
    (weight.array as Float32Array).fill(head);
    weight.needsUpdate = true;
  }
}

async function loadCarriedCap(): Promise<Cap> {
  const cap = await loadCap();
  for (const part of CAP_PARTS) carried(cap[part]);
  return cap;
}

export default function TexasTechProps({
  spread,
  amounts,
  skin,
}: {
  // The distance between the head's eyes: its own measure.
  spread: number;
  amounts: RefObject<Record<StoryProp, number>>;
  // The head's skin, which a tortilla thrown at the face drapes over.
  skin: BufferGeometry;
}) {
  // The cap, fetched once the story has started (a chapter's cue): its own
  // chapter is the first, so it is usually there as that card arrives.
  const cap = useOnceCued(loadCarriedCap);
  const weave = useMemo(() => clothWeave(), []);
  const tortilla = useMemo(
    () => ({ shape: tortillaShape(TORTILLA_RADIUS), face: tortillaFace() }),
    [],
  );
  // The head's shape where a thrown one hits it, from each way one is
  // thrown, and its own copy of the shape, which bends to lie on it.
  const places = useMemo(() => {
    const skinAnyFace = everyFace(
      skin.getAttribute('position').array,
      (skin.morphAttributes.position ?? []).map(({ array }) => array),
    );
    return AZIMUTHS.map((azimuth) => {
      const frame = frameAt(azimuth);
      return { frame, surface: drapeSurface(skinAnyFace, frame) };
    });
  }, [skin]);
  const draping = useMemo(() => carried(tortilla.shape.clone()), [tortilla]);
  const capRef = useRef<Group>(null);
  const flyersRef = useRef<Group>(null);
  const throwRef = useRef<Mesh>(null);

  useFrame(() => {
    const amount = amounts.current.tortillas;
    // The cap drops from above onto the head, slowing as it lands.
    if (capRef.current) {
      capRef.current.visible = amount > 0.01;
      capRef.current.position.y = (1 - amount) ** 2 * spread * 8;
    }
    const cue = headMood.cue;
    const t = cue ? performance.now() / 1000 - cue.since : 0;
    const shows = amount > 0.01;
    // They drop away below as the chapter goes.
    const away = -((1 - amount) ** 2) * 600;
    flyersRef.current?.children.forEach((child, k) => {
      const at = shows ? flyerAt(k, t) : null;
      child.visible = !!at;
      if (!at) return;
      child.position.set(at.x, at.y + away, at.z);
      child.rotation.set(at.lean, at.roll, at.spin);
    });
    const toss = throwRef.current;
    if (!toss) return;
    const now = shows && cue?.prop === 'tortillas' ? throwAt(t) : null;
    toss.visible = !!now;
    if (!now) return;
    // The head is knocked as it hits.
    if (now.since >= FLIES) {
      headKnock.at = performance.now() / 1000 - (now.since - FLIES);
      headKnock.side = Math.sign(AZIMUTHS[now.thrown.azimuth]!);
    }
    const { frame, surface } = places[now.thrown.azimuth]!;
    const position = draping.getAttribute('position');
    poseThrow(
      now.thrown,
      now.since,
      tortilla.shape.getAttribute('position').array,
      frame,
      surface,
      position.array as Float32Array,
    );
    position.needsUpdate = true;
    draping.computeVertexNormals();
    turnWith(draping, holdOf(now.since));
    toss.position.y = away;
  });

  return (
    <>
      <group ref={capRef} visible={false}>
        {cap && (
          <>
            {/* Charcoal cloth with a soft sheen and a fine weave, shaded by
                what was baked into it (capGeometry.ts). Its colour is warm
                and takes little of the sky, whose blue would otherwise
                turn it the head's own colour. */}
            {[cap.crown, cap.board].map((part, n) => (
              <mesh key={n} geometry={part}>
                <meshPhysicalMaterial
                  color="#1f1b17"
                  vertexColors
                  roughness={0.9}
                  metalness={0}
                  sheen={0.7}
                  sheenRoughness={0.5}
                  sheenColor="#6b6660"
                  normalMap={weave}
                  normalScale={WEAVE_DEPTH}
                  envMapIntensity={0.28}
                  onBeforeCompile={turnHead}
                />
              </mesh>
            ))}
            {/* Texas Tech's scarlet. */}
            <mesh geometry={cap.tassel}>
              <meshPhysicalMaterial
                color="#cc0000"
                vertexColors
                roughness={0.62}
                sheen={0.6}
                sheenColor="#ff9a9a"
                onBeforeCompile={turnHead}
              />
            </mesh>
            <mesh geometry={cap.gold}>
              <meshPhysicalMaterial
                color="#d9a93c"
                vertexColors
                metalness={1}
                roughness={0.28}
                onBeforeCompile={turnHead}
              />
            </mesh>
          </>
        )}
      </group>
      <group ref={flyersRef}>
        {Array.from({ length: FLYERS }, (_, k) => (
          <mesh key={k} geometry={tortilla.shape} visible={false}>
            <meshStandardMaterial
              map={tortilla.face}
              roughness={0.95}
              envMapIntensity={TORTILLA_SKY}
              side={DoubleSide}
            />
          </mesh>
        ))}
      </group>
      {/* Its points move every frame, so it is never culled by where they
          began. */}
      <mesh
        ref={throwRef}
        geometry={draping}
        visible={false}
        frustumCulled={false}
      >
        <meshStandardMaterial
          map={tortilla.face}
          roughness={0.95}
          envMapIntensity={TORTILLA_SKY}
          side={DoubleSide}
          onBeforeCompile={turnHead}
        />
      </mesh>
    </>
  );
}
