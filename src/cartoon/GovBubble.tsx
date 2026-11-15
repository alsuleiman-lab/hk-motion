import React from 'react';
import {Actor, type ActorSpec} from './FilmKit';
import {Pa, Re, El, INK} from './EnvsOffice';
import {Loaf} from './EnvsStory';

/** Thought-bubble mini scenes (frame 600×440, ground y≈400) for the "what is the government's role?" film.
 *  Each scene shows exactly what the asker says at that moment; characters are the real Dodo actors scaled down. */
export const BW = 600, BH = 440;

const mini = (key: string, over: Partial<ActorSpec> & {char: string}): ActorSpec => ({key: 'gb-' + key, lib: 'dodo', x: 300, y: 400, s: .62, mode: 'stand', ...over});
const A: React.FC<{a: ActorSpec; t: number; lt: number}> = ({a, t, lt}) => <Actor a={a} t={t} shotT={lt} />;
const Ground: React.FC<{f: string; y?: number}> = ({f, y = 400}) => <g><Re x={-20} y={y} w={BW + 40} h={BH - y + 40} f={f} sw={6} /></g>;

const Box: React.FC<{lt: number}> = ({lt}) => {
  const drop = Math.min(1, (lt % 1.1) / .7), cy = 40 + drop * 150;
  return (
    <g>
      <Re x={0} y={0} w={BW} h={BH} f="#f9eed6" sw={0} /><Ground f="#e8d3a6" />
      <Re x={190} y={180} w={220} h={210} f="#2e8b57" sw={7} rx={16} />
      <Re x={236} y={204} w={128} h={18} f="#14341f" sw={5} rx={8} />
      <text x={300} y={320} fontSize={74} fontWeight={800} fill="#fffaf0" textAnchor="middle" fontFamily='"Noto Kufi Arabic", sans-serif'>صدقة</text>
      {drop < 1 && <g><El x={300} y={cy} rx={22} ry={22} f="#f2c14e" w={5} /><text x={300} y={cy + 9} fontSize={24} fontWeight={800} fill={INK} textAnchor="middle">$</text></g>}
      <El x={300} y={394} rx={150} ry={12} f="#00000022" w={0} />
    </g>
  );
};

const Food: React.FC<{t: number; lt: number}> = ({t, lt}) => (
  <g>
    <Re x={0} y={0} w={BW} h={BH} f="#fbe9c8" sw={0} /><Ground f="#d9b98a" />
    <Re x={195} y={270} w={210} h={26} f="#8a5a34" sw={6} /><Re x={215} y={296} w={20} h={100} f="#8a5a34" sw={5} /><Re x={365} y={296} w={20} h={100} f="#8a5a34" sw={5} />
    <Pa d="M232 270 Q226 200 262 200 L338 200 Q374 200 368 270Z" f="#7e8a96" w={6} /><Re x={246} y={188} w={108} h={16} f="#566370" sw={5} rx={6} />
    {[0, 1, 2].map((i) => <Pa key={i} d={`M${268 + i * 22} 178 Q${256 + i * 22 + 14 * Math.sin(lt * 3 + i)} 140 ${270 + i * 22} 104`} w={5} s="#9a9a9a" />)}
    <Loaf x={420} y={262} s={.55} /><Loaf x={450} y={262} s={.55} /><Loaf x={436} y={236} s={.55} />
    <A a={mini('f1', {char: 'boy-small', x: 90, y: 402, s: .7, mode: 'wave', expr: 'happy'})} t={t} lt={lt} />
    <A a={mini('f2', {char: 'girl', x: 520, y: 402, s: .7, mode: 'wave', expr: 'happy', flip: true})} t={t} lt={lt} />
  </g>
);

const Cloth: React.FC<{t: number; lt: number}> = ({t, lt}) => (
  <g>
    <Re x={0} y={0} w={BW} h={BH} f="#e8f0f7" sw={0} /><Ground f="#cdbd9d" />
    <Pa d="M70 120 L530 120" w={8} /><Pa d="M70 120 L70 400 M530 120 L530 400" w={8} />
    {['#e45a4f', '#4f86c6', '#f2c14e', '#5aa469', '#9b6bc9'].map((c, i) => (
      <g key={i} transform={`translate(${130 + i * 86} 124) rotate(${3 * Math.sin(lt * 2 + i)})`}>
        <Pa d="M0 0 L-8 18 L8 18Z" w={4} /><Pa d="M-34 24 L-18 18 L18 18 L34 24 L44 70 L26 74 L22 60 L22 124 L-22 124 L-22 60 L-26 74 L-44 70Z" f={c} w={6} />
      </g>
    ))}
    <A a={mini('c1', {char: 'boy-big', x: 80, y: 402, s: .72, mode: 'wave', expr: 'happy', mod: {cloth: '#e45a4f'}})} t={t} lt={lt} />
    <A a={mini('c2', {char: 'boy-small', x: 520, y: 402, s: .72, mode: 'wave', expr: 'happy', flip: true, mod: {cloth: '#4f86c6'}})} t={t} lt={lt} />
  </g>
);

