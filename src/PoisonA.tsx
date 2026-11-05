import React from "react";
import { BRAND, RED, alpha } from "./brand";
import { A, Cross, Drop, Lead, Lipid, Mol, Panel, Pill, Rbc, Scissors, Spark, Tick, Tx, cl, eio, lerp, ln, pr, sec, useShow, useTime, wob } from "./PoisonKit";

/* ───────── 01 · الخلية: كيس بغشاء ───────── */
export const P01_FRAMES = sec(14);
export const Poison01Cell: React.FC = () => {
  const t = useTime();
  const cx = 480, cy = 500, R = 190;
  const beads = Array.from({ length: 44 }, (_, i) => i);
  const gapAng = -40 * Math.PI / 180, gx = cx + R * Math.cos(gapAng), gy = cy + R * Math.sin(gapAng);
  const cut = ln(t, 10.4, 11.2);
  const hb = [[-90, -60], [20, -100], [-40, 20], [80, -10], [-100, 70], [40, 90], [0, -30]];
  return (
    <Panel t={t} title="خلية الدم: كيس بغشاء" sub="قبل أن نفهم السمّ" dy={50}>
      <circle cx={cx} cy={cy} r={R} fill={alpha(BRAND.mark, 0.78)} />
      <ellipse cx={cx} cy={cy} rx="92" ry="64" fill={alpha(BRAND.navyDeep, 0.28)} />
      {beads.map((i) => {
        const a = (i / beads.length) * Math.PI * 2, bx = cx + R * Math.cos(a), by = cy + R * Math.sin(a);
        const isGap = Math.abs(Math.atan2(Math.sin(a - gapAng), Math.cos(a - gapAng))) < 0.24;
        const o = pr(t, 0.2 + i * 0.02, 0.4) * (isGap ? 1 - cut : 1);
        return (
          <g key={i} opacity={o} transform={`translate(${bx} ${by}) rotate(${(a * 180) / Math.PI + 90}) translate(0 ${isGap ? cut * 40 : 0})`}>
            <circle r="9" fill={BRAND.card} /><path d="M-3 8 q-2 12 0 22 M3 8 q2 12 0 22" stroke={BRAND.light} strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      {hb.map(([dx, dy], i) => {
        const leak = i < 3 ? eio(ln(t, 11 + i * 0.5, 13.4 + i * 0.3)) : 0;
        const bx = cx + dx + wob(t, i, 7), by = cy + dy + wob(t, i + 4, 6);
        const x = lerp(bx, gx + 70 + i * 14, leak), y = lerp(by, gy - 60 - i * 26, leak);
        return (
          <g key={i} opacity={pr(t, 1 + i * 0.12, 0.5) * (1 - 0.55 * ln(t, 12.6, 13.8) * (i < 3 ? 1 : 0))}>
            <circle cx={x} cy={y} r="20" fill={BRAND.accent} stroke={BRAND.card} strokeWidth="3" />
            {[0, 1, 2, 3].map((k) => <circle key={k} cx={x + Math.cos(k * 1.57 + 0.8) * 9} cy={y + Math.sin(k * 1.57 + 0.8) * 9} r="3.6" fill={BRAND.card} />)}
          </g>
        );
      })}
      {/* oxygen leaving to the body */}
      {[0, 1, 2, 3].map((i) => {
        const u = ln(t, 6.2 + i * 0.35, 8.6 + i * 0.35);
        return <circle key={i} cx={cx + 20 + u * 360} cy={cy - 20 + i * 24} r="8" fill={BRAND.light} opacity={u > 0 && u < 1 ? 1 - Math.pow(u, 4) : 0} />;
      })}
      <A t={t} at={6.2} until={9}><g><line x1={cx + 120} y1={cy + 150} x2={cx + 330} y2={cy + 150} stroke={BRAND.light} strokeWidth="5" markerEnd="url(#arr)" /><polygon points={`${cx + 330},${cy + 138} ${cx + 354},${cy + 150} ${cx + 330},${cy + 162}`} fill={BRAND.light} /></g></A>
      <Lead t={t} at={2} x1={760} y1={330} x2={cx + R * 0.74} y2={cy - R * 0.72} />
      <Pill t={t} at={2} x={790} y={300} text="غشاء مرن" />
      <Lead t={t} at={4} x1={190} y1={730} x2={cx - 70} y2={cy + 60} />
      <Pill t={t} at={4} x={190} y={760} text="هيموغلوبين" />
      <Pill t={t} at={6.2} until={9} x={cx + 150} y={cy + 215} text="الأكسجين إلى أنحاء الجسم" s={26} />
      <Pill t={t} at={8.2} until={10.6} x={cx} y={790} text="كيس محكم يحفظ ما بداخله" s={32} fill={BRAND.accentDeep} />
      <g opacity={pr(t, 8.4, 0.4) * (1 - pr(t, 10, 0.3))}><rect x={cx - 18} y={832} width="36" height="28" rx="5" fill={BRAND.card} /><path d={`M${cx - 10} 832 v-12 a10 10 0 0 1 20 0 v12`} fill="none" stroke={BRAND.card} strokeWidth="6" /></g>
      <A t={t} at={9.8} until={12.4} dy={0}>
        <Scissors x={lerp(gx + 190, gx + 8, eio(ln(t, 9.8, 10.4)))} y={lerp(gy - 190, gy - 6, eio(ln(t, 9.8, 10.4)))} s={0.8} rot={-50 + 180} th={cut < 1 ? 14 - 12 * Math.abs(Math.sin(t * 9)) : 14} />
      </A>
      <Pill t={t} at={11.4} x={cx - 40} y={790} text="يتسرّب ما بداخله" s={32} fill={RED} stroke={RED} />
    </Panel>
  );
};

/* ───────── 02 · ثلاثة أفعال مختلفة ───────── */
export const P02_FRAMES = sec(14);
export const Poison02Three: React.FC = () => {
  const t = useTime();
  const rows = [
    { y: 320, at: 1, n: "١", h: "تعطيل السمّ نفسه", s: "مثل تعطيل مقصّ كيميائي" },
    { y: 520, at: 4.6, n: "٢", h: "تعطيل طريق انتشار السمّ", s: "مثل إغلاق ممرّ بين الأنسجة" },
    { y: 720, at: 8.2, n: "٣", h: "حماية الخلية من الأضرار", s: "مثل إطفاء الشرارات بعد التخريب" },
  ];
  return (
    <Panel t={t} title="ثلاثة أفعال لا نخلطها" sub="التمر قد يؤثر في بعضها لا في جميعها" badges={[{ kind: "maybe", at: 11.4, text: "كل مركّب يخصّ طريقاً محدداً" }]}>
      {rows.map((r, i) => (
        <A key={i} t={t} at={r.at} dx={60} dy={0}>
          <rect x="60" y={r.y - 85} width="840" height="170" rx="30" fill={BRAND.navy} stroke={BRAND.accent} strokeWidth="3" />
          <circle cx="838" cy={r.y} r="36" fill={BRAND.accent} /><Tx x={838} y={r.y + 16} s={44} c={BRAND.onAccent}>{r.n}</Tx>
          <Tx x={520} y={r.y - 8} s={36}>{r.h}</Tx><Tx x={520} y={r.y + 38} s={27} c={BRAND.light} w={700}>{r.s}</Tx>
        </A>
      ))}
      {/* icon 1: scissors jammed by a compound */}
      <A t={t} at={1.4} dy={0}><Scissors x={190} y={300} s={0.5} rot={180} th={t < 3 ? 12 - 9 * Math.abs(Math.sin(t * 6)) : 12} /><g opacity={pr(t, 3, 0.3)}><Mol x={190} y={262} r={13} /></g></A>
      {/* icon 2: corridor with a closing gate */}
      <A t={t} at={5} dy={0}>
        <rect x="120" y="470" width="140" height="14" rx="4" fill={BRAND.light} /><rect x="120" y="556" width="140" height="14" rx="4" fill={BRAND.light} />
        {[0, 1, 2].map((k) => <circle key={k} cx={140 + ((t * 60 + k * 50) % 120)} cy="520" r="8" fill={RED} opacity={t < 6.4 ? 1 : 0.0} />)}
        <rect x="178" y="484" width="24" height={lerp(0, 72, eio(ln(t, 6.4, 7.2)))} fill={BRAND.green} />
      </A>
      {/* icon 3: sparks put out */}
      <A t={t} at={8.6} dy={0}>
        {[0, 1, 2, 3].map((k) => <Spark key={k} x={140 + k * 36} y={700 + (k % 2) * 22} s={1.1} o={1 - ln(t, 10 + k * 0.2, 10.8 + k * 0.2)} />)}
        <g opacity={pr(t, 9.8, 0.4)}><Drop x={190} y={742} s={0.7} c={BRAND.green} /></g>
      </A>
    </Panel>
  );
};

/* ───────── 03 · سمّ الحية ليس مادة واحدة ───────── */
export const P03_FRAMES = sec(13);
export const Poison03Snake: React.FC = () => {
  const t = useTime();
  const cards = [
    { x: 480, y: 410, at: 2.4, h: "يهاجم أغشية الخلايا", k: 0 },
    { x: 480, y: 550, at: 4.2, h: "يقطع دعائم الأوعية", k: 1 },
    { x: 480, y: 690, at: 6, h: "يعبث بتجلّط الدم", k: 2 },
    { x: 480, y: 830, at: 7.8, h: "يمنع أمر الحركة إلى العضلات", k: 3 },
  ];
  const glyph = (k: number, x: number, y: number) => k === 0 ? (<g><circle cx={x} cy={y} r="30" fill="none" stroke={BRAND.card} strokeWidth="6" strokeDasharray="14 7" /><Scissors x={x + 30} y={y - 30} s={0.34} rot={45} th={8} /></g>)
    : k === 1 ? (<g><rect x={x - 34} y={y - 6} width="68" height="14" fill={BRAND.light} /><rect x={x - 34} y={y + 16} width="22" height="16" fill={BRAND.light} /><rect x={x + 12} y={y + 16} width="22" height="16" fill={BRAND.light} /><path d={`M${x - 8} ${y - 24} L${x + 4} ${y + 2} L${x - 4} ${y + 14}`} stroke={RED} strokeWidth="5" fill="none" /></g>)
    : k === 2 ? (<g stroke={BRAND.light} strokeWidth="3.5"><line x1={x - 32} y1={y - 26} x2={x + 32} y2={y + 26} /><line x1={x + 32} y1={y - 26} x2={x - 32} y2={y + 26} /><line x1={x - 32} y1={y} x2={x + 32} y2={y} /><line x1={x} y1={y - 28} x2={x} y2={y + 28} /></g>)
    : (<g><circle cx={x - 26} cy={y} r="11" fill={BRAND.accent} /><rect x={x - 20} y={y - 4} width="30" height="8" fill={BRAND.accent} /><rect x={x + 14} y={y - 20} width="22" height="40" rx="6" fill={BRAND.light} /><Cross x={x + 3} y={y} r={14} /></g>);
  return (
    <Panel t={t} title="سمّ الحية ليس مادة واحدة" sub="بروتينات عدة، لكلٍّ هدفه" badges={[{ kind: "none", at: 10.4, text: "مادة واحدة لا تُغلق جميع طرق الضرر" }]}>
      <A t={t} at={0.4} dy={-30}><Drop x={480} y={292} s={1.3} /></A>
      <Pill t={t} at={1} x={700} y={290} text="سمّ الحية" s={30} />
      <rect x="476" y="320" width="8" height={lerp(0, 520, ln(t, 1.6, 8.6))} fill={alpha(RED, 0.8)} />
      {cards.map((c, i) => (
        <A key={i} t={t} at={c.at} dy={24}>
          <rect x={c.x - 400} y={c.y - 58} width="800" height="116" rx="26" fill={BRAND.navy} stroke={alpha(RED, 0.8)} strokeWidth="3" />
          {glyph(c.k, c.x + 320, c.y)}
          <Tx x={c.x - 20} y={c.y + 12} s={36}>{c.h}</Tx>
        </A>
      ))}
    </Panel>
  );
};

/* ───────── 04 · PLA2: المقصّ الذي يقطع الغشاء ───────── */
export const P04_FRAMES = sec(17);
const Membrane: React.FC<{ t: number; cutAt?: number[] }> = ({ t, cutAt = [] }) => {
  const xs = Array.from({ length: 13 }, (_, i) => 120 + i * 60);
  return (
    <g>
      {xs.map((x, i) => {
        const k = [5, 6, 7].indexOf(i), kb = i === 6 ? 3 : -1;
        const topCut = k >= 0 && cutAt[k] !== undefined ? ln(t, cutAt[k], cutAt[k] + 0.7) : 0;
        const botCut = kb >= 0 && cutAt[3] !== undefined ? ln(t, cutAt[3], cutAt[3] + 0.7) : 0;
        return (
          <g key={i}>
            <Lipid x={x} y={470} dir={1} o={1 - topCut} dy={topCut * 70} rot={topCut * (i - 6 + 0.3) * 40} />
            <Lipid x={x} y={566} dir={-1} o={1 - botCut} dy={-botCut * 10} rot={botCut * 30} />
          </g>
        );
      })}
    </g>
  );
};
export const Poison04PLA2: React.FC = () => {
  const t = useTime(), show = useShow();
  const A1 = 1 - ln(t, 7.3, 8.0), B1 = ln(t, 7.7, 8.4);
  const snip = (a: number, b: number) => (t > a && t < b ? 14 - 12 * Math.abs(Math.sin((t - a) * 7)) : 14);
  const blobs = [210, 330, 450, 570, 690, 810];
  const sx = lerp(840, 480, eio(ln(t, 1, 2.6))), sy = lerp(300, 352, eio(ln(t, 1, 2.6)));
  const sxB = lerp(840, 480, eio(ln(t, 8.6, 9.8))), syB = lerp(300, 352, eio(ln(t, 8.6, 9.8)));
  const shake = t > 12 ? wob(t, 3, 2.5, 6) : 0;
  return (
    <Panel t={t} title="مقصّ الغشاء: PLA2" sub="إنزيم في بعض سموم الحيات" badges={[{ kind: "maybe", at: 14.2, text: "ثبت على إنزيم معزول — لا بعد أكل التمر" }]}>
      <rect x="60" y="640" width="840" height="240" rx="40" fill={alpha(BRAND.mark, 0.22)} />
      <Tx x={480} y={862} s={26} c={BRAND.light} w={700}>داخل الخلية</Tx>
      <g opacity={A1}>
        {blobs.map((x, i) => {
          const leak = i === 2 || i === 3 ? eio(ln(t, 5.3 + (i - 2) * 0.5, 7.2)) : 0;
          return <circle key={i} cx={lerp(x, 480 + (i - 2.5) * 40, leak)} cy={lerp(740 + wob(t, i, 8), 330, leak)} r="22" fill={BRAND.accent} stroke={BRAND.card} strokeWidth="3" opacity={1 - 0.4 * leak} />;
        })}
        <Membrane t={t} cutAt={[3.2, 4.0, 4.8, 5.2]} />
        <Scissors x={sx} y={sy} s={0.9} rot={180} th={snip(3.0, 5.4)} />
        <Pill t={t} at={0.3} until={7.3} x={480} y={254} text="بدون مادة التمر" s={26} fill={alpha(RED, 0.3)} stroke={RED} />
        <Lead t={t} at={1.8} x1={730} y1={300} x2={sx + 40} y2={sy - 20} />
        <Pill t={t} at={1.8} until={7.3} x={760} y={300} text="فوسفوليباز A2" />
        <Pill t={t} at={3.6} until={7.3} x={230} y={400} text="يقطع دهون الغشاء" s={26} />
        {[0, 1, 2].map((k) => <Spark key={k} x={560 + k * 70} y={340 - (k % 2) * 40} s={1.2} o={pr(t, 6 + k * 0.3, 0.3) * (1 - ln(t, 7, 7.3))} />)}
        <Pill t={t} at={6.2} until={7.3} x={720} y={400} text="التهاب" s={26} fill={RED} stroke={RED} />
      </g>
      <g opacity={B1}>
        {blobs.map((x, i) => <circle key={i} cx={x} cy={740 + wob(t, i, 8)} r="22" fill={BRAND.accent} stroke={BRAND.card} strokeWidth="3" />)}
        <Membrane t={t} />
        <Scissors x={sxB + shake} y={syB} s={0.9} rot={180} th={t < 11.6 ? snip(9.6, 11.6) : 14} />
        <Pill t={t} at={8.2} x={480} y={254} text="مع مركّبات التمر" s={26} fill={alpha(BRAND.green, 0.3)} stroke={BRAND.green} />
        {[{ k: "q", n: "الكيرسيتين", x0: 130, at: 9.6 }, { k: "g", n: "حمض الغاليك", x0: 830, at: 10.3 }, { k: "c", n: "الكاتيشين", x0: 130, at: 11 }].filter((m) => show(m.k)).map((m) => {
          const i = ["q", "g", "c"].indexOf(m.k), u = eio(ln(t, m.at, m.at + 1.0)), tx = [412, 548, 480][i], ty = [300, 300, 268][i];
          return <g key={i} opacity={pr(t, m.at, 0.3)}><Mol x={lerp(m.x0, tx, u)} y={lerp(300 + i * 40, ty, u)} r={20} label={u < 0.99 ? m.n : undefined} ls={22} /></g>;
        })}
        <A t={t} at={12.2} dy={0}><Cross x={480} y={470} r={20} /></A>
        <Pill t={t} at={12.4} x={230} y={400} text="المقبض لم يعد يتحرك" s={26} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} />
        {show("all") && <Pill t={t} at={13.2} x={480} y={780} text="ثلاث مواد تُضيّق على وظيفة المقصّ" s={26} />}
      </g>
    </Panel>
  );
};

/* ───────── 05 · SVMP: المقصّ الذي يجرح الشعيرات ───────── */
export const P05_FRAMES = sec(18);
export const Poison05SVMP: React.FC = () => {
  const t = useTime(), show = useShow();
  const bricks = Array.from({ length: 11 }, (_, i) => 90 + i * 78);
  const A1 = 1 - ln(t, 8.8, 9.5), B1 = ln(t, 9.2, 9.9);
  const burst = ln(t, 6, 8);
  const flow = (k: number) => ((t * 90 + k * 160) % 900) + 30;
  const Vessel = (cracked: boolean) => (
    <g>
      <rect x="40" y="300" width="880" height="26" fill={BRAND.light} opacity=".85" />
      <rect x="40" y="474" width="880" height="26" fill={BRAND.light} opacity=".85" />
      <rect x="40" y="326" width="880" height="148" fill={alpha(BRAND.mark, 0.3)} />
      {[0, 1, 2, 3, 4].map((k) => <Rbc key={k} x={flow(k)} y={370 + (k % 3) * 34} s={0.9} />)}
      {bricks.map((x, i) => {
        const gone = cracked && i >= 4 && i <= 6 ? ln(t, 3.6 + (i - 4) * 0.7, 4.4 + (i - 4) * 0.7) : 0;
        return <rect key={i} x={x - 30} y={512 + gone * 40} width="60" height="46" rx="6" fill={BRAND.accentDeep} stroke={BRAND.card} strokeWidth="2.5" opacity={1 - gone} transform={`rotate(${gone * (i - 5) * 25} ${x} 535)`} />;
      })}
      {cracked && <rect x="400" y="474" width={lerp(0, 150, ln(t, 5.4, 6.2))} height="26" fill={BRAND.base2} />}
    </g>
  );
  return (
    <Panel t={t} title="مقصّ الشعيرات الدموية" sub="إنزيمات SVMP تحتاج الزنك" dy={40} badges={[{ kind: "maybe", at: 14.6, text: "حمَت الوعاء في حيوان — لا يعني منع النزف في الإنسان" }, { kind: "none", at: 16, text: "لم يثبت أن العجوة تنزع الزنك من المقصّ" }]}>
      <A t={t} at={0.4}><Pill t={t} at={0.4} until={3} x={480} y={250} text="الشعيرة: أنبوب يسير فيه الدم" s={26} /></A>
      <Lead t={t} at={1.2} until={3.2} x1={140} y1={640} x2={190} y2={560} />
      <Pill t={t} at={1.2} until={3.2} x={190} y={670} text="أساسات: كولاجين IV" s={26} />
      <g opacity={A1}>
        {Vessel(true)}
        {/* leaking blood after the wall gives way */}
        {[0, 1, 2].map((k) => <Rbc key={k} x={470 + k * 38 + wob(t, k, 5)} y={lerp(490, 650 + k * 40, burst)} s={0.85} o={burst} />)}
        <Scissors x={lerp(500, 500, 1)} y={lerp(800, 668, eio(ln(t, 1.6, 3.2)))} s={0.8} rot={0} th={t > 3.2 && t < 6.4 ? 14 - 12 * Math.abs(Math.sin((t - 3.2) * 6)) : 14} />
        <circle cx={500} cy={lerp(800, 668, eio(ln(t, 1.6, 3.2))) + 0} r="17" fill={BRAND.navyDeep} stroke={BRAND.card} strokeWidth="3" opacity={pr(t, 2, 0.4)} />
        <Tx x={500} y={lerp(800, 668, eio(ln(t, 1.6, 3.2))) + 8} s={19} c={BRAND.card}>Zn</Tx>
        <Pill t={t} at={3.4} until={8.8} x={730} y={730} text="يقطع الأساسات" s={26} />
        {show("bleed") && <Pill t={t} at={6.4} until={8.8} x={250} y={770} text="يضعف الوعاء وينشقّ" s={26} fill={RED} stroke={RED} />}
        {show("bleed") && <Pill t={t} at={7.2} until={8.8} x={250} y={830} text="نزيف إلى الأنسجة" s={26} fill={RED} stroke={RED} />}
      </g>
      <g opacity={B1}>
        {Vessel(false)}
        <Scissors x={500} y={668} s={0.8} rot={0} th={t < 12 ? 14 - 10 * Math.abs(Math.sin((t - 9.6) * 5)) * (1 - ln(t, 10.4, 11.6)) : 14} />
        {/* the zinc tag is pulled off the scissors by the catechin (he says: «تنزع الزنك من المقص») */}
        <g opacity={1 - 0.8 * ln(t, 11.6, 12.8)} transform={`translate(${eio(ln(t, 10.9, 12.2)) * 190} ${-eio(ln(t, 10.9, 12.2)) * 40})`}><circle cx={500} cy={668} r="17" fill={BRAND.navyDeep} stroke={BRAND.card} strokeWidth="3" /><Tx x={500} y={676} s={19} c={BRAND.card}>Zn</Tx></g>
        <Pill t={t} at={9.3} x={480} y={250} text="مع مركّبات التمر" fill={alpha(BRAND.green, 0.3)} stroke={BRAND.green} />
        {[{ k: "c", n: "الكاتيشين", x0: 130, at: 10 }, { k: "p", n: "مركّبات فينولية", x0: 830, at: 10.6 }].filter((m) => show(m.k)).map((m) => {
          const i = m.k === "c" ? 0 : 1, u = eio(ln(t, m.at, m.at + 1)); return <g key={i} opacity={pr(t, m.at, 0.3)}><Mol x={lerp(m.x0, 470 + i * 60, u)} y={lerp(700, 612 + i * 6, u)} r={22} label={u < 0.99 ? m.n : undefined} ls={22} /></g>;
        })}
        <Pill t={t} at={12.4} x={250} y={770} text="الأساسات سليمة" s={26} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} />
        {show("note") && <Pill t={t} at={13} x={250} y={830} text="تحدّ من نشاط بعض الإنزيمات" s={24} />}
      </g>
    </Panel>
  );
};

/* ───────── 06 · التجلّط ───────── */
export const P06_FRAMES = sec(17);
export const Poison06Clot: React.FC = () => {
  const t = useTime(), show = useShow();
  const A1 = 1 - ln(t, 8.6, 9.3), B1 = ln(t, 9, 9.7);
  const mesh = ln(t, 1.4, 3.2);
  const lines = [0, 1, 2, 3, 4, 5];
  /* the patch: 6 vertical threads over the hole + 3 cross threads; a cut thread breaks in the middle and its halves swing apart */
  const MeshG = (cutProg: number[]) => (
    <g stroke={BRAND.card} strokeWidth="5" strokeLinecap="round" opacity={mesh}>
      {lines.map((i) => { const x = 408 + i * 27, c = cutProg[i] ?? 0; return <g key={"v" + i}><line x1={x} y1={470} x2={x - c * 12} y2={lerp(540, 505, c)} /><line x1={x} y1={540} x2={x + c * 14} y2={lerp(470, 508, c) + 30 * c} opacity={1 - c * 0.5} /></g>; })}
      {[0, 1, 2].map((j) => <line key={"h" + j} x1={402} y1={490 + j * 22} x2={402 + 142} y2={490 + j * 22} opacity={1 - (cutProg[j + 1] ?? 0) * 0.85} />)}
    </g>
  );
  const Pipe = (
    <g>
      <rect x="60" y="540" width="840" height="26" fill={BRAND.light} /><rect x="60" y="700" width="840" height="26" fill={BRAND.light} />
      <rect x="60" y="566" width="840" height="134" fill={alpha(BRAND.mark, 0.35)} />
      <rect x="420" y="526" width="130" height="40" fill={BRAND.base3} />
    </g>
  );
  const cutsA = [0, 1, 2, 3, 4, 5].map((i) => ln(t, 4.6 + i * 0.45, 5.4 + i * 0.45));
  const spurt = (k: number, on: number) => <circle key={k} cx={480 + wob(t, k, 24)} cy={520 - ((t * 140 + k * 70) % 260)} r="9" fill={BRAND.mark} opacity={on * (1 - ((t * 140 + k * 70) % 260) / 300)} />;
  const slowCut = [ln(t, 12, 15), 0, 0, 0, 0, 0];
  return (
    <Panel t={t} title="السمّ الذي يعبث بالتجلّط" sub="رقعة الفيبرين تسدّ ثقب الأنبوب" dy={50} badges={[{ kind: "none", at: 15, text: "لا نعرف أن التمر المأكول يعطي التأثير نفسه" }]}>
      <g opacity={A1}>
        {Pipe}
        {[0, 1, 2, 3, 4].map((k) => spurt(k, ln(t, 0.2, 0.5) * (1 - mesh) + ln(t, 5.6, 6.2)))}
        {MeshG(cutsA)}
        <Pill t={t} at={1.6} until={4.4} x={720} y={440} text="شبكة الفيبرين = رقعة" s={26} />
        <Scissors x={lerp(850, 478, eio(ln(t, 3.4, 4.8)))} y={lerp(340, 392, eio(ln(t, 3.4, 4.8)))} s={0.8} rot={180} th={t > 4.6 && t < 8.4 ? 14 - 12 * Math.abs(Math.sin((t - 4.6) * 6)) : 14} />
        <Pill t={t} at={4.2} until={8.6} x={250} y={440} text="السمّ يقطع الخيوط" s={26} fill={RED} stroke={RED} />
        <Pill t={t} at={7} until={8.6} x={480} y={800} text="وقف النزيف يصبح أصعب" s={28} fill={RED} stroke={RED} />
        <Pill t={t} at={0.2} until={3} x={480} y={250} text="الجسم يضع رقعة على الثقب" s={26} />
      </g>
      <g opacity={B1}>
        {Pipe}
        {MeshG(slowCut)}
        <Scissors x={478} y={392} s={0.8} rot={180} th={t < 12 ? 14 - 10 * Math.abs(Math.sin((t - 9.6) * 5)) : 14 - 9 * Math.abs(Math.sin((t - 12) * 1.4))} />
        <Pill t={t} at={9.4} x={480} y={250} text="مع مركّبات التمر" fill={alpha(BRAND.green, 0.3)} stroke={BRAND.green} />
        {[{ n: "الكاتيشين", x0: 130, at: 10 }, { n: "الإبيكاتيشين", x0: 830, at: 10.6 }].map((m, i) => {
          const u = eio(ln(t, m.at, m.at + 1)); return <g key={i} opacity={pr(t, m.at, 0.3)}><Mol x={lerp(m.x0, 430 + i * 100, u)} y={lerp(640, 330, u)} r={22} label={u < 0.99 ? m.n : undefined} ls={22} /></g>;
        })}
        <Pill t={t} at={11.8} x={250} y={440} text="يُبطئ المقصّ" s={28} fill={BRAND.green} stroke={BRAND.green} color={BRAND.navyDeep} />
        <Pill t={t} at={13.2} x={720} y={440} text="الرقعة تصمد أطول" s={26} />
        {show("note") && <Pill t={t} at={14} x={480} y={800} text="دراسة على جزيئات معزولة" s={26} />}
      </g>
    </Panel>
  );
};

/* ───────── 07 · السمّ العصبي: سدّ باب الرسالة ───────── */
export const P07_FRAMES = sec(16);
export const Poison07Neuro: React.FC = () => {
  const t = useTime();
  const locks = [200, 400, 600, 800].map((x, i) => ({ x, i }));
  const KeyG = ({ x, y, rot = 0, o = 1 }: { x: number; y: number; rot?: number; o?: number }) => (
    <g opacity={o} transform={`translate(${x} ${y}) rotate(${rot})`}><circle r="11" fill={BRAND.accent} stroke={BRAND.card} strokeWidth="2.5" /><rect x="-3" y="9" width="6" height="26" fill={BRAND.accent} /><rect x="3" y="24" width="10" height="5" fill={BRAND.accent} /><rect x="3" y="14" width="8" height="5" fill={BRAND.accent} /></g>
  );
  const docked = ln(t, 5.2, 6.4), normal = t < 4.6 ? 1 : 0;
  const keyU = (i: number, period: number) => ((t * 0.55 + i * 0.27) % period) / period;
  const limp = ln(t, 6.8, 9);
  return (
    <Panel t={t} title="السمّ العصبي في بعض الكوبرا" sub="سدّ باب الرسالة إلى العضلة" badges={[{ kind: "none", at: 13.4, text: "لا يجوز نسبة تعطيل مباشر غير موثّق إلى التمر" }]}>
      <rect x="140" y="230" width="680" height="96" rx="48" fill={BRAND.navy} stroke={BRAND.light} strokeWidth="3" />
      <Tx x={480} y={290} s={28} c={BRAND.light}>العصب</Tx>
      <rect x="110" y={560} width="740" height="64" rx="12" fill={BRAND.blue} opacity={1 - 0.45 * limp} />
      <rect x="110" y={624} width="740" height={190 - limp * 40} rx="22" fill={alpha(BRAND.mark, 0.8 - 0.4 * limp)} />
      <Tx x={480} y={720} s={32} c={BRAND.card}>{limp > 0.5 ? "عضلة التنفس تتوقف" : "عضلة التنفس"}</Tx>
      {locks.map(({ x, i }) => (
        <g key={i}>
          <rect x={x - 28} y={528} width="56" height="38" rx="6" fill={docked > 0.5 ? RED : BRAND.light} opacity={docked > 0.5 ? 0.5 : 1} />
          <path d={`M${x - 14} 528 v-16 a14 14 0 0 1 28 0 v16`} fill="none" stroke={BRAND.light} strokeWidth="7" />
        </g>
      ))}
      {/* keys (acetylcholine) falling from the nerve */}
      {locks.map(({ x, i }) => {
        const u = keyU(i, 1), blocked = docked > 0.9;
        const yy = lerp(340, blocked ? 470 : 520, u), bounce = blocked && u > 0.8 ? (u - 0.8) * 5 : 0;
        return <KeyG key={i} x={x + bounce * 70 * (i % 2 ? 1 : -1)} y={yy - bounce * 40} rot={bounce * 220} o={pr(t, 0.6 + i * 0.2, 0.4) * (blocked && u > 0.92 ? 1 - ln(u, 0.92, 1) : 1)} />;
      })}
      <Pill t={t} at={1} until={4.6} x={480} y={860} text="الأستيل كولين: مفتاح يفتح القفل" s={28} />
      {normal > 0 && locks.map(({ x, i }) => <Tick key={i} x={x} y={500} r={10} o={pr(t, 3 + i * 0.2, 0.3)} />)}
      {/* three-finger toxins dock on the locks */}
      {locks.map(({ x, i }) => {
        const u = eio(ln(t, 4.6 + i * 0.25, 5.6 + i * 0.25));
        return (
          <g key={i} opacity={u} transform={`translate(${x} ${lerp(410, 505, u)})`}>
            {[-14, 0, 14].map((dx, k) => <rect key={k} x={dx - 6} y={-34 + Math.abs(dx) * 0.4} width="12" height="46" rx="6" fill={RED} stroke={BRAND.navyDeep} strokeWidth="2" />)}
            <rect x="-26" y="2" width="52" height="22" rx="10" fill={RED} stroke={BRAND.navyDeep} strokeWidth="2" />
          </g>
        );
      })}
      <Pill t={t} at={5} until={7} x={480} y={860} text="سموم الأصابع الثلاثة تحتل مكان المفتاح" s={28} fill={RED} stroke={RED} />
      <Pill t={t} at={7} until={9.6} x={480} y={860} text="الرسالة تصل ولا تُستقبل" s={28} fill={RED} stroke={RED} />
      {/* date compounds try and fail */}
      <Pill t={t} at={9.8} x={480} y={860} text="هل تعطّله مكوّنات التمر؟" s={28} until={12} />
      {[{ x: 330, n: "الغاليك" }, { x: 480, n: "الكيرسيتين" }, { x: 630, n: "غيرها" }].map((m, i) => {
        const u = ln(t, 10.4 + i * 0.5, 11.4 + i * 0.5), bounce = u > 0.7 ? (u - 0.7) / 0.3 : 0;
        return <g key={i} opacity={pr(t, 10.4 + i * 0.5, 0.3)}><Mol x={m.x + bounce * (i - 1) * 90} y={lerp(350, 480, Math.min(u / 0.7, 1)) - bounce * 70} r={20} label={m.n} ls={20} /></g>;
      })}
      <Pill t={t} at={12.2} x={480} y={860} text="لم يثبت أنها تمنع سدّ المستقبل" s={28} fill={RED} stroke={RED} />
    </Panel>
  );
};
export const _unused = [cl, Spark];
