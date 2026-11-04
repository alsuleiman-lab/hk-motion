import React from "react";
import { BRAND, RED, alpha } from "./brand";
import { A, Cross, Drop, Lead, Mol, Panel, Pill, Scissors, Spark, Tick, Tx, cl, eio, lerp, ln, pr, sec, useTime, wob } from "./PoisonKit";

const Gear: React.FC<{ x: number; y: number; r?: number; rot?: number; c?: string }> = ({ x, y, r = 34, rot = 0, c = BRAND.light }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x={-r * 0.16} y={-r * 1.18} width={r * 0.32} height={r * 0.4} fill={c} transform={`rotate(${i * 45})`} />)}
    <circle r={r} fill={c} /><circle r={r * 0.4} fill={BRAND.navyDeep} />
  </g>
);
const Bulb: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <g>
    {Array.from({ length: 8 }, (_, i) => <line key={i} x1={x + Math.cos(i * 0.785) * 50} y1={y + Math.sin(i * 0.785) * 50} x2={x + Math.cos(i * 0.785) * (50 + 22 * k)} y2={y + Math.sin(i * 0.785) * (50 + 22 * k)} stroke={BRAND.card} strokeWidth="5" strokeLinecap="round" opacity={k} />)}
    <circle cx={x} cy={y} r="38" fill={alpha(BRAND.card, 0.15 + 0.85 * k)} stroke={BRAND.card} strokeWidth="4" />
    <rect x={x - 16} y={y + 36} width="32" height="22" rx="4" fill={BRAND.light} />
  </g>
);

