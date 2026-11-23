import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';

import { headMood } from './headMood';
import { HEAD_LIFT } from './headPlace';
import { phoneSwap } from './storyProp';

// The home page's last chapter, What's Next: the head steps aside for a
// phone, standing where it was and turned a little toward the card, that
// calls you. On its screen, as the caller's photo, is the head itself
// (public/story/head-call.mp4, recorded from this site, and its poster),
// over "Zack" and "Let's talk", with Decline and Accept below and two soft
// rings pulsing out of Accept, then a pause, as a ringtone does. It floats gently and never
// shakes. How far in it is comes from StoryProps.tsx (`phoneShown`); the
// head shrinks away as it comes (phoneSwap, storyProp.ts, read by
// MyHead.tsx).

// How far in the phone is, 0 to 1, set each frame by StoryProps.tsx.
export const phoneShown = { value: 0 };

// The phone, in its own units: a body W by H, D deep, its screen a canvas
// SW by SH pixels.
const W = 2.9;
const H = 6.1;
const D = 0.2;
// How far in front of the body's front face the screen lies.
const SCREEN_Z = 0.065;
const SW = 720;
const SH = 1514;
// How tall the phone stands, in the head's eye spreads (the distance between
// its eyes): about the height of the head and shoulders it replaces.
const HEIGHT_SPREADS = 3.6;
// The head on the screen: the recording's size, and how far down the screen
// it runs before the caller's name (it fades into the panel there).
const PHOTO = { width: 444, height: 700 };
const PHOTO_BOTTOM = 1180;
const PANEL = '#2a2240';
const TAU = Math.PI * 2;

const rounded = (w: number, h: number, r: number) => {
  const s = new Shape();
  const [x, y] = [-w / 2, -h / 2];
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

// The screen: a rounded rectangle whose texture spans it edge to edge.
function screenGeometry() {
  const [w, h] = [W - 0.14, H - 0.14];
  const g = new ShapeGeometry(rounded(w, h, 0.42), 24);
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let k = 0; k < pos.count; k++)
    uv.setXY(k, pos.getX(k) / w + 0.5, pos.getY(k) / h + 0.5);
  return g;
}

// Material Icons' "call" and "call_end" (Apache 2.0): a real handset.
const CALL =
  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';
const END =
  'M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z';

// One frame of the incoming call, `t` seconds into it, with the head's
// recording (or its poster, until it plays) as the caller's photo.
function drawCall(
  g: CanvasRenderingContext2D,
  head: CanvasImageSource | null,
  t: number,
  font: string,
) {
  g.fillStyle = PANEL;
  g.fillRect(0, 0, SW, SH);
  // The caller's photo covers the whole top of the screen: head, ears and
  // shoulders, no edge of the recording showing.
  if (head) {
    const k = Math.max(SW / PHOTO.width, PHOTO_BOTTOM / PHOTO.height);
    const [w, h] = [PHOTO.width * k, PHOTO.height * k];
    g.filter = 'brightness(1.1)';
    g.drawImage(head, (SW - w) / 2, 0, w, h);
    g.filter = 'none';
  }
  const fade = g.createLinearGradient(0, PHOTO_BOTTOM - 340, 0, PHOTO_BOTTOM);
  fade.addColorStop(0, 'rgba(42, 34, 64, 0)');
  fade.addColorStop(1, PANEL);
  g.fillStyle = fade;
  g.fillRect(0, PHOTO_BOTTOM - 340, SW, 360);
  const top = g.createLinearGradient(0, 0, 0, 230);
  top.addColorStop(0, 'rgba(20, 16, 36, 0.5)');
  top.addColorStop(1, 'rgba(20, 16, 36, 0)');
  g.fillStyle = top;
  g.fillRect(0, 0, SW, 230);
  // The camera's cut-out.
  g.fillStyle = '#000';
  g.beginPath();
  g.roundRect(250, 34, 220, 62, 31);
  g.fill();
  g.textAlign = 'center';
  g.shadowColor = 'rgba(0, 0, 0, 0.45)';
  g.shadowBlur = 18;
  g.fillStyle = 'rgba(255, 255, 255, 0.9)';
  g.font = `500 38px ${font}`;
  g.fillText('Incoming call', SW / 2, 160);
  g.fillStyle = '#fff';
  g.font = `600 112px ${font}`;
  g.fillText('Zack', SW / 2, PHOTO_BOTTOM - 110);
  g.fillStyle = 'rgba(255, 255, 255, 0.85)';
  g.font = `400 42px ${font}`;
  g.fillText('Let’s talk', SW / 2, PHOTO_BOTTOM - 50);
  g.shadowBlur = 0;
  // Two soft rings out of Accept, then a pause.
  const c = t % 2.4;
  for (const at of [0, 0.6]) {
    const q = (c - at) / 1.1;
    if (q <= 0 || q >= 1) continue;
    g.beginPath();
    g.arc(540, 1300, 92 + q * 80, 0, TAU);
    g.strokeStyle = `rgba(48, 196, 105, ${0.55 * (1 - q)})`;
    g.lineWidth = 10;
    g.stroke();
  }
  const button = (x: number, fill: string, icon: Path2D, label: string) => {
    g.beginPath();
    g.arc(x, 1300, 92, 0, TAU);
    g.fillStyle = fill;
    g.fill();
    g.save();
    g.translate(x - 54, 1246);
    g.scale(4.5, 4.5);
    g.fillStyle = '#fff';
    g.fill(icon);
    g.restore();
    g.fillStyle = 'rgba(255, 255, 255, 0.8)';
    g.font = `400 34px ${font}`;
    g.fillText(label, x, 1440);
  };
  button(180, '#e5484d', new Path2D(END), 'Decline');
  button(540, '#30c469', new Path2D(CALL), 'Accept');
}

