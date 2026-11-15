import React from 'react';
import * as stick from '../../cartoon_projects/family_stick/rig';
import {buildStick, smooth} from './FilmKit';
import {Pa} from './EnvsOffice';

/** Abu Khatt characters performing the prayer in profile (stand, bow, prostrate, sit): the library's own head, arms and legs, with the torso+head+arms
 *  rotated about the hips and the legs placed by hand (rig option `part`). */
type V = {x: number; y: number};
export type PP = {hx: number; hy: number; th: number; k: V; a: V; w: V};
const pp = (hx: number, hy: number, th: number, kx: number, ky: number, ax: number, ay: number, wx: number, wy: number): PP => ({hx, hy, th, k: {x: kx, y: ky}, a: {x: ax, y: ay}, w: {x: wx, y: wy}});
export const PRAY: Record<'stand' | 'ruku' | 'sujood' | 'sit' | 'crawl', PP> = {
  crawl: pp(-24, -74, 84, -4, -18, -64, -12, 112, -12),
  stand: pp(0, -125, 0, 0, -62, 2, -8, 20, -170),
  ruku: pp(6, -125, 88, 6, -62, 4, -8, 14, -66),
  sujood: pp(-34, -132, 118, 24, -26, -52, -12, 128, -12),
  sit: pp(-10, -66, 0, 58, -30, -42, -14, 44, -78),
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const blend = (a: PP, b: PP, k: number): PP => ({hx: lerp(a.hx, b.hx, k), hy: lerp(a.hy, b.hy, k), th: lerp(a.th, b.th, k), k: {x: lerp(a.k.x, b.k.x, k), y: lerp(a.k.y, b.k.y, k)}, a: {x: lerp(a.a.x, b.a.x, k), y: lerp(a.a.y, b.a.y, k)}, w: {x: lerp(a.w.x, b.w.x, k), y: lerp(a.w.y, b.w.y, k)}});
const CYCLE: [number, keyof typeof PRAY][] = [[0, 'stand'], [3, 'stand'], [4.2, 'ruku'], [5.8, 'ruku'], [7, 'stand'], [8.2, 'sujood'], [10, 'sujood'], [11.2, 'sit'], [12.6, 'sit'], [13.8, 'sujood'], [15.2, 'sujood'], [16.4, 'stand']];
export const CYCLE_LEN = 16.4;
export const prayAt = (t: number, off = 0): PP => {
  const u = (((t + off) % CYCLE_LEN) + CYCLE_LEN) % CYCLE_LEN;
  let i = 0; while (i < CYCLE.length - 2 && CYCLE[i + 1][0] <= u) i++;
  const [a, pa] = CYCLE[i], [b, pb] = CYCLE[i + 1];
  return pa === pb ? PRAY[pa] : blend(PRAY[pa], PRAY[pb], smooth((u - a) / (b - a)));
};

export const StickPray: React.FC<{x: number; y: number; s?: number; flip?: boolean; char?: string; mod?: Record<string, unknown>; p: PP; t: number; expr?: stick.Expression; collar?: boolean}> = ({x, y, s = 1, flip, char = 'uncle', mod, p, t, expr = 'neutral', collar}) => {
  const base = stick.cast.find((c) => c.id === char)!;
  const c = {...base, ...(mod ?? {}), height: 1} as never;
  const th = p.th * Math.PI / 180, cos = Math.cos(th), sin = Math.sin(th);
  const dx = p.w.x - p.hx, dy = p.w.y - p.hy;
  const wl: V = {x: dx * cos + dy * sin, y: -125 + (-dx * sin + dy * cos)};
  const b0 = stick.poseAt(0, 'idle');
  const legs = {...b0, hips: [{x: p.hx - 6, y: p.hy}, {x: p.hx + 6, y: p.hy}] as [V, V], knees: [{x: p.k.x - 5, y: p.k.y}, {x: p.k.x + 6, y: p.k.y}], ankles: [{x: p.a.x - 5, y: p.a.y}, {x: p.a.x + 6, y: p.a.y}] as [V, V]};
  const up = buildStick(b0, [wl, {x: wl.x + 8, y: wl.y + 6}], [undefined, undefined], -p.th * .7);
  const mk = stick.characterMarkup as unknown as (c: unknown, t: number, m: string, o: unknown) => string;
  const legsSvg = mk(c, t, 'idle', {pose: legs, part: 'legs'}), upSvg = mk(c, t, 'idle', {pose: up, part: 'upper', expression: expr});
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <g dangerouslySetInnerHTML={{__html: legsSvg}} />
      <g transform={`translate(${p.hx} ${p.hy + 125}) rotate(${p.th} 0 -125)`}>
        <g dangerouslySetInnerHTML={{__html: upSvg}} />
        {collar && <Pa d="M-24 -214 L0 -172 L24 -214 L16 -218 L0 -192 L-16 -218Z" f="#f2c14e" w={4} />}
      </g>
    </g>
  );
};

/** toddler crawling: hands and knees swing */
export const crawlAt = (t: number): PP => { const sw = Math.sin(t * 8); return {...PRAY.crawl, th: 84 + 3 * sw, hy: -74 + 3 * Math.abs(sw), w: {x: 112 + 20 * sw, y: -12 - 10 * Math.max(0, sw)}, k: {x: -4 - 16 * sw, y: -18 - 8 * Math.max(0, -sw)}}; };