/* ───────── 08 · قنوات الصوديوم: ذيفانات ألفا وبيتا ───────── */
export const P08_FRAMES = sec(18);
const trap = (s: number, a: number, b: number) => cl((s - a) / 0.15) * cl((b - s) / 0.15);
const gateOpen = (s: number) => Math.max(trap(s, 1, 1.8), trap(s, 3.1, 3.9), trap(s, 6.3, 9.7), ...Array.from({ length: 6 }, (_, k) => trap(s, 10.9 + k * 0.5, 11.2 + k * 0.5)));
export const Poison08Sodium: React.FC = () => {
  const t = useTime(), o = gateOpen(t);
  const pts: string[] = [];
  for (let s = 0; s <= Math.min(t, 15.6); s += 0.05) pts.push(`${80 + (s / 15.6) * 800},${790 - 100 * gateOpen(s)}`);
  const phase = t < 5.4 ? 0 : t < 10.4 ? 1 : t < 14 ? 2 : 3;
  const ions = Array.from({ length: 8 }, (_, i) => i);
  return (
    <Panel t={t} title="أبواب الكهرباء في العصب" sub="قنوات الصوديوم وذيفانات العقرب" badges={[{ kind: "none", at: 15.2, text: "التغذية بالمعادن شيء، وإبطال سمّ العقرب شيء آخر" }]}>
      <rect x="50" y="340" width="380" height="76" rx="12" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" /><rect x="530" y="340" width="380" height="76" rx="12" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" />
      <rect x="430" y={lerp(340, 280, o)} width="100" height="76" rx="10" fill={phase >= 1 && phase < 3 ? alpha(RED, 0.75) : BRAND.accent} stroke={BRAND.card} strokeWidth="3" />
      {phase >= 1 && phase < 3 && <g transform={`translate(480 ${lerp(340, 280, o) - 6})`}>{[-22, 0, 22].map((dx) => <path key={dx} d={`M${dx - 8} 0 L${dx} -26 L${dx + 8} 0 Z`} fill={RED} stroke={BRAND.card} strokeWidth="2" />)}</g>}
      <Tx x={150} y={392} s={24} c={BRAND.light} w={700}>غشاء العصب</Tx>
      {ions.map((i) => {
        const u = ((t * 0.9 + i * 0.125) % 1), through = o > 0.5;
        const yy = through ? lerp(250, 520, u) : lerp(250, 316 + (i % 3) * 6, Math.min(u * 2, 1));
        return <g key={i} opacity={pr(t, 0.5, 0.4)}><circle cx={through ? 480 + (i - 3.5) * 9 : 150 + i * 90} cy={yy} r="11" fill={BRAND.light} /><text x={through ? 480 + (i - 3.5) * 9 : 150 + i * 90} y={yy + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={BRAND.navyDeep}>+</text></g>;
      })}
      <Pill t={t} at={0.6} x={480} y={256} text="أيونات الصوديوم" s={24} />
      <polyline points={pts.join(" ")} fill="none" stroke={phase >= 1 ? RED : BRAND.green} strokeWidth="6" strokeLinejoin="round" />
      <line x1="80" y1="790" x2="880" y2="790" stroke={BRAND.light} strokeWidth="2" opacity=".5" />
      <Tx x={480} y={830} s={22} c={BRAND.light} w={700}>الإشارة الكهربائية عبر الزمن</Tx>
      <Pill t={t} at={0.8} until={5.4} x={480} y={510} text="يفتح لحظة قصيرة ثم يتوقف" s={28} />
      <Pill t={t} at={5.8} until={10.4} x={480} y={510} text="ألفا: تؤخّر توقف القناة بعد فتحها" s={28} fill={RED} stroke={RED} />
      <Pill t={t} at={10.5} until={14} x={480} y={510} text="بيتا: تجعلها تنفتح بسهولة أكبر" s={28} fill={RED} stroke={RED} />
      <A t={t} at={12} until={14} dy={0}><g transform={`translate(790 650) rotate(${Math.sin(t * 18) * 12})`}><path d="M-34 24 Q-34 -34 0 -34 Q34 -34 34 24 Z" fill={BRAND.card} /><rect x="-40" y="24" width="80" height="10" rx="5" fill={BRAND.card} /><circle cy="46" r="8" fill={BRAND.card} /></g><Tx x={790} y={725} s={22} c={BRAND.light}>جرس لا يكفّ</Tx></A>
      <A t={t} at={14.2} dy={10}>
        <Mol x={250} y={560} r={30} c={BRAND.accent} label="مغنيسيوم" /><Mol x={390} y={560} r={30} c={BRAND.accent} label="بوتاسيوم" />
        <Tx x={480} y={575} s={64} c={RED}>≠</Tx>
        <g transform="translate(600 548)">{[-18, 0, 18].map((dx) => <path key={dx} d={`M${dx - 8} 14 L${dx} -14 L${dx + 8} 14 Z`} fill={RED} />)}</g><Tx x={640} y={620} s={24}>إزاحة الذيفان</Tx>
      </A>
    </Panel>
  );
};

/* ───────── 09 · الهيالورونيداز: يفتح الطريق للسمّ ───────── */
export const P09_FRAMES = sec(18);
export const Poison09Hyal: React.FC = () => {
  const t = useTime();
  const A1 = 1 - ln(t, 9.4, 10), B1 = ln(t, 9.8, 10.4);
  const cols = [150, 320, 490, 660], rows = [300, 410, 520];
  const Wall = (dissolve: (cx: number, cy: number) => number) => (
    <g>
      {rows.flatMap((ry, r) => cols.map((cx, c) => {
        const d = dissolve(cx + 75, ry + 45);
        return <rect key={`${r}${c}`} x={cx + (c < 2 ? -d * 9 : d * 9)} y={ry + (r < 1 ? -d * 7 : d * 7)} width="150" height="90" rx="16" fill={BRAND.accentDeep} stroke={BRAND.card} strokeWidth="3" />;
      }))}
      {cols.slice(0, 3).flatMap((cx, c) => rows.map((ry, r) => { const d = dissolve(cx + 160, ry + 45); return <rect key={`v${r}${c}`} x={cx + 150} y={ry + 8} width="20" height="74" fill={BRAND.blue} opacity={0.65 * (1 - d)} />; }))}
      {rows.slice(0, 2).flatMap((ry, r) => cols.map((cx, c) => { const d = dissolve(cx + 75, ry + 100); return <rect key={`h${r}${c}`} x={cx + 8} y={ry + 90} width="134" height="20" fill={BRAND.blue} opacity={0.65 * (1 - d)} />; }))}
    </g>
  );
  const ex = lerp(150, 490, eio(ln(t, 3, 7))), ey = lerp(250, 455, eio(ln(t, 3, 7)));
  const dissA = (x: number, y: number) => cl(1 - Math.hypot(x - ex, y - ey) / 190) * ln(t, 3.6, 7);
  return (
    <Panel t={t} title="إنزيم يفتح الطريق للسمّ" sub="الهيالورونيداز في بعض العقارب" badges={[{ kind: "maybe", at: 15, text: "إنزيم معزول من سمّ عقرب — الآلية في الإنسان غير مثبتة" }]}>
      <g opacity={A1}>
        {Wall(dissA)}
        <Pill t={t} at={0.5} until={3.2} x={480} y={230} text="حمض الهيالورونيك = الملاط بين الحجارة" s={24} />
        <g transform={`translate(${ex} ${ey})`} opacity={pr(t, 3, 0.4)}>
          <path d="M0 0 L58 -34 A68 68 0 1 0 58 34 Z" fill={RED} stroke={BRAND.navyDeep} strokeWidth="4" transform={`scale(.72) rotate(${Math.sin(t * 8) * 8})`} />
        </g>
        <Pill t={t} at={3.2} until={9.4} x={760} y={230} text="الهيالورونيداز" s={26} fill={RED} stroke={RED} />
        {[0, 1, 2, 3, 4].map((k) => { const u = ln(t, 6.6 + k * 0.3, 9.2 + k * 0.3); return <circle key={k} cx={420 + k * 40 + wob(t, k, 4)} cy={lerp(250, 780, u)} r="9" fill={RED} opacity={u > 0 && u < 1 ? 1 : 0} />; })}
        <Pill t={t} at={7.2} until={9.4} x={480} y={830} text="يسهّل حركة مكوّنات السمّ في النسيج" s={26} fill={RED} stroke={RED} />
      </g>
      <g opacity={B1}>
        {Wall((x: number, y: number) => cl(1 - Math.hypot(x - 490, y - 455) / 190) * 0.12)}
        <Pill t={t} at={9.8} x={480} y={230} text="مع الفلافونويدات" fill={alpha(BRAND.green, 0.3)} stroke={BRAND.green} s={26} />
        <g transform="translate(490 455)">
          <path d="M0 0 L58 -34 A68 68 0 1 0 58 34 Z" fill={RED} stroke={BRAND.navyDeep} strokeWidth="4" transform={`scale(.72) rotate(${Math.sin(t * 3) * 3})`} opacity=".55" />
        </g>
        {[{ n: "الكيرسيتين", x0: 140, at: 10.6, tx: 440 }, { n: "الروتين", x0: 820, at: 11.2, tx: 520 }].map((m, i) => {
          const u = eio(ln(t, m.at, m.at + 1)); return <g key={i} opacity={pr(t, m.at, 0.3)}><Mol x={lerp(m.x0, m.tx, u)} y={lerp(700, 452 + i * 6, u)} r={22} label={u < 0.99 ? m.n : undefined} ls={22} /></g>;
        })}
        <Pill t={t} at={12.6} x={480} y={830} text="تقلّل نشاط الإنزيم" s={28} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} />
        <Pill t={t} at={13.6} x={480} y={770} text="الأرجح: ارتباط في موضع، لا غلاف حوله" s={24} until={15} />
      </g>
    </Panel>
  );
};