const Clinic: React.FC<{t: number; lt: number}> = ({t, lt}) => (
  <g>
    <Re x={0} y={0} w={BW} h={BH} f="#e4f3ef" sw={0} /><Ground f="#c3d8d2" />
    <Re x={440} y={40} w={110} h={110} f="#fffaf0" sw={7} rx={10} /><Pa d="M470 95 L520 95 M495 70 L495 120" w={20} s="#d0382d" />
    <Re x={40} y={330} w={230} h={34} f="#fffaf0" sw={6} rx={8} /><Re x={52} y={364} w={12} h={40} f="#7a8a8a" sw={4} /><Re x={246} y={364} w={12} h={40} f="#7a8a8a" sw={4} />
    <A a={mini('k1', {char: 'boy-small', x: 150, y: 334, s: .66, mode: 'sit', expr: 'sad', extra: () => <g><Pa d="M-40 -330 Q0 -352 40 -330 L40 -306 Q0 -322 -40 -306Z" f="#fffaf0" w={4} /></g>})} t={t} lt={lt} />
    <A a={mini('k2', {char: 'uncle', x: 400, y: 402, s: .7, flip: true, mode: 'listen', expr: 'smile', mod: {cloth: '#fffaf0'}, extra: () => <g><Pa d="M-34 -222 Q-44 -150 -4 -146 Q30 -150 24 -222" w={5} s="#3b3b3b" /><El x={-4} y={-140} rx={12} ry={12} f="#9aa7b2" w={4} /></g>})} t={t} lt={lt} />
  </g>
);

const Well: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const up = (Math.sin(lt * 2.2) + 1) / 2, by = 160 + 130 * (1 - up);
  return (
    <g>
      <Re x={0} y={0} w={BW} h={BH} f="#cfe9f6" sw={0} />
      <Pa d="M-20 330 Q120 270 260 320 Q420 270 640 330 L640 460 L-20 460Z" f="#ead19a" w={6} />
      <Ground f="#e9c98d" y={340} />
      <Re x={196} y={262} w={168} h={90} f="#b9a98f" sw={7} rx={6} /><Pa d="M196 292 L364 292 M240 262 L240 292 M290 292 L290 352 M334 262 L334 292" w={4} />
      <Pa d="M214 262 L214 110 M346 262 L346 110 M196 118 L364 118" w={9} s="#6b4a2b" />
      <El x={280} y={124} rx={20} ry={20} f="#c0c0c0" w={5} />
      <Pa d={`M280 124 L280 ${by}`} w={4} />
      <Pa d={`M262 ${by} L298 ${by} L292 ${by + 34} L268 ${by + 34}Z`} f="#8a5a34" w={5} />
      {up > .8 && [0, 1, 2, 3].map((i) => <El key={i} x={300 + i * 16} y={by + 40 + ((lt * 90 + i * 30) % 60)} rx={5} ry={7} f="#4fa3d8" w={0} />)}
      <A a={mini('w1', {char: 'uncle', x: 440, y: 404, s: .7, flip: true, mode: 'wave', expr: 'happy', mod: {grandRobe: true, cloth: '#e07a1f'}})} t={t} lt={lt} />
      <A a={mini('w2', {char: 'boy-small', x: 130, y: 404, s: .66, mode: 'wave', expr: 'happy'})} t={t} lt={lt} />
    </g>
  );
};

