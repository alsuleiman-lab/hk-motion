import React from 'react';
import * as stick from '../cartoon_projects/family_stick/rig';
import {Film, buildStick, camFromKeys, type Shot, type ActorSpec} from './cartoon/FilmKit';
import {Pa, Re, El} from './cartoon/EnvsOffice';
import {MosqueHall, RobesRear, TopRows, PovFloor, Studio, Scroll, BeadsHand, Stink, Crawler} from './cartoon/MosqueKit';
import {LINES, SPEECH} from './mosquefilm/data';
import {FONT_TITLE} from './localFonts';

/** «آداب المسجد» — Abu Khatt family version of the 3-D satire: the narrator in the blue suit, smells, low floor-level views, papyrus cards, pauses kept as in the source. */
export const MOSQUE_SECONDS = 114;
const FY = 1600, S = 1.5;
const base = () => stick.poseAt(0, 'idle');
const none: [undefined, undefined] = [undefined, undefined];
const FOLD = () => buildStick(base(), [{x: -14, y: -168}, {x: 16, y: -172}], none);
const WIDE = () => buildStick(base(), [{x: -14, y: -168}, {x: 16, y: -172}], [{x: -66, y: -8}, {x: 68, y: -8}]);
const UP = () => buildStick(base(), [{x: -82, y: -300}, {x: 82, y: -300}], none);
const ROBE = {grandRobe: true, cloth: '#fffdf5'};

const fogGlasses = (fog: number) => () => (
  <g>
    <Pa d="M-24 -236 L0 -194 L24 -236 L16 -240 L0 -214 L-16 -240Z" f="#f2c14e" w={4} />
    <Pa d="M30 -190 L44 -196 L40 -184Z" f="#f2c14e" w={3} />
    {[-17, 17].map((x) => <Re key={x} x={x - 17} y={-313} w={34} h={30} rx={9} f={`rgba(235,240,245,${fog})`} sw={6} />)}
    <Pa d="M-3 -299 L3 -299" w={5} />
  </g>
);
const NAR = (over: Partial<ActorSpec> = {}): ActorSpec => ({key: 'nar', lib: 'stick', char: 'father', x: 540, y: FY, s: S, mod: {cloth: '#3f6fd1'}, extra: fogGlasses(.25), poseFn: FOLD, speech: SPEECH.N, expr: 'neutral', ...over});
const W = (key: string, x: number, over: Partial<ActorSpec> = {}): ActorSpec => ({key, lib: 'stick', char: 'uncle', x, y: FY, s: S, mod: ROBE, poseFn: FOLD, expr: 'neutral', ...over});
const OLD = (over: Partial<ActorSpec> = {}): ActorSpec => ({key: 'old', lib: 'stick', char: 'uncle', x: 540, y: FY, s: S, mod: {...ROBE, beard: {color: '#eeeeee', length: 36}}, poseFn: FOLD, expr: 'happy',
  extra: () => <g>{[-17, 17].map((x) => <Re key={x} x={x - 17} y={-313} w={34} h={30} rx={9} f="rgba(255,255,255,.4)" sw={6} />)}<Pa d="M-3 -299 L3 -299" w={5} /></g>, ...over});

const hall = (t: number) => <MosqueHall t={t} />;
const hy = (y: number, s: number, h = 1) => y - 296 * s * h;
const face = (a: number, b: number, x: number, y: number, s: number, z: number, h = 1, z2 = z * 1.1) => camFromKeys([{t: a, x, y: hy(y, s, h) + 30, z}, {t: b, x, y: hy(y, s, h) + 30, z: z2}]);
const drift = (a: number, b: number, x: number, y: number, z: number, x2 = x, y2 = y, z2 = z) => camFromKeys([{t: a, x, y, z}, {t: b, x: x2, y: y2, z: z2}]);
const scroll = (a: number, b: number, idx: number[]): Shot => ({from: a, to: b, env: (t) => <Scroll t={t} titleAt={9.0} lines={idx.map((i) => LINES[i])} />, cam: drift(a, b, 540, 940, 1, 540, 930, 1.06), actors: []});