/* ───────── 10 · الالتهاب بعد اللسعة ───────── */
export const P10_FRAMES = sec(17);
export const Poison10Inflam: React.FC = () => {
  const t = useTime();
  const calm = ln(t, 9.6, 11.4);
  const vol = 1 - 0.72 * calm;
  const swell = (0.45 + 0.55 * ln(t, 1.5, 5)) * (1 - 0.5 * calm);
  const cells = Array.from({ length: 8 }, (_, i) => i);
  return (
    <Panel t={t} title="الالتهاب الذي يلي اللسعة" sub="الجهاز المناعي يرسل إشارات استغاثة" badges={[{ kind: "maybe", at: 13.4, text: "لوحظ في حيوانات: تخفيف ضرر مصاحب" }, { kind: "none", at: 14.8, text: "ليس برهاناً على إبطال السمّ العصبي نفسه" }]}>
      <ellipse cx="480" cy="640" rx="320" ry="140" fill={alpha(BRAND.mark, 0.28)} />
      <ellipse cx="480" cy="640" rx={90 + 130 * swell} ry={46 + 56 * swell} fill={alpha(RED, 0.4)} stroke={RED} strokeWidth="4" />
      <Pill t={t} at={1.6} until={9} x={480} y={640} text="احمرار وألم وتورّم" s={28} fill={RED} stroke={RED} />
      {/* siren */}
      <g transform="translate(480 380)">
        {[0, 1, 2].map((k) => <path key={k} d={`M${-70 - k * 36} -10 Q${-96 - k * 36} -50 ${-70 - k * 36} -90 M${70 + k * 36} -10 Q${96 + k * 36} -50 ${70 + k * 36} -90`} stroke={RED} strokeWidth="6" fill="none" strokeLinecap="round" opacity={vol * (0.55 + 0.45 * Math.sin(t * 10 - k))} />)}
        <path d="M-52 40 Q-52 -50 0 -50 Q52 -50 52 40 Z" fill={RED} stroke={BRAND.card} strokeWidth="4" /><rect x="-64" y="40" width="128" height="18" rx="8" fill={BRAND.light} />
      </g>
      <Pill t={t} at={0.6} x={480} y={500} text="إشارات استغاثة" s={26} />
      {cells.map((i) => {
        const u = ln(t, 2.6 + i * 0.18, 6.4 + i * 0.18) * (1 - 0.5 * calm * (i % 2)), a = (i / 8) * Math.PI * 2;
        return <g key={i} opacity={pr(t, 2.6, 0.4) * (u < 1 ? 1 : 0.85)}><circle cx={lerp(480 + Math.cos(a) * 330, 480 + Math.cos(a) * 80, u)} cy={lerp(640 + Math.sin(a) * 160, 640 + Math.sin(a) * 30, u)} r="17" fill={BRAND.card} /><circle cx={lerp(480 + Math.cos(a) * 330, 480 + Math.cos(a) * 80, u) + 4} cy={lerp(640 + Math.sin(a) * 160, 640 + Math.sin(a) * 30, u) - 3} r="7" fill={BRAND.blue} /></g>;
      })}
      <Pill t={t} at={3} until={8} x={190} y={780} text="خلايا الدفاع تتدفّق" s={24} />
      {/* volume knob */}
      <A t={t} at={8.6} dy={0}>
        <circle cx="140" cy="380" r="52" fill={BRAND.navy} stroke={BRAND.green} strokeWidth="6" /><line x1="140" y1="380" x2={140 + Math.sin(lerp(1.3, -1.1, calm)) * 38} y2={380 - Math.cos(lerp(1.3, -1.1, calm)) * 38} stroke={BRAND.card} strokeWidth="8" strokeLinecap="round" />
        <Tx x={140} y={470} s={22}>خفض الضجيج</Tx>
      </A>
      {[{ n: "الروتين", x0: 100, at: 9, y: 250 }, { n: "حمض الكلوروجينيك", x0: 260, at: 9.5, y: 250 }].map((m, i) => { const u = eio(ln(t, m.at, m.at + 0.9)); return <g key={i} opacity={pr(t, m.at, 0.3)}><Mol x={lerp(m.x0, 140 + (i ? 60 : -50), u)} y={lerp(m.y, 330, u)} r={18} label={u < 0.99 ? m.n : undefined} ls={20} /></g>; })}
      <A t={t} at={11.8} dy={0}>
        <rect x="680" y="320" width="60" height="46" rx="8" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" /><rect x="750" y="320" width="60" height="46" rx="8" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" />
        <path d="M735 316 L745 290 L755 316 Z" fill={RED} /><Tx x={745} y={402} s={22}>قطعة السمّ ما زالت ملتصقة</Tx>
      </A>
    </Panel>
  );
};