const Truck: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const k = Math.min(1, lt / .9), e = 1 - (1 - k) * (1 - k), tx = -330 + e * 420, flow = lt > .7;
  return (
    <g>
      <Re x={0} y={0} w={BW} h={BH} f="#cfe9f6" sw={0} />
      <Pa d="M520 340 Q530 250 500 170 M520 170 Q470 140 440 170 M520 170 Q570 130 600 170 M520 180 Q490 210 460 200 M520 180 Q560 215 590 205" w={7} s="#2f7d46" />
      <Ground f="#e9c98d" y={350} /><Re x={-20} y={392} w={BW + 40} h={60} f="#6c6c76" sw={0} />
      <g transform={`translate(${tx} ${Math.sin(lt * 30) * (k < 1 ? 1.5 : 0)})`}>
        <Re x={40} y={210} w={290} h={120} f="#4f86c6" sw={7} rx={40} /><Pa d="M60 240 L310 240" w={4} s="#fffaf0" />
        <text x={185} y={300} fontSize={52} fontWeight={800} fill="#fffaf0" textAnchor="middle" fontFamily='"Noto Kufi Arabic", sans-serif'>ماء</text>
        <Re x={330} y={250} w={92} h={84} f="#2e8b57" sw={7} rx={12} /><Re x={350} y={264} w={50} h={34} f="#cfe9f6" sw={5} rx={6} />
        {[100, 360].map((wx, i) => <g key={i} transform={`translate(${wx} 346)`}><El x={0} y={0} rx={34} ry={34} f="#222" w={6} /><El x={0} y={0} rx={12} ry={12} f="#c9c9c9" w={4} /><Pa d={`M0 0 L${22 * Math.cos(lt * 9)} ${22 * Math.sin(lt * 9)}`} w={4} s="#c9c9c9" /></g>)}
        <Pa d="M40 300 Q10 330 20 372" w={7} s="#333" />
      </g>
      {flow && <Pa d={`M${tx + 20} 372 Q${tx - 10} 384 ${tx - 40} 380`} w={0} />}
      <A a={mini('t1', {char: 'boy-big', x: 470, y: 404, s: .66, flip: true, mode: 'wave', expr: 'happy'})} t={t} lt={lt} />
      <A a={mini('t2', {char: 'girl', x: 550, y: 404, s: .62, flip: true, mode: 'wave', expr: 'happy'})} t={t} lt={lt} />
      {[0, 1].map((i) => <g key={i} transform={`translate(${430 + i * 90} 380)`}><Re x={0} y={0} w={32} h={38} f="#f2c14e" sw={5} rx={5} /><Re x={8} y={-8} w={16} h={10} f="#c89b2c" sw={4} rx={3} /></g>)}
    </g>
  );
};

const Buy: React.FC<{t: number; lt: number}> = ({t, lt}) => {
  const k = Math.min(1, lt / 1.1), cx = 150 + k * 300, cy = 235 - 70 * Math.sin(Math.PI * k);
  return (
    <g>
      <Re x={0} y={0} w={BW} h={BH} f="#f7e3c4" sw={0} /><Ground f="#d9b98a" />
      <Pa d="M70 70 L530 70 L500 140 L100 140Z" f="#d94a3c" w={7} />
      {[0, 1, 2, 3, 4].map((i) => <Pa key={i} d={`M${100 + i * 80} 70 L${112 + i * 76} 140 L${150 + i * 76} 140 L${140 + i * 80} 70Z`} f="#fffaf0" w={0} />)}
      <Pa d="M70 70 L530 70 L500 140 L100 140Z" w={7} />
      <Re x={310} y={300} w={230} h={30} f="#8a5a34" sw={6} /><Re x={330} y={330} w={22} h={74} f="#8a5a34" sw={5} /><Re x={500} y={330} w={22} h={74} f="#8a5a34" sw={5} />
      <A a={mini('b1', {char: 'father', x: 110, y: 404, s: .76, mode: 'point', expr: 'happy'})} t={t} lt={lt} />
      <A a={mini('b2', {char: 'uncle', x: 440, y: 304, s: .62, flip: true, mode: 'wave', expr: 'smile', mod: {cloth: '#5aa469'}})} t={t} lt={lt} />
      <g><El x={cx} y={cy} rx={20} ry={20} f="#f2c14e" w={5} /><text x={cx} y={cy + 8} fontSize={22} fontWeight={800} fill={INK} textAnchor="middle">$</text></g>
    </g>
  );
};

export const Sheep: React.FC<{x: number; y: number; s?: number; bob?: number}> = ({x, y, s = 1, bob = 0}) => (
  <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
    <Pa d="M-34 40 L-34 86 M-8 44 L-8 90 M26 44 L26 90 M52 40 L52 86" w={8} />
    {[[-40, 0, 40], [-8, -18, 46], [26, -16, 46], [58, 2, 38], [10, 14, 44], [-22, 18, 38]].map(([cx, cy, r], i) => <El key={i} x={cx} y={cy} rx={r} ry={r * .85} f="#fffdf5" w={6} />)}
    <El x={110} y={4} rx={30} ry={26} f="#3a3330" w={6} /><El x={96} y={-16} rx={10} ry={16} f="#3a3330" w={5} />
  </g>
);

