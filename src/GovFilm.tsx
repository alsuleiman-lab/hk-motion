import React from 'react';
import * as dodo from '../cartoon_projects/dodo_family/rig';
import {Film, camFromKeys, type Shot, type ActorSpec} from './cartoon/FilmKit';
import {OfficeRoom, OfficeDesk, Pa, El} from './cartoon/EnvsOffice';
import {ThoughtBubble} from './cartoon/GovBubble';
import {LINES, SPEECH} from './govfilm/data';
import {FONT_TITLE} from './localFonts';

/** «ما دور الحكومة؟» — Dodo family version: a man asks an official; while he lists what he means a thought bubble over his head shows each scene; the official answers. */
export const GOV_SECONDS = 33;
const AX = 330, AY = 1590, AS = 1.5, OX = 800, OY = 1500, OS = 1.4;

const WALK_END = 2.7;
const asker = (over: Partial<ActorSpec> = {}): ActorSpec => ({
  key: 'asker', lib: 'dodo', char: 'father', x: AX, y: AY, s: AS, speech: SPEECH.A, expr: 'curious',
  path: (t) => ({x: t < WALK_END ? -170 + (AX + 170) * (t / WALK_END) : AX, y: AY}),
  poseFn: (t) => (t < WALK_END ? dodo.poseAt(3 + t, 'walk') : dodo.poseAt(t, 'talk', SPEECH.A)),
  ...over,
});

/** the official's suit: white shirt V, red tie, round glasses, name badge (drawn in the actor's local space) */
const suit = () => (
  <g>
    <Pa d="M-24 -236 L0 -196 L24 -236 L18 -150 L-18 -150Z" f="#fffaf0" w={4} />
    <Pa d="M-7 -224 L7 -224 L11 -168 L0 -150 L-11 -168Z" f="#c0392b" w={4} />
    <Pa d="M-50 -238 L-22 -230 L-4 -178 L-34 -150 L-54 -170Z" f="#27304a" w={4} /><Pa d="M50 -238 L22 -230 L4 -178 L34 -150 L54 -170Z" f="#27304a" w={4} />
    <El x={-17} y={-296} rx={14} ry={14} f="none" w={4} /><El x={17} y={-296} rx={14} ry={14} f="none" w={4} /><Pa d="M-3 -296 L3 -296" w={4} />
  </g>
);
const official = (over: Partial<ActorSpec> = {}): ActorSpec => ({
  key: 'official', lib: 'dodo', char: 'uncle', x: OX, y: OY, s: OS, flip: true, expr: 'neutral', speech: SPEECH.O, mod: {cloth: '#27304a'}, extra: suit, ...over,
});

const env = (t: number) => <OfficeRoom t={t} />;
const desk = () => <OfficeDesk />;
const wideFg = (t: number) => <g>{desk()}<ThoughtBubble t={t} cx={340} cy={640} hx={AX + 10} hy={AY - 560} /></g>;

export const GOV_SHOTS: Shot[] = [
  {from: 0, to: 20.5, env, cam: camFromKeys([{t: 0, x: 540, y: 960, z: 1}, {t: 20.5, x: 530, y: 950, z: 1.04}]), actors: [official({speech: undefined, mode: 'listen'}), asker()], fg: wideFg},
  {from: 20.5, to: 26.0, env, cam: camFromKeys([{t: 20.5, x: 540, y: 960, z: 1}, {t: 22.4, x: 800, y: 1010, z: 1.75}, {t: 26.0, x: 800, y: 1000, z: 1.85, hold: true}]), actors: [official({expr: 'smile'})], fg: () => desk()},
  {from: 26.0, to: 28.6, env, cam: camFromKeys([{t: 26, x: 330, y: 1250, z: 1.9}, {t: 28.6, x: 330, y: 1250, z: 2.0, hold: true}]), actors: [asker({path: undefined, poseFn: undefined, mode: 'listen', speech: undefined, expr: 'curious'})]},
  {from: 28.6, to: 31.0, env, cam: camFromKeys([{t: 28.6, x: 330, y: 1250, z: 2.05}, {t: 31, x: 330, y: 1250, z: 2.15, hold: true}]), actors: [asker({path: undefined, poseFn: undefined, mode: 'listen', speech: undefined, expr: 'surprised'})]},
  {from: 31.0, to: GOV_SECONDS, env, cam: camFromKeys([{t: 31, x: 540, y: 980, z: 1}, {t: 33, x: 560, y: 970, z: 1.06, hold: true}]), actors: [official({poseFn: (t) => dodo.poseAt(1.5 + Math.max(0, t - 31.1), 'wave'), expr: 'happy'}), asker({path: undefined, poseFn: undefined, mode: 'listen', speech: undefined, expr: 'surprised', look: {x: 1, y: 0}})], fg: () => desk()},
];

export const GovFilm: React.FC = () => { FONT_TITLE(); return <Film shots={GOV_SHOTS} lines={LINES} audio="dodo_gov_audio.wav" />; };