/* ───────── 11 · الزرنيخ: محطة الكهرباء داخل الخلية ───────── */
export const P11_FRAMES = sec(18);
export const Poison11Arsenic: React.FC = () => {
  const t = useTime();
  const stuck = ln(t, 6, 7), fake = ln(t, 8.2, 9.6);
  const spin = (t: number, k: number) => (t * 70 * (1 - 0.95 * stuck)) * k;
  const bright = 1 - 0.8 * ln(t, 7, 10);
  return (
    <Panel t={t} title="الزرنيخ: يعطّل محطة الكهرباء" sub="الميتوكوندريا داخل الخلية" badges={[{ kind: "none", at: 15.2, text: "لا دليل أن بكتين التمر يمسك الزرنيخ أو يصلح الإنزيم" }]}>
      <ellipse cx="480" cy="470" rx="290" ry="150" fill={alpha(BRAND.blue, 0.35)} stroke={BRAND.card} strokeWidth="5" />
      <path d="M270 470 Q330 380 390 470 T510 470 T630 470 T700 470" fill="none" stroke={BRAND.light} strokeWidth="5" opacity=".7" />
      <Gear x={360} y={430} r={34} rot={spin(t, 1)} /><Gear x={440} y={500} r={28} rot={-spin(t, 1.2)} /><Gear x={560} y={430} r={34} rot={spin(t, 1)} /><Gear x={620} y={510} r={26} rot={-spin(t, 1.2)} />
      <Pill t={t} at={0.6} until={5.8} x={480} y={248} text="مصانع صغيرة تولّد الطاقة" s={26} />
      <Pill t={t} at={1.4} until={5.8} x={480} y={680} text="آلات اسمها الإنزيمات" s={26} />
      <A t={t} at={1}><line x1="60" y1="470" x2="180" y2="470" stroke={BRAND.light} strokeWidth="6" /><polygon points="180,456 206,470 180,484" fill={BRAND.light} /><Tx x={100} y={440} s={24}>الغذاء</Tx></A>
      <A t={t} at={1.6}><line x1="760" y1="470" x2="800" y2="470" stroke={BRAND.light} strokeWidth="6" /></A>
      <Bulb x={850} y={470} k={bright} />
      {/* arsenic grabs a gear */}
      {stuck > 0 && <g transform={`translate(${lerp(300, 360, eio(stuck))} ${lerp(260, 400, eio(stuck))})`}><circle r="26" fill={RED} stroke={BRAND.navyDeep} strokeWidth="4" /><Tx x={0} y={9} s={22} c={BRAND.card}>As</Tx></g>}
      <Pill t={t} at={4.4} until={9.8} x={250} y={330} text="يمسك أجزاء حساسة" s={26} fill={RED} stroke={RED} />
      {/* counterfeit phosphate */}
      <A t={t} at={7.6} dy={0}>
        <rect x={470 - 26} y={lerp(280, 470, eio(fake)) - 26} width="52" height="52" rx="8" fill={RED} stroke={BRAND.card} strokeWidth="4" /><Tx x={470} y={lerp(280, 470, eio(fake)) + 10} s={26} c={BRAND.card}>As</Tx>
        <rect x={650} y={236} width="52" height="52" rx="8" fill={BRAND.green} /><Tx x={676} y={272} s={26} c={BRAND.navyDeep}>P</Tx>
      </A>
      <Pill t={t} at={8.2} until={11.4} x={480} y={680} text="قطعة مغشوشة تشبه الفوسفات" s={26} fill={RED} stroke={RED} />
      <Pill t={t} at={10} until={11.4} x={480} y={248} text="الطاقة تنطفئ" s={26} fill={RED} stroke={RED} />
      {/* dates */}
      <A t={t} at={11.8} dy={0}>
        <rect x="130" y="650" width="700" height="170" rx="30" fill={BRAND.navy} stroke={BRAND.green} strokeWidth="3" />
        <Mol x={250} y={705} r={24} label="فينولات" ls={22} /><Mol x={400} y={705} r={24} label="بكتين" ls={22} />
        <Tx x={620} y={700} s={26}>مقاومة تفاعلات مؤكسدة</Tx><Tx x={620} y={740} s={26}>وربط بعض أيونات المعادن</Tx>
        <Tx x={480} y={805} s={23} c={BRAND.light}>أشكال الزرنيخ مختلفة؛ بعضها لا يُجذب بالبكتين</Tx>
      </A>
      <A t={t} at={13.6} dy={0}><Pill t={t} at={13.6} x={480} y={870} text="ترياق للزرنيخ" s={34} fill={BRAND.navyDeep} stroke={RED} /><g stroke={RED} strokeWidth="9" strokeLinecap="round"><line x1="350" y1="870" x2="610" y2="870" /></g></A>
    </Panel>
  );
};