const SheepScene: React.FC<{t: number; lt: number}> = ({t, lt}) => (
  <g>
    <Re x={0} y={0} w={BW} h={BH} f="#bfe0f0" sw={0} /><Ground f="#a9cf8a" y={350} />
    <Pa d="M0 350 Q150 300 300 346 Q450 300 600 350" f="#92c277" w={5} />
    <Sheep x={360} y={300} s={.95} bob={2 * Math.sin(lt * 5)} />
    <Pa d="M436 322 Q400 340 210 306" w={4} s="#8a5a34" />
    <A a={mini('s1', {char: 'father', x: 170, y: 404, s: .8, mode: 'point', expr: 'happy'})} t={t} lt={lt} />
  </g>
);

const Gov: React.FC<{lt: number}> = ({lt}) => (
  <g>
    <Re x={0} y={0} w={BW} h={BH} f="#b9d4f0" sw={0} /><Ground f="#d8cdb4" y={380} />
    <Pa d="M120 160 L300 80 L480 160Z" f="#f3e9d0" w={7} /><El x={300} y={132} rx={20} ry={20} f="#f2c14e" w={5} />
    <Re x={100} y={160} w={400} h={30} f="#e6d9b8" sw={6} />
    {[0, 1, 2, 3, 4, 5].map((i) => <Re key={i} x={118 + i * 68} y={190} w={34} h={150} f="#fffaf0" sw={6} />)}
    <Re x={90} y={340} w={420} h={22} f="#e6d9b8" sw={6} /><Re x={70} y={362} w={460} h={22} f="#d6c9a6" sw={6} />
    <text x={530} y={120 - 4 * Math.abs(Math.sin(lt * 4))} fontSize={84} fontWeight={800} fill="#d0382d" textAnchor="middle" stroke={INK} strokeWidth={5} paintOrder="stroke" fontFamily='"Noto Kufi Arabic", sans-serif'>؟</text>
  </g>
);

export const GOV_SCENES: {from: number; to: number; id: string}[] = [
  {from: 3.28, to: 4.2, id: 'box'}, {from: 4.2, to: 5.08, id: 'food'}, {from: 5.08, to: 6.76, id: 'cloth'}, {from: 6.76, to: 8.44, id: 'clinic'},
  {from: 8.44, to: 10.72, id: 'well'}, {from: 10.72, to: 13.06, id: 'truck'}, {from: 13.06, to: 14.8, id: 'buy'}, {from: 14.8, to: 16.56, id: 'sheep'}, {from: 16.56, to: 20.4, id: 'gov'},
];

/** the whole thought bubble: tail circles toward the head (hx,hy), pop-in scale, hard cut out */
export const ThoughtBubble: React.FC<{t: number; cx: number; cy: number; hx: number; hy: number}> = ({t, cx, cy, hx, hy}) => {
  const sc = GOV_SCENES.find((s) => t >= s.from && t < s.to);
  if (!sc) return null;
  const lt = t - sc.from, open = t - GOV_SCENES[0].from, pop = Math.min(1, open / .16), k = 1 - Math.pow(1 - pop, 3), scale = .55 + .45 * k;
  const body = sc.id === 'box' ? <Box lt={lt} /> : sc.id === 'food' ? <Food t={t} lt={lt} /> : sc.id === 'cloth' ? <Cloth t={t} lt={lt} /> : sc.id === 'clinic' ? <Clinic t={t} lt={lt} />
    : sc.id === 'well' ? <Well t={t} lt={lt} /> : sc.id === 'truck' ? <Truck t={t} lt={lt} /> : sc.id === 'buy' ? <Buy t={t} lt={lt} /> : sc.id === 'sheep' ? <SheepScene t={t} lt={lt} /> : <Gov lt={lt} />;
  const tail = [0, 1, 2].map((i) => ({x: hx + (cx - hx) * (.2 + .27 * i), y: hy + (cy + BH / 2 - hy) * (.2 + .27 * i), r: 12 + i * 9}));
  return (
    <g>
      {tail.map((c, i) => <El key={i} x={c.x} y={c.y} rx={c.r * k} ry={c.r * k} f="#fffaf0" w={6} />)}
      <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-BW / 2} ${-BH / 2})`}>
        <defs><clipPath id="gov-bubble-clip"><rect x={0} y={0} width={BW} height={BH} rx={70} /></clipPath></defs>
        <rect x={-8} y={-8} width={BW + 16} height={BH + 16} rx={78} fill="#fffaf0" stroke={INK} strokeWidth={8} />
        <g clipPath="url(#gov-bubble-clip)">{body}</g>
        <rect x={0} y={0} width={BW} height={BH} rx={70} fill="none" stroke={INK} strokeWidth={6} />
      </g>
    </g>
  );
};
