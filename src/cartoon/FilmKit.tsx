import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as stick from '../../cartoon_projects/family_stick/rig';
import * as dodo from '../../cartoon_projects/dodo_family/rig';
import {makeupWomanMarkup, type WomanMood} from './MakeupWoman';
import {CartoonGfx} from './StoryCards';
import {HybridHost} from '../hybrid/Slot';
import {Captions, capPages, Watermark, type CapPage, type CapWord} from './Overlays';

/** Shared film engine for the Abu Khatt / Dodo cartoons: shot list → camera + actors + word-timed captions + watermark.
 *  One shot = one setting/composition; characters keep a fixed world scale, close-ups come from the camera, not from resizing actors. */

export type Lib = 'stick' | 'dodo' | 'woman';   // 'woman' = the made-up woman in the Abu Khatt style (MakeupWoman.tsx)
export type Interval = {from: number; to: number};
export type Motion = stick.Motion;
export type Expression = stick.Expression;

export type ActorSpec = {
  key: string;
  lib: Lib;
  char: string;                       // id inside the library cast (father, uncle, boy-street, mother …)
  x: number; y: number;               // feet position in world px
  s?: number;                         // world scale (default 1)
  flip?: boolean;
  mode?: 'stand' | 'sit' | 'walk' | 'listen' | 'angry' | 'point' | 'wave';
  speech?: Interval[];                // absolute seconds in which this actor is the speaker (mouth + gesture)
  expr?: Expression;
  mod?: Record<string, unknown>;      // per-actor cast overrides: {ihram:true, cloth:'#fff', pants:'#35527a', robe:true, turban:true …}
  look?: {x: number; y: number};
  hide?: boolean;
  hands?: ('rest' | 'open' | 'point')[];            // stick library: hand shapes [left-of-screen, right-of-screen]
  poseFn?: (t: number, shotT: number) => ReturnType<typeof stick.poseAt>;   // fully custom pose (falls, laughing, pills…)
  rot?: (t: number, shotT: number) => number;                               // body rotation in degrees about the feet (negative = head to the left)
  mood?: WomanMood;
  seat?: boolean;                     // draw the library's small stool under a seated actor
  /** extra layer drawn in the actor's local space (props held in hand, aura …) */
  extra?: (t: number, shotT: number) => React.ReactNode;
};
export type Cam = {x: number; y: number; z: number; x2?: number; y2?: number; z2?: number};
export type Shot = {
  from: number; to: number;           // seconds
  env: (t: number, shotT: number) => React.ReactNode;
  cam?: Cam | ((t: number) => Cam);   // a function = a continuous camera over the whole shot (pans/pushes eased by the film's director)
  actors: ActorSpec[];
  /** foreground drawn after the actors, in world space */
  fg?: (t: number, shotT: number) => React.ReactNode;
};

export const smooth = (v: number) => { const u = Math.max(0, Math.min(1, v)); return u * u * (3 - 2 * u); };
const L = {stick, dodo, woman: stick};

export const speakerGesture = (lib: Lib, speech: Interval[] | undefined, t: number) => (speech ? L[lib].speechAt(t, speech) : {active: false, mouthOpen: 0, gesture: 0});

/** pose for one actor at absolute time t (shot-local shotT) */
function poseFor(a: ActorSpec, t: number, shotT: number) {
  const lib = L[a.lib];
  const sp = speakerGesture(a.lib, a.speech, t);
  const mode = a.mode ?? 'stand';
  if (a.poseFn) return {p: a.poseFn(t, shotT), sp};
  if (mode === 'sit') {
    const p = lib.poseAt(3, 'sit');
    if (sp.gesture > 0.001) {
      const sh = p.shoulders[1], target = {x: sh.x + 74 + 10 * sp.gesture, y: sh.y + 46 - 30 * sp.gesture};
      const arm = a.lib === 'stick' ? stick.chain(sh, target, 56, 57, 1) : dodo.chain(sh, target, 73, 1);
      p.elbows[1] = arm.joint; p.wrists[1] = arm.end;
    }
    return {p, sp};
  }
  if (mode === 'walk') return {p: lib.poseAt(3 + shotT, 'walk'), sp};
  if (mode === 'listen') return {p: lib.poseAt(Math.min(shotT, 3.2), 'listen'), sp};
  if (mode === 'angry') return {p: lib.poseAt(Math.min(shotT, 3), 'angry'), sp};
  if (mode === 'point') return {p: lib.poseAt(Math.min(shotT, 3), 'point'), sp};
  if (mode === 'wave') return {p: lib.poseAt(shotT, 'wave'), sp};
  if (a.speech && a.speech.length) return {p: lib.poseAt(t, 'talk', a.speech), sp};
  return {p: lib.poseAt(0, 'idle'), sp};
}