/* ───────── 12 · الرصاص والكادميوم والبكتين ───────── */
export const P12_FRAMES = sec(18);
export const Poison12Pectin: React.FC = () => {
  const t = useTime();
  const swap = ln(t, 1.6, 3);
  const ionPos = [{ x: 200, y: 520 }, { x: 330, y: 650 }, { x: 760, y: 560 }, { x: 640, y: 700 }, { x: 250, y: 740 }, { x: 800, y: 700 }];
  const hooks = [{ x: 420, y: 470 }, { x: 490, y: 520 }, { x: 560, y: 470 }, { x: 630, y: 520 }, { x: 350, y: 520 }, { x: 700, y: 470 }];
  const att = (i: number) => eio(ln(t, 5 + i * 0.5, 6.4 + i * 0.5));
  const A1 = 1 - ln(t, 3.6, 4.2);
  return (
    <Panel t={t} title="الرصاص والكادميوم والبكتين" sub="خطاطيف كيميائية تمسك أيونات المعادن" badges={[{ kind: "none", at: 14.6, text: "لم يثبت أن بكتين التمر يسحب الرصاص من الدم" }]}>
      <g opacity={A1}>
        <rect x="330" y="360" width="300" height="120" rx="20" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" />
        <Tx x={480} y={345} s={24} c={BRAND.light}>إنزيم له موضع لمعدن نافع</Tx>
        <circle cx={480} cy={420} r="30" fill={BRAND.green} opacity={1 - swap} /><circle cx={lerp(700, 480, eio(swap))} cy={420} r="30" fill={BRAND.gray} stroke={RED} strokeWidth="5" /><Tx x={lerp(700, 480, eio(swap))} y={430} s={22} c={BRAND.navyDeep}>Pb</Tx>
        <Pill t={t} at={1.6} x={480} y={560} text="الرصاص يزيح المعدن النافع" s={28} fill={RED} stroke={RED} />
      </g>
      <A t={t} at={3.8} dy={0}>
        <rect x="60" y="300" width="840" height="470" rx="40" fill={alpha(BRAND.blue, 0.14)} stroke={BRAND.blue} strokeWidth="3" strokeDasharray="10 8" />
        <Pill t={t} at={4} x={480} y={250} text="الرصاص والكادميوم في سائل" s={26} />
        <path d="M330 495 Q380 440 420 480 T520 500 T620 480 T720 495" fill="none" stroke={BRAND.green} strokeWidth="9" strokeLinecap="round" />
        {hooks.map((h, i) => <g key={i}><line x1={h.x} y1={h.y + 4} x2={h.x} y2={h.y + 26} stroke={BRAND.green} strokeWidth="5" /><circle cx={h.x} cy={h.y + 36} r="13" fill={BRAND.green} /><rect x={h.x - 7} y={h.y + 34} width="14" height="4" fill={BRAND.navyDeep} /></g>)}
        {ionPos.map((p, i) => { const k = att(i); return <g key={i}><circle cx={lerp(p.x + wob(t, i, 14), hooks[i].x, k)} cy={lerp(p.y + wob(t, i + 3, 12), hooks[i].y + 72, k)} r="19" fill={BRAND.gray} stroke={BRAND.card} strokeWidth="2.5" /><text x={lerp(p.x + wob(t, i, 14), hooks[i].x, k)} y={lerp(p.y + wob(t, i + 3, 12), hooks[i].y + 72, k) + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill={BRAND.navyDeep}>{i % 2 ? "Cd" : "Pb"}</text></g>; })}
        <Pill t={t} at={5} x={480} y={410} text="بكتين: مجموعات سالبة تجذب أيونات المعادن" s={24} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} until={9.6} />
      </A>
      <A t={t} at={9.8} dy={0}>
        <rect x="60" y="300" width="840" height="470" rx="40" fill={BRAND.base3} opacity=".96" />
        <rect x="90" y="360" width="360" height="190" rx="26" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" /><rect x="510" y="360" width="360" height="190" rx="26" fill={BRAND.navy} stroke={BRAND.green} strokeWidth="3" />
        <Tx x={270} y={420} s={28}>بكتين حمضي</Tx><Tx x={270} y={462} s={28}>معدّل مصنَّع</Tx><Tx x={270} y={515} s={22} c={BRAND.light}>ما درسته الدراسات</Tx>
        <Tx x={690} y={420} s={28}>بكتين التمر</Tx><Tx x={690} y={462} s={28}>الذي نأكله</Tx><Tx x={690} y={515} s={22} c={BRAND.light}>مادة وخصائص أخرى</Tx>
        <Tx x={480} y={475} s={80} c={RED}>≠</Tx>
        <Pill t={t} at={11.8} x={480} y={640} text="وفينولات التمر قد تحدّ من الضرر المؤكسد" s={24} />
        <Pill t={t} at={12.8} x={480} y={710} text="دون أن تنزع المعدن نفسه" s={24} />
      </A>
    </Panel>
  );
};

/* ───────── 13 · الزئبق والسيلينيوم ───────── */
export const P13_FRAMES = sec(16);
export const Poison13Mercury: React.FC = () => {
  const t = useTime();
  const hit = ln(t, 5.6, 6.8), dim = 1 - 0.65 * hit;
  const RobotG = (x: number, y: number, o: number) => (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect x="-48" y="-40" width="96" height="84" rx="20" fill={BRAND.navy} stroke={BRAND.card} strokeWidth="4" /><circle cy="2" r="22" fill={BRAND.green} stroke={BRAND.card} strokeWidth="3" /><Tx x={0} y={10} s={22} c={BRAND.navyDeep}>Se</Tx>
      <rect x="-30" y="-58" width="60" height="20" rx="8" fill={BRAND.light} />
    </g>
  );
  return (
    <Panel t={t} title="الزئبق: يفسد أجهزة الحماية" sub="طاقم صيانة داخل الخلية" badges={[{ kind: "none", at: 12.4, text: "لا دليل أن سيلينيوم العجوة يعكس تسمّم الزئبق" }]}>
      <line x1="60" y1="420" x2="900" y2="420" stroke={BRAND.light} strokeWidth="8" strokeDasharray="22 10" />
      <Tx x={150} y={395} s={24} c={BRAND.light}>جدار الخلية</Tx>
      {RobotG(480, 500, dim)}
      <Pill t={t} at={0.6} until={5.4} x={480} y={640} text="إنزيم يحتاج السيلينيوم" s={26} />
      {[0, 1, 2, 3].map((k) => { const u = ((t * 0.5 + k * 0.27) % 1); const hitNow = u > 0.55; const px = lerp(150 + k * 220, 480, ln(u, 0.2, 0.62)); const py = lerp(300, 500, ln(u, 0.2, 0.62)); return <Spark key={k} x={px + (hitNow && hit < 0.5 ? 0 : 0)} y={py} s={1} o={(hit < 0.4 ? (u < 0.62 ? 1 : 0) : (k < 2 ? 1 : 0.9))} />; })}
      <Pill t={t} at={1.6} until={5.4} x={250} y={300} text="مركّبات مؤكسدة ضارّة" s={24} fill={RED} stroke={RED} />
      <A t={t} at={5} dy={0}><g transform={`translate(${lerp(800, 520, eio(hit))} ${lerp(300, 470, eio(hit))})`}><circle r="28" fill={BRAND.gray} stroke={RED} strokeWidth="5" /><Tx x={0} y={9} s={24} c={BRAND.navyDeep}>Hg</Tx></g></A>
      <Pill t={t} at={6.2} x={480} y={640} text="الزئبق يرتبط بالسيلينيوم والكبريت" s={26} fill={RED} stroke={RED} />
      {[0, 1, 2].map((k) => <Spark key={k} x={300 + k * 180} y={380 - (k % 2) * 20} s={1.3} o={ln(t, 7 + k * 0.5, 8 + k * 0.5)} />)}
      <Pill t={t} at={8} x={480} y={720} text="تتراكم الأضرار وقد تتأذى الأعصاب" s={26} fill={RED} stroke={RED} />
      {/* dates: a supply of selenium for building the enzymes */}
      <A t={t} at={9.6} dy={12}>
        <Pill t={t} at={9.6} x={250} y={820} text="سيلينيوم" s={26} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} />
        <line x1="340" y1="820" x2="450" y2="820" stroke={BRAND.green} strokeWidth="6" /><polygon points="450,808 474,820 450,832" fill={BRAND.green} />
        <Pill t={t} at={9.9} x={640} y={820} text="مادة لبناء بروتينات الدفاع" s={26} />
        <Pill t={t} at={11} x={480} y={880} text="ليس غلافاً حول الزئبق" s={26} fill={BRAND.navyDeep} stroke={RED} />
      </A>
    </Panel>
  );
};