export const MOSQUE_SHOTS: Shot[] = [
  {from: 0, to: 1.1, env: (t) => <TopRows t={t} kind="takbir" />, cam: drift(0, 1.1, 540, 1100, 1, 540, 1000, 1.08), actors: []},
  {from: 1.1, to: 5.6, env: hall, cam: face(1.1, 5.6, 540, FY, S, 2.7), actors: [NAR({speech: undefined, extra: fogGlasses(.7)})], fg: (t) => <Stink x={540} y={hy(FY, S)} s={1.15} t={t} ring />},
  {from: 5.6, to: 6.4, env: hall, cam: drift(5.6, 6.4, 1145, 1080, 2.2, 1145, 1060, 2.3), actors: []},
  {from: 6.4, to: 9.0, env: (t) => <g><Studio t={t} /><Pa d="M250 1280 L250 1450 M470 1280 L470 1450 M250 1280 L250 1180 L470 1180 L470 1280" w={9} s="#8a5a34" /><Re x={238} y={1340} w={244} h={28} f="#b88a5a" sw={7} rx={6} /></g>,
    cam: drift(6.4, 9.0, 420, 1230, 2.0, 410, 1210, 2.2), actors: [NAR({x: 360, y: 1440, mode: 'sit', poseFn: undefined, mod: {cloth: '#3f6fd1'}})]},
  {from: 9.0, to: 13.0, env: (t) => <Scroll t={t} titleAt={9.0} lines={[LINES[3]]} />, cam: drift(9, 13, 540, 940, 1, 540, 960, 1.12), actors: []},
  {from: 13.0, to: 14.0, env: hall, cam: face(13, 14, 540, FY, S, 2.9), actors: [NAR({speech: undefined, extra: fogGlasses(.75)})], fg: (t) => <Stink x={540} y={hy(FY, S)} s={1.2} t={t} ring />},
  {from: 14.0, to: 15.9, env: hall, cam: face(14, 15.9, 540, FY, S, 2.8, 1.04), actors: [W('m1', 540, {expr: 'surprised'})], fg: (t) => <Stink x={540} y={hy(FY, S, 1.04) + 90} s={.7} t={t} seed={1} />},
  {from: 15.9, to: 19.9, env: hall, cam: face(15.9, 19.9, 540, FY, S, 2.8), actors: [W('m2', 540, {char: 'father', expr: 'smile'})], fg: (t) => <Stink x={540} y={hy(FY, S) + 60} s={.95} t={t} seed={5} />},
  {from: 19.9, to: 21.0, env: (t) => <RobesRear t={t} />, cam: drift(19.9, 21, 540, 700, 1, 540, 760, 1.05), actors: []},
  {from: 21.0, to: 23.6, env: (t, st) => <RobesRear t={t} stink shuffle={6 * Math.sin(st * 6)} />, cam: drift(21, 23.6, 540, 900, 1.05, 540, 1100, 1.25), actors: []},
  {from: 23.6, to: 24.9, env: hall, cam: drift(23.6, 24.9, 540, 1280, 1.05, 540, 1250, 1.2), actors: [W('l', 150), NAR(), W('r', 930, {flip: true})]},
  {from: 24.9, to: 26.2, env: (t) => <TopRows t={t} kind="sujood" />, cam: drift(24.9, 26.2, 540, 1000, 1, 540, 1080, 1.1), actors: []},
  {from: 26.2, to: 30.0, env: hall, cam: drift(26.2, 30, 540, 1380, 1.25, 540, 1350, 1.4), actors: [W('l', 210, {mode: 'sit', poseFn: undefined, y: 1560}), NAR({x: 540, y: 1560, mode: 'sit', poseFn: undefined}), W('r', 870, {mode: 'sit', poseFn: undefined, y: 1560, flip: true})]},
  scroll(30.0, 32.0, [3, 10]),
  {from: 32.0, to: 38.0, env: (t, st) => <PovFloor t={t} lt={st} mode="feet" />, cam: drift(32, 38, 540, 1100, 1, 540, 1150, 1.1), actors: []},
  {from: 38.0, to: 41.0, env: (t, st) => <PovFloor t={t} lt={st} mode="up" />, cam: drift(38, 41, 540, 900, 1, 540, 960, 1.08), actors: [NAR({x: 540, y: 260, s: 2.5, rot: () => 180, extra: fogGlasses(.2)})]},
  {from: 41.0, to: 42.4, env: hall, cam: drift(41, 42.4, 540, 1250, 1, 540, 1230, 1.12), actors: [W('l', 220, {flip: false}), NAR({poseFn: WIDE}), W('r', 860, {flip: true})]},
  scroll(42.4, 44.0, [3, 10, 15]),
  {from: 44.0, to: 45.0, env: hall, cam: drift(44, 45, 700, 1450, 1.1, 520, 1450, 1.2), actors: [], fg: (t, st) => <Crawler x={900 - 360 * st} y={1560} t={t} s={1.1} />},
  {from: 45.0, to: 46.1, env: hall, cam: drift(45, 46.1, 540, 1250, 1, 540, 1250, 1.05), actors: [W('walker', 100, {mode: 'walk', poseFn: undefined, y: 1420, s: 1.0, path: (t, st) => ({x: 100 + 300 * st, y: 1420})})]},
  {from: 46.1, to: 50.0, env: hall, cam: drift(46.1, 50, 540, 1230, 1.1, 540, 1200, 1.25), actors: [W('l', 150), NAR({expr: 'surprised'}), {key: 'kid', lib: 'stick', char: 'boy-street', x: 880, y: FY, s: 1.3, mod: {cloth: '#1c1c1c'}, flip: true, poseFn: FOLD}]},
  {from: 50.0, to: 51.0, env: hall, cam: face(50, 51, 540, FY, S, 2.4, 1.04), actors: [W('mic', 540, {expr: 'happy', extra: () => <g><Re x={-34} y={-345} w={68} h={36} rx={14} f="#27406b" sw={6} /><Pa d="M-38 -316 L38 -316" w={4} s="#222" />{[-17, 17].map((x) => <Re key={x} x={x - 16} y={-312} w={32} h={24} rx={8} f="#111" sw={4} />)}</g>})],
    fg: () => <g><Pa d="M720 1620 L520 1180" w={18} s="#2a2a2a" /><El x={500} y={1150} rx={40} ry={46} f="#555" w={7} /></g>},
  {from: 51.0, to: 53.0, env: hall, cam: drift(51, 53, 540, 1230, 1.2, 500, 1210, 1.35), actors: [W('l', 150, {flip: false}), NAR({expr: 'smile'}), {key: 'kid', lib: 'stick', char: 'boy-street', x: 880, y: FY, s: 1.3, mod: {cloth: '#1c1c1c'}, flip: true, poseFn: FOLD}]},
  {from: 53.0, to: 56.0, env: hall, cam: face(53, 56, 540, FY, 1.3, 2.4, .84), actors: [{key: 'kid', lib: 'stick', char: 'boy-street', x: 540, y: FY, s: 1.3, mod: {cloth: '#1c1c1c'}, poseFn: FOLD, expr: 'sad', rot: (t) => 1.2 * Math.sin(t * 22)}]},
  {from: 56.0, to: 59.2, env: hall, cam: drift(56, 59.2, 540, 1330, 1, 600, 1330, 1.15), actors: [
    W('a', 130, {s: .8, y: 1480}), W('b', 230, {s: .8, y: 1480}), W('c', 330, {s: .8, y: 1480}), {key: 'kid2', lib: 'stick', char: 'boy-street', x: 450, y: 1480, s: .72, mod: {cloth: '#1c1c1c'}, poseFn: FOLD},
    {key: 'boy', lib: 'stick', char: 'boy-big', x: 900, y: 1620, s: 1.0, mode: 'walk', poseFn: undefined, flip: true, path: (t, st) => ({x: 900 - 260 * Math.min(1, st / 3.0), y: 1620 - 130 * Math.min(1, st / 3.0)})}]},
  {from: 59.2, to: 62.4, env: hall, cam: drift(59.2, 62.4, 540, 1180, 1.7, 540, 1160, 1.9), actors: [
    {key: 'kid', lib: 'stick', char: 'boy-street', x: 420, y: FY, s: 1.4, mod: {cloth: '#1c1c1c'}, poseFn: FOLD, expr: 'surprised', rot: (t, st) => -4 * Math.sin(st * 5)},
    {key: 'boy', lib: 'stick', char: 'boy-big', x: 700, y: FY, s: 1.4, mode: 'angry', expr: 'smirk', poseFn: () => buildStick(base(), [{x: -96, y: -200}, {x: 96, y: -200}], none, -6), flip: true, path: (t, st) => ({x: 700 - 40 * Math.abs(Math.sin(st * 3)), y: FY})}]},
  {from: 62.4, to: 64.3, env: hall, cam: face(62.4, 64.3, 540, 1650, 1.4, 2.2, .77), actors: [{key: 'boy', lib: 'stick', char: 'boy-big', x: 540, y: 1650, s: 1.4, mode: 'sit', expr: 'smirk', mod: {cloth: '#e8e8e8'}}]},
  {from: 64.3, to: 66.3, env: hall, cam: face(64.3, 66.3, 540, FY, S, 1.7), actors: [NAR({expr: 'angry'})]},
  {from: 66.3, to: 68.0, env: hall, cam: drift(66.3, 68, 540, 1180, 1, 540, 1150, 1.08), actors: [...[0, 1, 2, 3, 4, 5].map((i) => W('row' + i, 130 + i * 170, {s: .6, y: 1440})), NAR({x: 640, y: 1440, s: .6, speech: undefined})]},
  {from: 68.0, to: 69.3, env: hall, cam: drift(68, 69.3, 600, 1250, 1.1, 580, 1230, 1.2), actors: [NAR({x: 700, y: FY, rot: () => 7, expr: 'surprised'})], fg: () => <g><Re x={740} y={560} w={330} h={1020} f="#6b3f26" sw={9} /><Re x={780} y={640} w={250} h={420} f="#4a6b45" sw={6} /><El x={800} y={1120} rx={14} ry={14} f="#d8b04a" w={4} /></g>},
  scroll(69.3, 70.7, [3, 10, 15, 28]),
  {from: 70.7, to: 72.0, env: hall, cam: drift(70.7, 72, 540, 1250, 1.1, 540, 1230, 1.2), actors: [OLD({x: 200}), NAR({x: 640})]},
  {from: 72.0, to: 74.9, env: hall, cam: face(72, 74.9, 540, FY, S, 3.0, 1.04), actors: [OLD({})]},
  {from: 74.9, to: 77.3, env: hall, cam: face(74.9, 77.3, 540, FY, S, 2.8), actors: [NAR({extra: fogGlasses(.7), speech: undefined})]},
  {from: 77.3, to: 79.9, env: hall, cam: drift(77.3, 79.9, 540, 1250, 1.1, 520, 1230, 1.25), actors: [OLD({x: 250}), NAR({x: 700})]},
  {from: 79.9, to: 81.0, env: hall, cam: face(79.9, 81, 540, FY, S, 3.0, 1.04), actors: [OLD({speech: SPEECH.O, expr: 'happy'})]},
  {from: 81.0, to: 82.0, env: hall, cam: face(81, 82, 540, FY, S, 2.7), actors: [NAR({speech: SPEECH.N})]},
  {from: 82.0, to: 85.0, env: hall, cam: face(82, 85, 540, FY, S, 3.0, 1.04), actors: [OLD({speech: SPEECH.O, expr: 'happy', rot: (t) => 2 * Math.sin(t * 2)})]},
  {from: 85.0, to: 86.2, env: hall, cam: face(85, 86.2, 540, FY, S, 2.6), actors: [NAR({expr: 'angry'})]},
  {from: 86.2, to: 88.2, env: hall, cam: drift(86.2, 88.2, 540, 1500, 1.5, 540, 1380, 1.6), actors: [OLD({mod: {...ROBE, cloth: '#f4a6b8', beard: {color: '#eeeeee', length: 36}}, y: 1800, s: 2.0, poseFn: UP, expr: 'happy'})]},
  {from: 88.2, to: 90.9, env: hall, cam: face(88.2, 90.9, 540, 1800, 2.0, 2.0, 1.04), actors: [OLD({mod: {...ROBE, cloth: '#f4a6b8', beard: {color: '#eeeeee', length: 36}}, y: 1800, s: 2.0, poseFn: UP, expr: 'smile'})]},
  {from: 90.9, to: 92.7, env: hall, cam: face(90.9, 92.7, 540, 1800, 2.0, 2.0), actors: [NAR({y: 1800, s: 2.0, mod: {cloth: '#1b3a8a'}, poseFn: UP, expr: 'neutral', extra: fogGlasses(.5)})]},
  {from: 92.7, to: 95.6, env: hall, cam: face(92.7, 95.6, 540, FY, S, 2.7, 1, 2.9), actors: [NAR({speech: undefined, mod: {cloth: '#1b3a8a'}, extra: fogGlasses(.2), expr: 'neutral'})]},
  scroll(95.6, 97.0, [3, 10, 15, 28, 41]),
  {from: 97.0, to: 99.0, env: hall, cam: drift(97, 99, 800, 1280, 1.2, 760, 1280, 1.3), actors: [NAR({x: 700, y: 1560, mode: 'sit', poseFn: undefined})], fg: () => <g><Pa d="M130 -100 L170 1560 L330 1560 L360 -100Z" f="#f6f4ee" w={7} /></g>},
  {from: 99.0, to: 101.0, env: hall, cam: drift(99, 101, 540, 1000, 1, 540, 1000, 1.06), actors: [], fg: (t) => <BeadsHand t={t} />},
  {from: 101.0, to: 103.9, env: hall, cam: drift(101, 103.9, 800, 1280, 1.2, 760, 1280, 1.3), actors: [NAR({x: 700, y: 1560, mode: 'sit', poseFn: undefined})], fg: () => <g><Pa d="M130 -100 L170 1560 L330 1560 L360 -100Z" f="#f6f4ee" w={7} /></g>},
  {from: 103.9, to: 108.7, env: hall, cam: face(103.9, 108.7, 540, FY, S, 3.0, 1.04), actors: [OLD({expr: 'happy', rot: (t) => 2.4 * Math.sin(t * 9)})]},
  {from: 108.7, to: MOSQUE_SECONDS, env: (t) => <g><Studio t={t} /><Pa d="M250 1280 L250 1450 M470 1280 L470 1450 M250 1280 L250 1180 L470 1180 L470 1280" w={9} s="#8a5a34" /><Re x={238} y={1340} w={244} h={28} f="#b88a5a" sw={7} rx={6} /></g>,
    cam: drift(108.7, MOSQUE_SECONDS, 420, 1230, 2.0, 410, 1220, 2.15), actors: [NAR({x: 360, y: 1440, mode: 'sit', poseFn: undefined})]},
];

export const MosqueFilm: React.FC = () => { FONT_TITLE(); return <Film shots={MOSQUE_SHOTS} lines={LINES} audio="stick_mosque_audio.wav" />; };