export const Actor: React.FC<{a: ActorSpec; t: number; shotT: number}> = ({a, t, shotT}) => {
  if (a.hide) return null;
  if (a.lib === 'woman') {
    const sp0 = speakerGesture('stick', a.speech, t);
    const html0 = makeupWomanMarkup(t, 'idle', {speech: a.speech ?? [], mood: a.mood ?? 'sad', flip: !!a.flip, mouthOpen: a.speech && a.speech.length ? sp0.mouthOpen : 0, height: 1.02});
    return <g transform={`translate(${a.x} ${a.y}) scale(${a.s ?? 1})`}><g dangerouslySetInnerHTML={{__html: html0}} /></g>;
  }
  const lib = L[a.lib];
  const base = lib.cast.find((c) => c.id === a.char);
  if (!base) throw new Error('unknown character ' + a.char);
  const c = {...base, ...(a.mod ?? {})} as never;
  const {p, sp} = poseFor(a, t, shotT);
  const speaking = (a.speech ?? []).length > 0;
  const mouth = speaking ? sp.mouthOpen : undefined;
  const mode = a.mode ?? 'stand';
  const opts: Record<string, unknown> = {
    pose: p, flip: !!a.flip, mouthOpen: mouth, speech: a.speech, expression: a.expr ?? (mode === 'angry' ? 'angry' : 'smile'), hands: a.hands, look: a.look && a.flip ? {x: -a.look.x, y: a.look.y} : a.look,
    idPrefix: 'f-' + a.key, showSeat: !!a.seat, openHands: sp.gesture > 0.2 ? true : undefined,
  };
  const html = (lib.characterMarkup as unknown as (c: unknown, t: number, m: string, o: unknown) => string)(c, t, mode === 'sit' ? 'sit' : 'idle', opts);
  const s = a.s ?? 1;
  return (
    <g transform={`translate(${a.x} ${a.y}) scale(${s})`}>
      <g transform={a.rot ? `rotate(${a.rot(t, shotT)})` : undefined}>
        <g dangerouslySetInnerHTML={{__html: html}} />
        {a.extra ? a.extra(t, shotT) : null}
      </g>
    </g>
  );
};

export type FilmProps = {
  shots: Shot[];
  lines: {words: CapWord[]}[];
  audio: string;                       // file under public/
  bg?: string;
};

/** captions: pages ≤4 words, each word at its own onset; the page object list is built once per film */
export const useFilmPages = (lines: {words: CapWord[]}[]): CapPage[] => React.useMemo(() => capPages(lines), [lines]);

export const Film: React.FC<FilmProps> = ({shots, lines, audio, bg = '#1a1410'}) => {
  const name = audio;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pages = useFilmPages(lines);
  React.useEffect(() => { const w = sizeAudit(shots); if (w.length) console.warn('SIZE-AUDIT-WARN ' + name + ' ' + w.slice(0, 3).join(' | ')); else console.log('SIZE-AUDIT-OK ' + name); }, [shots]);
  const shot = shots.find((s) => t >= s.from && t < s.to) ?? shots[shots.length - 1];
  const shotT = t - shot.from, dur = Math.max(.01, shot.to - shot.from);
  const camRaw = shot.cam ?? {x: 540, y: 960, z: 1};
  const cam = typeof camRaw === 'function' ? camRaw(t) : camRaw;
  const k = smooth(shotT / dur);
  const cx = cam.x + ((cam.x2 ?? cam.x) - cam.x) * k, cy = cam.y + ((cam.y2 ?? cam.y) - cam.y) * k, z = cam.z + ((cam.z2 ?? cam.z) - cam.z) * k;
  return (
    <HybridHost>
    <AbsoluteFill style={{background: bg}}>
      <Audio src={staticFile(audio)} />
      <CartoonGfx>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
          <g transform={`translate(540 960) scale(${z}) translate(${-cx} ${-cy})`}>
            {shot.env(t, shotT)}
            {shot.actors.map((a) => <Actor key={a.key} a={a} t={t} shotT={shotT} />)}
            {shot.fg ? shot.fg(t, shotT) : null}
          </g>
        </svg>
        <Captions t={t} pages={pages} />
        <Watermark />
      </CartoonGfx>
    </AbsoluteFill>
    </HybridHost>
  );
};