/* ───────── 14 · الأفلاتوكسين ───────── */
export const P14_FRAMES = sec(18);
export const Poison14Aflatoxin: React.FC = () => {
  const t = useTime();
  const conv = ln(t, 3, 4.4), land = ln(t, 5.6, 7), blot = ln(t, 6.8, 9.6);
  const lines = Array.from({ length: 6 }, (_, i) => i);
  const calm = ln(t, 12, 13.6);
  return (
    <Panel t={t} title="الأفلاتوكسين: سمّ فطري" sub="يعبث بكتاب تعليمات الخلية" badges={[{ kind: "none", at: 14.4, text: "لم يثبت أن التمر يمنع تكوّن الناتج السامّ أو التصاقه" }, { kind: "maybe", at: 15.8, text: "الوقاية الأهم: منع تناول الطعام الملوّث" }]}>
      <rect x="260" y="240" width="440" height="170" rx="60" fill={alpha(BRAND.mark, 0.65)} stroke={BRAND.card} strokeWidth="4" />
      <Tx x={480} y={300} s={30}>الكبد: معمل كيميائي</Tx>
      <A t={t} at={1} dy={-30}><g transform={`translate(${lerp(120, 330, ln(t, 1.2, 3))} ${lerp(260, 340, ln(t, 1.2, 3))})`} opacity={1 - conv}><polygon points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14" fill={RED} stroke={BRAND.card} strokeWidth="3" /><Tx x={0} y={9} s={20} c={BRAND.card}>B1</Tx></g></A>
      <Pill t={t} at={1.2} until={3.6} x={190} y={430} text="سمّ فطري AFB1" s={26} fill={RED} stroke={RED} />
      <g opacity={conv * (1 - land)} transform={`translate(${lerp(540, 480, land)} ${lerp(350, 560, land)}) scale(${1 + 0.2 * conv})`}><path d="M0 -34 L10 -12 L34 -10 L16 6 L22 30 L0 18 L-22 30 L-16 6 L-34 -10 L-10 -12 Z" fill={RED} stroke={BRAND.card} strokeWidth="3" /></g>
      <Pill t={t} at={4} until={7} x={760} y={350} text="يتحوّل إلى مادة أشدّ تفاعلاً" s={24} fill={RED} stroke={RED} />
      {/* DNA book */}
      <A t={t} at={4.6} dy={20}>
        <path d="M130 640 L480 610 L480 820 L130 840 Z" fill={BRAND.card} stroke={BRAND.light} strokeWidth="3" /><path d="M830 640 L480 610 L480 820 L830 840 Z" fill={BRAND.paper} stroke={BRAND.light} strokeWidth="3" />
        {lines.map((i) => <path key={i} d={`M170 ${670 + i * 26} Q320 ${662 + i * 26 + blot * Math.sin(i * 2) * 8} 450 ${666 + i * 26}`} fill="none" stroke={BRAND.ink} strokeWidth="4" strokeLinecap="round" opacity=".7" />)}
        {lines.map((i) => <path key={"r" + i} d={`M510 ${666 + i * 26} Q640 ${662 + i * 26 + blot * Math.cos(i * 3) * 8} 790 ${670 + i * 26}`} fill="none" stroke={BRAND.ink} strokeWidth="4" strokeLinecap="round" opacity=".7" />)}
        <ellipse cx="480" cy="720" rx={blot * 150} ry={blot * 80} fill={RED} opacity=".7" />
        <Tx x={480} y={595} s={26} c={BRAND.light}>الحمض النووي: كتاب التعليمات</Tx>
      </A>
      <Pill t={t} at={7.8} until={11.6} x={480} y={880} text="حبر ضارّ يشوّه الصفحات" s={26} fill={RED} stroke={RED} />
      <Pill t={t} at={9.6} until={11.6} x={210} y={500} text="من أسباب سرطان الكبد" s={24} />
      <A t={t} at={11.8} dy={0}>
        <Mol x={170} y={500} r={26} label="فينولات التمر" />
        {[0, 1, 2].map((k) => <Spark key={k} x={820 - k * 40} y={520 + k * 30} s={1.1} o={1 - calm} />)}
        <Pill t={t} at={12.4} x={700} y={470} text="تقلّل بعض الأكسدة" s={24} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} />
      </A>
    </Panel>
  );
};