const centre = (geometry: BufferGeometry) => {
  geometry.computeBoundingBox();
  return geometry.boundingBox!.getCenter(new Vector3());
};

export default function PhoneCall({
  leftEye,
  rightEye,
}: {
  leftEye: BufferGeometry;
  rightEye: BufferGeometry;
}) {
  // Where it stands and how big: centred a little below the head's eyes,
  // where the head and shoulders were, and as tall.
  const place = useMemo(() => {
    const [l, r] = [centre(leftEye), centre(rightEye)];
    const spread = Math.abs(r.x - l.x);
    return {
      at: new Vector3(0, HEAD_LIFT + (l.y + r.y) / 2 - spread * 0.5, l.z),
      scale: (HEIGHT_SPREADS * spread) / H,
    };
  }, [leftEye, rightEye]);
  const parts = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SW;
    canvas.height = SH;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    const body = new ExtrudeGeometry(rounded(W, H, 0.48), {
      depth: D,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 5,
      curveSegments: 24,
    });
    body.translate(0, 0, -D);
    return { canvas, texture, body, screen: screenGeometry() };
  }, []);
  useEffect(
    () => () => {
      parts.texture.dispose();
      parts.body.dispose();
      parts.screen.dispose();
    },
    [parts],
  );
  // The head's recording and its poster (its first frame, shown until it
  // plays), fetched once the story has started (a chapter's cue), well
  // before this chapter comes round.
  const video = useRef<HTMLVideoElement | null>(null);
  const poster = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!headMood.cue) return;
      clearInterval(timer);
      const v = document.createElement('video');
      Object.assign(v, {
        src: '/story/head-call.mp4',
        muted: true,
        loop: true,
        playsInline: true,
        preload: 'auto',
      });
      video.current = v;
      const image = new Image();
      image.src = '/story/head-call.jpg';
      poster.current = image;
    }, 500);
    return () => {
      clearInterval(timer);
      video.current?.pause();
      video.current = null;
    };
  }, []);
  const ref = useRef<Group>(null);
  const screenRef = useRef<Mesh>(null);
  const started = useRef(0);

  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group) return;
    const { phone } = phoneSwap(phoneShown.value);
    const v = video.current;
    group.visible = phone > 0.001;
    if (!group.visible) {
      if (v && !v.paused) v.pause();
      started.current = 0;
      return;
    }
    if (v?.paused) v.play().catch(() => {});
    const t = clock.elapsedTime;
    if (!started.current) started.current = t;
    group.scale.setScalar(place.scale * phone);
    group.position.copy(place.at);
    group.position.y += Math.sin(t * 1.1) * 0.12 * place.scale;
    group.rotation.set(
      0.04 + Math.sin(t * 0.7) * 0.03,
      0.22 + Math.sin(t * 0.5) * 0.05,
      0,
    );
    const map = (screenRef.current?.material as MeshBasicMaterial | undefined)
      ?.map;
    if (!map) return;
    const g = (map.image as HTMLCanvasElement).getContext('2d')!;
    const still = poster.current;
    drawCall(
      g,
      v && v.readyState >= 2
        ? v
        : still?.complete && still.naturalWidth
          ? still
          : null,
      t - started.current,
      // Roboto, the site's own (app/layout.tsx), as a phone's screen has.
      `${getComputedStyle(document.body).getPropertyValue('--font-roboto')}, sans-serif`,
    );
    map.needsUpdate = true;
  });

  return (
    <group ref={ref} visible={false}>
      <mesh geometry={parts.body}>
        <meshPhysicalMaterial
          color="#8d8a86"
          metalness={1}
          roughness={0.3}
          clearcoat={0.3}
        />
      </mesh>
      {/* The side buttons: power on the right, volume on the left. */}
      {(
        [
          [W / 2 + 0.05, 1.5, 0.9],
          [-W / 2 - 0.05, 1.9, 0.45],
          [-W / 2 - 0.05, 1.2, 0.45],
        ] as const
      ).map(([x, y, length]) => (
        <mesh key={`${x}${y}`} position={[x, y, -D / 2]}>
          <boxGeometry args={[0.06, length, 0.08]} />
          <meshPhysicalMaterial color="#8d8a86" metalness={1} roughness={0.3} />
        </mesh>
      ))}
      {/* SCREEN_Z clear of the body's front (its bevel's, 0.045), and drawn
          over it whatever the depth buffer's precision: at 0.047 the two
          fought at the phone's distance, the body flickering through. */}
      <mesh ref={screenRef} geometry={parts.screen} position={[0, 0, SCREEN_Z]}>
        <meshBasicMaterial
          map={parts.texture}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
}