/** helper: words of a sentence from a flat word list → caption line */
export const toLines = (words: {t: string; at: number; to: number}[], breaks: number[]): {words: CapWord[]}[] => {
  const out: {words: CapWord[]}[] = [];
  let cur: CapWord[] = [];
  words.forEach((w, i) => { cur.push(w); if (breaks.includes(i) || i === words.length - 1) { out.push({words: cur}); cur = []; } });
  return out;
};

/** camera keyframes → smooth function: linear drift inside a key pair marked hold, eased (smoothstep) between the others */
export type CamKey = {t: number; x: number; y: number; z: number; hold?: boolean};
export const camFromKeys = (keys: CamKey[]) => (t: number): Cam => {
  const ks = [...keys].sort((a, b) => a.t - b.t);
  if (t <= ks[0].t) return ks[0];
  const last = ks[ks.length - 1];
  if (t >= last.t) return last;
  let i = 0; while (ks[i + 1].t < t) i++;
  const a = ks[i], b = ks[i + 1], u = (t - a.t) / Math.max(.001, b.t - a.t), k = a.hold ? u : smooth(u);
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k};
};

/** a full stick-library pose from wrist/ankle targets (two-bone IK exactly as the library solves it) */
type V2 = {x: number; y: number};
export function buildStick(base: ReturnType<typeof stick.poseAt>, wr: [V2?, V2?], an: [V2?, V2?], angle = 0) {
  const W: V2[] = [wr[0] ?? base.wrists[0], wr[1] ?? base.wrists[1]], A: V2[] = [an[0] ?? base.ankles[0], an[1] ?? base.ankles[1]];
  const elbows: V2[] = [], knees: V2[] = [];
  for (let j = 0; j < 2; j++) {
    const up = W[j].y < base.shoulders[j].y + 10;
    const arm = stick.chain(base.shoulders[j], W[j], 56, 57, up ? 1 : (j === 0 ? 1 : -1)); elbows.push(arm.joint); W[j] = arm.end;
    const leg = stick.chain(base.hips[j], A[j], 60, 60, j === 0 ? 1 : -1); knees.push(leg.joint); A[j] = leg.end;
  }
  return {...base, wrists: W as [V2, V2], ankles: A as [V2, V2], elbows, knees, angle};
}

/** drawn height of an actor (library height × scale) and the ground line its feet stand on (a figure seated on furniture stands on the floor below the seat) */
export const drawnHeight = (a: ActorSpec): number => {
  if (a.lib === 'woman') return 1.02 * (a.s ?? 1);
  const base = L[a.lib].cast.find((c) => c.id === a.char);
  return ((a.mod as {height?: number} | undefined)?.height ?? base?.height ?? 1) * (a.s ?? 1);
};
const groundOf = (a: ActorSpec) => (a.mode === 'sit' && a.y < 1400 ? a.y + 50 * (a.s ?? 1) : a.y);
/** size audit (user order 2026-11-10: the sheikh was drawn far bigger than the man): in one shot two grown-ups may differ at most 1.45× in drawn height,
 *  and a figure standing farther back (feet higher in the frame by 150px or more) must never be drawn bigger than a nearer grown-up */
export const sizeAudit = (shots: Shot[]): string[] => {
  const out: string[] = [];
  shots.forEach((sh, i) => {
    const adults = sh.actors.filter((a) => a.lib === 'woman' || !['boy-big', 'boy-small', 'boy-street', 'girl'].includes(a.char));
    const hs = adults.map((a) => ({k: a.key, h: drawnHeight(a), g: groundOf(a)}));
    if (hs.length > 1) {
      const hi = Math.max(...hs.map((x) => x.h)), lo = Math.min(...hs.map((x) => x.h));
      if (hi / lo > 1.45) out.push('shot ' + i + ' (' + sh.from.toFixed(1) + 's): adults differ ' + (hi / lo).toFixed(2) + '× ' + hs.map((x) => x.k + '=' + x.h.toFixed(2)).join(' '));
      for (const f of hs) for (const n of hs) if (n.g - f.g >= 150 && f.h > n.h * 1.0) out.push('shot ' + i + ' (' + sh.from.toFixed(1) + 's): ' + f.k + ' stands farther back but is drawn bigger than ' + n.k);
    }
  });
  return out;
};