/* ───────── 15 · الأوكراتوكسين والكلى ───────── */
export const P15_FRAMES = sec(15);
export const Poison15Ochra: React.FC = () => {
  const t = useTime();
  const dmg = ln(t, 3, 6.5), prot = ln(t, 9, 11);
  const cells = Array.from({ length: 16 }, (_, i) => ({ x: 330 + (i % 4) * 90, y: 520 + Math.floor(i / 4) * 80, i }));
  return (
    <Panel t={t} title="الأوكراتوكسين والكلى" sub="سمّ فطري قد يؤذي الأنسجة" badges={[{ kind: "maybe", at: 12, text: "حماية نسيجية محتملة لدى الجرذان" }, { kind: "none", at: 13.3, text: "لا إبطال كيميائي مباشر مثبت للسمّ" }]}>
      <Tx x={480} y={250} s={26}>الكلى: تنظّف الدم وتوازن الماء والأملاح</Tx>
      <g transform="translate(0 40)"><path d="M300 250 Q150 270 160 480 Q170 780 330 800 Q470 810 640 800 Q800 770 790 540 Q780 270 600 250 Q450 230 300 250 Z" fill={alpha(BRAND.mark, 0.35)} stroke={BRAND.card} strokeWidth="5" /></g>
      {cells.map((c) => {
        const bad = cl(dmg * (0.4 + ((c.i * 37) % 10) / 14)) * (1 - prot * 0.8);
        return <g key={c.i} transform={`translate(${c.x + wob(t, c.i, bad * 5, 4)} ${c.y + wob(t, c.i + 2, bad * 4, 4)})`}><circle r="30" fill={bad > 0.5 ? alpha(RED, 0.7) : BRAND.blue} stroke={BRAND.card} strokeWidth="3" /><circle r="9" fill={BRAND.card} opacity=".8" /></g>;
      })}
      {[0, 1, 2, 3, 4].map((k) => { const u = ln(t, 1 + k * 0.3, 3.6 + k * 0.3); return <circle key={k} cx={430 + k * 20} cy={lerp(230, 500, u)} r="10" fill={RED} opacity={u > 0 && u < 1 ? 1 : 0} />; })}
      <Pill t={t} at={1} until={7} x={760} y={400} text="الأوكراتوكسين A" s={26} fill={RED} stroke={RED} />
      <Pill t={t} at={4} until={8.4} x={200} y={440} text="اضطراب وأكسدة" s={26} fill={RED} stroke={RED} />
      {[0, 1, 2].map((k) => <Spark key={k} x={360 + k * 130} y={470} s={1.1} o={dmg * (1 - prot)} />)}
      <A t={t} at={8.6} dy={-20}><Drop x={480} y={345} s={1.2} c={BRAND.green} /><Pill t={t} at={8.8} x={480} y={452} text="مستخلص العجوة المائي" s={26} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} /></A>
      <Pill t={t} at={10.2} x={480} y={860} text="تفسير ممكن: مضادات أكسدة تساعد الخلايا" s={24} until={11.8} />
    </Panel>
  );
};

