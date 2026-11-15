import React from 'react';

/** Flat-colour, thick-ink drawing helpers + an official's office for the Dodo films. World = 1080×1920 screen, extended sideways. */
export const INK = '#141414';
export const Pa: React.FC<{d: string; f?: string; w?: number; s?: string; o?: number}> = ({d, f = 'none', w = 6, s = INK, o = 1}) => <path d={d} fill={f} stroke={w ? s : 'none'} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" opacity={o} />;
export const Re: React.FC<{x: number; y: number; w: number; h: number; f: string; sw?: number; rx?: number}> = ({x, y, w, h, f, sw = 6, rx = 0}) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={f} stroke={sw ? INK : 'none'} strokeWidth={sw} />;
export const El: React.FC<{x: number; y: number; rx: number; ry: number; f: string; w?: number}> = ({x, y, rx, ry, f, w = 6}) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={f} stroke={w ? INK : 'none'} strokeWidth={w} />;

/** a government official's office: wall, window, banner, framed emblem, floor. Ground (feet) line ≈ y 1500. */
export const OfficeRoom: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs><linearGradient id="of-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe0c2" /><stop offset="1" stopColor="#dcc79e" /></linearGradient>
      <linearGradient id="of-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8ec9ea" /><stop offset="1" stopColor="#f4ecd2" /></linearGradient></defs>
    <Re x={-800} y={-700} w={2680} h={2150} f="url(#of-wall)" sw={0} />
    {/* tall window with city */}
    <Re x={30} y={330} w={300} h={560} f="url(#of-sky)" sw={8} />
    <Re x={70} y={650} w={50} h={240} f="#c98d6b" sw={4} /><Re x={140} y={600} w={70} h={290} f="#e3b88c" sw={4} /><Re x={230} y={690} w={60} h={200} f="#c98d6b" sw={4} />
    <El x={220 + 6 * Math.sin(t * .4)} y={430} rx={60} ry={22} f="#fffaf0" w={0} />
    <Pa d="M180 330 L180 890 M30 610 L330 610" w={8} />
    <Re x={14} y={890} w={332} h={34} f="#b4895c" sw={6} />
    {/* banner + emblem on the right wall */}
    <Pa d="M760 90 L760 560 M1010 90 L1010 560" w={0} />
    <Re x={720} y={250} w={290} h={420} f="#2f5d8a" sw={7} />
    <Pa d="M720 670 L865 600 L1010 670" f="#2f5d8a" w={7} />
    <El x={865} y={400} rx={74} ry={74} f="#f2c14e" w={7} />
    <Pa d="M865 350 L877 385 L915 385 L884 408 L896 444 L865 422 L834 444 L846 408 L815 385 L853 385Z" f="#fffaf0" w={5} />
    <Pa d="M720 250 L1010 250" w={10} s="#7a5524" /><El x={720} y={250} rx={14} ry={14} f="#f2c14e" w={5} /><El x={1010} y={250} rx={14} ry={14} f="#f2c14e" w={5} />
    {/* picture frame */}
    <Re x={470} y={300} w={190} h={150} f="#fffaf0" sw={7} /><Pa d="M490 430 L550 350 L590 400 L615 370 L645 430Z" f="#7fb069" w={5} /><El x={600} y={338} rx={16} ry={16} f="#f2c14e" w={4} />
    {/* chair back behind the desk */}
    <Re x={690} y={930} w={220} h={450} f="#5b3a29" sw={7} rx={40} /><Re x={716} y={960} w={168} h={400} f="#7a4f37" sw={0} rx={30} />
    {/* floor */}
    <Re x={-800} y={1380} w={2680} h={140} f="#b88a5a" sw={7} />
    <Re x={-800} y={1500} w={2680} h={520} f="#9a6b43" sw={7} />
    {[...Array(12)].map((_, i) => <Pa key={i} d={`M${-700 + i * 220} 1500 L${-760 + i * 270} 2000`} w={3} s="#7a5230" />)}
    <Re x={30} y={1565} w={620} h={9} f="#7a5230" sw={0} />
  </g>
);

/** the desk drawn in front of the official (covers his legs), with a nameplate, papers and a stamp */
export const OfficeDesk: React.FC<{x?: number; t?: number}> = ({x = 540}) => (
  <g>
    <Re x={x} y={1290} w={600} h={380} f="#8a5a34" sw={7} />
    <Re x={x + 24} y={1330} w={260} h={300} f="#a06c40" sw={5} rx={6} /><Re x={x + 316} y={1330} w={260} h={300} f="#a06c40" sw={5} rx={6} />
    <El x={x + 154} y={1480} rx={20} ry={9} f="#f2c14e" w={5} /><El x={x + 446} y={1480} rx={20} ry={9} f="#f2c14e" w={5} />
    <Re x={x - 26} y={1262} w={652} h={42} f="#6e4526" sw={7} rx={6} />
    {/* papers, stamp, nameplate */}
    <Pa d={`M${x + 70} 1262 L${x + 90} 1222 L${x + 200} 1222 L${x + 190} 1262Z`} f="#fffaf0" w={5} />
    <Pa d={`M${x + 210} 1262 L${x + 224} 1226 L${x + 320} 1226 L${x + 312} 1262Z`} f="#f4f1e4" w={5} />
    <Re x={x + 410} y={1196} w={60} h={34} f="#c0392b" sw={5} rx={6} /><Re x={x + 430} y={1170} w={20} h={30} f="#5b3a29" sw={5} rx={5} />
    <Re x={x + 250} y={1214} w={0} h={0} f="none" sw={0} />
    <Re x={x + 480} y={1222} w={100} h={40} f="#f2c14e" sw={5} rx={5} />
    <text x={x + 530} y={1252} fontSize={26} fontWeight={800} fill={INK} textAnchor="middle" fontFamily='"Noto Kufi Arabic", sans-serif'>مسؤول</text>
  </g>
);
