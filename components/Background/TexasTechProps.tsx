import { useFrame } from '@react-three/fiber';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  RepeatWrapping,
  RingGeometry,
  SRGBColorSpace,
  Vector2,
} from 'three';

import { Cap, CAP_PARTS, loadCap } from './capGeometry';
import { headMood } from './headMood';
import { turnHead } from './headTurn';
import type { StoryProp } from './storyCue';
import { drapeOnto, drapeSurface } from './tortillaDrape';
import { FLIGHTS, TORTILLA_RADIUS, tortillaAt } from './tortillaFlight';

// The home page's Texas Tech chapter, on the head itself: a graduation cap
// (capGeometry.ts) that drops onto it and turns with it, as the sunglasses
// do, and
// tortillas thrown clear across the screen, a couple hitting its face, as
// they flew at every kickoff (tortillaFlight.ts). `amounts` is how far
// in each prop is (StoryProps.tsx).

// A flour tortilla's face: pale and floury, with scattered toasted blisters
// (each a small cluster, dark in the middle), no two alike.
function tortillaFace() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#f6eedb';
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
  const shape = new RingGeometry(0.001, radius, 56, 7);
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

// Sets how fully the head turns `geometry` (turnHead): wholly while a
// tortilla lies on the face, so it turns with it; not at all in flight.
function turnWith(geometry: BufferGeometry, head: boolean) {
  for (const name of ['headWeight', 'turnWeight']) {
    const weight = geometry.getAttribute(name);
    if (weight.getX(0) === (head ? 1 : 0)) continue;
    (weight.array as Float32Array).fill(head ? 1 : 0);
    weight.needsUpdate = true;
  }
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
  const [cap, setCap] = useState<Cap | null>(null);
  useEffect(() => {
    if (cap) return;
    const timer = setInterval(() => {
      if (!headMood.cue) return;
      clearInterval(timer);
      loadCap().then(
        (loaded) => {
          for (const part of CAP_PARTS) carried(loaded[part]);
          setCap(loaded);
        },
        () => {},
      );
    }, 300);
    return () => clearInterval(timer);
  }, [cap]);
  const weave = useMemo(() => clothWeave(), []);
  const tortilla = useMemo(
    () => ({ shape: tortillaShape(TORTILLA_RADIUS), face: tortillaFace() }),
    [],
  );
  // The surface over the face a tortilla drapes onto, and each thrown at
  // the face's own copy of the shape, which bends to lie on it.
  const surface = useMemo(
    () => drapeSurface(skin.getAttribute('position').array),
    [skin],
  );
  const draping = useMemo(
    () =>
      FLIGHTS.map((flight) =>
        flight.hits ? carried(tortilla.shape.clone()) : tortilla.shape,
      ),
    [tortilla],
  );
  const capRef = useRef<Group>(null);
  const tossRef = useRef<Group>(null);

  useFrame(() => {
    const amount = amounts.current.tortillas;
    // The cap drops from above onto the head, slowing as it lands.
    if (capRef.current) {
      capRef.current.visible = amount > 0.01;
      capRef.current.position.y = (1 - amount) ** 2 * spread * 5;
    }
    if (!tossRef.current) return;
    tossRef.current.visible = amount > 0.01;
    const cue = headMood.cue;
    const t = cue ? performance.now() / 1000 - cue.since : 0;
    tossRef.current.children.forEach((child, k) => {
      const flight = FLIGHTS[k]!;
      const u = (((t / flight.seconds + flight.phase) % 1) + 1) % 1;
      const at = tortillaAt(flight, u);
      // Flying, it spins like a thrown disc; on the face it lies flat on it,
      // its shape bent over the face (tortillaDrape.ts).
      // (Lying on the face, it is laid out in the head's own place, so it
      // takes no turn of its own.)
      const flying = at.drape > 0 ? 0 : 1;
      child.rotation.set(
        flying *
          (-Math.PI / 2 + flight.lean + Math.sin(t * 3 + k) * flight.wobble),
        flying * Math.sin(t * 2.2 + k * 2) * flight.wobble,
        flying * t * flight.spin,
      );
      if (!flight.hits) {
        child.position.set(at.x, at.y, at.z);
      } else {
        const geometry = draping[k]!;
        turnWith(geometry, at.drape > 0);
        const position = geometry.getAttribute('position');
        if (at.drape > 0) {
          child.position.set(0, 0, 0);
          drapeOnto(
            tortilla.shape.getAttribute('position').array,
            at,
            surface,
            at.drape,
            at.z,
            position.array as Float32Array,
          );
        } else {
          child.position.set(at.x, at.y, at.z);
          (position.array as Float32Array).set(
            tortilla.shape.getAttribute('position').array,
          );
        }
        position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
      child.scale.setScalar(amount);
    });
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
      <group ref={tossRef} visible={false}>
        {FLIGHTS.map((_, k) => (
          <mesh key={k} geometry={draping[k]}>
            <meshStandardMaterial
              map={tortilla.face}
              roughness={0.95}
              side={DoubleSide}
              onBeforeCompile={FLIGHTS[k]!.hits ? turnHead : undefined}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