/* ───────── 16 · المبيدات الفوسفورية ───────── */
export const P16_FRAMES = sec(18);
export const Poison16Pesticide: React.FC = () => {
  const t = useTime();
  const jam = ln(t, 5.4, 6.4), pile = ln(t, 6.6, 10);
  const KeyG = ({ x, y, rot = 0, o = 1 }: { x: number; y: number; rot?: number; o?: number }) => <g opacity={o} transform={`translate(${x} ${y}) rotate(${rot})`}><circle r="10" fill={BRAND.accent} stroke={BRAND.card} strokeWidth="2.5" /><rect x="-3" y="8" width="6" height="22" fill={BRAND.accent} /></g>;
  const calm = ln(t, 12.4, 14);
  return (
    <Panel t={t} title="المبيدات الفوسفورية" sub="تعطيل زرّ إيقاف الإشارة العصبية" badges={[{ kind: "none", at: 14.6, text: "لا يُعتمد على التمر في تسمّم المبيدات — يلزم إسعاف" }]}>
      <rect x="140" y="230" width="680" height="84" rx="42" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" /><Tx x={480} y={285} s={26} c={BRAND.light}>العصب</Tx>
      <rect x="140" y="640" width="680" height="110" rx="24" fill={alpha(BRAND.mark, 0.7)} stroke={BRAND.card} strokeWidth="3" /><Tx x={480} y={705} s={28}>العضلة</Tx>
      {[0, 1, 2, 3, 4].map((k) => {
        const u = ((t * 0.5 + k * 0.2) % 1), stop = jam < 0.5 && u > 0.55;
        const yy = lerp(330, 620, u) ;
        return <g key={k} opacity={pr(t, 0.5, 0.4) * (jam < 0.5 ? (stop ? 1 - ln(u, 0.55, 0.75) : 1) : 0)}><KeyG x={260 + k * 110} y={yy} /></g>;
      })}
      {Array.from({ length: 12 }, (_, i) => <KeyG key={i} x={230 + (i % 6) * 100 + wob(t, i, 6)} y={430 + Math.floor(i / 6) * 70 + (i % 3) * 14 + wob(t, i + 5, 5)} rot={i * 40} o={cl(pile * 12 - i) * (1 - calm * 0)} />)}
      {/* the stop button (acetylcholinesterase) */}
      <g transform="translate(480 480)">
        <circle r="64" fill={BRAND.blue} stroke={BRAND.card} strokeWidth="5" opacity={jam > 0.5 ? 0.5 : 1} /><circle r="36" fill={BRAND.card} opacity=".9" /><rect x="-12" y="-12" width="24" height="24" rx="4" fill={BRAND.blue} />
        {jam > 0 && <g transform={`translate(${lerp(120, 0, eio(jam))} ${lerp(-80, -8, eio(jam))})`}><rect x="-40" y="-14" width="80" height="28" rx="8" fill={RED} stroke={BRAND.navyDeep} strokeWidth="3" /><rect x="-60" y="-6" width="24" height="12" fill={RED} /></g>}
      </g>
      <Pill t={t} at={0.8} until={5} x={480} y={410} text="الإنزيم يُزيل الرسالة بعد المهمة" s={24} />
      <Pill t={t} at={5.2} until={9.4} x={760} y={400} text="مبيد فوسفوري عضوي" s={26} fill={RED} stroke={RED} />
      <Pill t={t} at={7.2} until={11.6} x={480} y={590} text="التنبيه يستمرّ بلا توقف" s={26} fill={RED} stroke={RED} />
      <A t={t} at={9.4} until={12} dy={0}><Pill t={t} at={9.4} x={200} y={400} text="إفرازات وضرر في العضلات والتنفس" s={22} fill={RED} stroke={RED} /></A>
      {/* liver oxidative damage and the date extract */}
      <A t={t} at={11.4} dy={14}>
        <path d="M130 810 Q250 770 380 800 Q420 880 260 890 Q140 880 130 810 Z" fill={alpha(BRAND.mark, 0.8)} stroke={BRAND.card} strokeWidth="3" /><Tx x={255} y={850} s={24}>الكبد</Tx>
        {[0, 1, 2].map((k) => <Spark key={k} x={170 + k * 90} y={790 - (k % 2) * 14} s={0.9} o={1 - calm} />)}
        <Mol x={470} y={830} r={22} label="مستخلص التمر" ls={20} />
        <Pill t={t} at={12.6} x={720} y={820} text="يخفّف الضرر المؤكسد فقط" s={24} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} />
      </A>
    </Panel>
  );
};

/* ───────── 17 · حدود ما نعرفه: ثلاثة سموم بلا رابط ───────── */
export const P17_FRAMES = sec(15);
export const Poison17Limits: React.FC = () => {
  const t = useTime();
  const rows = [
    { y: 300, at: 0.8, h: "السيانيد", s: "يعطّل إنزيماً رئيسياً في استخدام الأكسجين" },
    { y: 500, at: 3.6, h: "السمّ الوشيقي (البوتولينوم)", s: "يقطع بروتينات إطلاق أمر الحركة فينشأ شلل" },
    { y: 700, at: 6.4, h: "الأكونيتين (سمّ نباتي)", s: "يغيّر قنوات الصوديوم في الأعصاب والقلب" },
  ];
  const glyph = (k: number, x: number, y: number) => k === 0 ? (<g><circle cx={x} cy={y} r="34" fill={BRAND.blue} /><circle cx={x} cy={y} r="14" fill={BRAND.card} /><Cross x={x} y={y} r={22} /></g>)
    : k === 1 ? (<g><path d={`M${x - 40} ${y} L${x + 40} ${y}`} stroke={BRAND.light} strokeWidth="8" strokeLinecap="round" strokeDasharray="12 8" /><Scissors x={x} y={y - 20} s={0.3} rot={180} th={6} /></g>)
    : (<g><rect x={x - 46} y={y - 6} width="38" height="26" rx="5" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" /><rect x={x + 8} y={y - 6} width="38" height="26" rx="5" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" /><path d={`M${x - 14} ${y - 12} L${x} ${y - 38} L${x + 14} ${y - 12} Z`} fill={RED} /></g>);
  return (
    <Panel t={t} title="سموم لا نجد لها رابطاً" sub="حدود ما نعرفه" badges={[{ kind: "none", at: 11.6, text: "لا يجوز وصف التمر لها بأنه ترياق" }]}>
      {rows.map((r, i) => (
        <g key={i}>
          <A t={t} at={r.at} dx={50} dy={0}>
            <rect x="60" y={r.y - 78} width="840" height="156" rx="28" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" />
            {glyph(i, 235, r.y)}
            <Tx x={560} y={r.y - 6} s={32}>{r.h}</Tx><Tx x={560} y={r.y + 40} s={24} c={BRAND.light} w={700}>{r.s}</Tx>
          </A>
          <A t={t} at={r.at + 1.6} dy={0}>
            <g transform={`translate(118 ${r.y}) rotate(-8)`}><rect x="-52" y="-26" width="104" height="52" rx="10" fill={alpha(RED, 0.92)} stroke={BRAND.card} strokeWidth="3" /><Tx x={0} y={10} s={26} c={BRAND.card}>لا رابط</Tx></g>
          </A>
        </g>
      ))}
      <Pill t={t} at={9.4} x={480} y={880} text="اختراع مقابل كيميائي لكل سمّ خطأ" s={26} fill={BRAND.navyDeep} stroke={RED} until={11.4} />
    </Panel>
  );
};
export const _unusedB = [Drop, Lead, Scissors, Tick];
