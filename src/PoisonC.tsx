import React from "react";
import { BRAND, RED, alpha } from "./brand";
import { A, Mol, Panel, Pill, Tick, Tx, cl, lerp, ln, pr, sec, useTime } from "./PoisonKit";

/* ───────── 18 · ما الذي في التمر؟ ───────── */
export const P18_FRAMES = sec(15);
export const Poison18Compounds: React.FC = () => {
  const t = useTime();
  const items = [
    { n: "حمض الغاليك", d: ["قد يرتبط ببعض بروتينات", "السمّ ويغيّر شكلها"] },
    { n: "الكيرسيتين", d: ["يقلّل نشاط", "بعض إنزيمات PLA2"] },
    { n: "الكاتيشين", d: ["قد يضعف بعض", "إنزيمات السمّ"] },
    { n: "الروتين والكلوروجينيك", d: ["يؤثران في بعض", "مسارات الالتهاب"] },
    { n: "البكتين", d: ["قد يربط بعض أيونات", "المعادن في ظروف معينة"] },
    { n: "السيلينيوم", d: ["يدخل في منظومة", "دفاع الخلية"] },
  ];
  return (
    <Panel t={t} title="ماذا في التمر يستحق المقارنة؟" sub="مواد تكرّرت في الروابط السابقة">
      {items.map((it, i) => {
        const x = i % 2 === 0 ? 700 : 250, y = 330 + Math.floor(i / 2) * 170;
        return (
          <A key={i} t={t} at={1 + i * 1.5} dy={20}>
            <rect x={x - 210} y={y - 72} width="420" height="144" rx="26" fill={BRAND.navy} stroke={BRAND.green} strokeWidth="3" />
            <Mol x={x + 150} y={y - 8} r={30} />
            <Tx x={x - 30} y={y - 12} s={it.n.length > 14 ? 25 : 30}>{it.n}</Tx>
            <Tx x={x - 30} y={y + 24} s={21} c={BRAND.light} w={700}>{it.d[0]}</Tx><Tx x={x - 30} y={y + 52} s={21} c={BRAND.light} w={700}>{it.d[1]}</Tx>
          </A>
        );
      })}
      <A t={t} at={10.4} dy={20}>
        <rect x="60" y="800" width="840" height="110" rx="26" fill={BRAND.navyDeep} stroke={BRAND.light} strokeWidth="2.5" strokeDasharray="10 8" />
        <Tx x={480} y={846} s={26}>السكريات والبوتاسيوم والمغنيسيوم</Tx><Tx x={480} y={884} s={22} c={BRAND.light} w={700}>عناصر غذائية مهمة، لكنها ليست وحدها مثبتة لإبطال اللدغات</Tx>
      </A>
    </Panel>
  );
};

/* ───────── 19 · المقارنة الأولى: عجوة وصفاوي وسكري ───────── */
export const P19_FRAMES = sec(17);
const SERIES = [{ n: "العجوة", c: () => BRAND.accent }, { n: "الصفاوي", c: () => BRAND.green }, { n: "السكري", c: () => BRAND.light }];
export const Poison19Compare1: React.FC = () => {
  const t = useTime();
  const groups = [
    { h: "مجموع الفينولات", u: "mg GAE/g", v: [93.37, 101.66, 39.01], at: 1, call: "العجوة ×2.39 والصفاوي ×2.61 مقارنة بالسكري" },
    { h: "مجموع الفلافونويدات", u: "mg QE/g", v: [71.6, 78.63, 61.03], at: 5.2, call: "العجوة +17% والصفاوي +29% مقارنة بالسكري" },
    { h: "مجموع التانينات", u: "mg TAE/g", v: [37.61, 38.09, 40.56], at: 9.4, call: "السكري هو الأعلى في التانينات" },
  ];
  const sc = 5.0;
  return (
    <Panel t={t} title="العجوة والصفاوي والسكري" sub="بقياس واحد في دراسة واحدة" badges={[{ kind: "maybe", at: 13, text: "الأرقام لكل غرام مستخلص جافّ — لا لكل غرام تمر" }, { kind: "none", at: 14.3, text: "لا تقيس قدرة أي تمر على إبطال السموم" }]}>
      {groups.map((g, gi) => {
        const y0 = 240 + gi * 222;
        return (
          <g key={gi}>
            <A t={t} at={g.at} dy={10}><Tx x={900} y={y0} s={30} a="start">{g.h}</Tx><Tx x={560} y={y0} s={21} c={BRAND.light} w={700} a="start">{g.u} مستخلص جافّ</Tx></A>
            {g.v.map((v, i) => {
              const w = v * sc * pr(t, g.at + 0.3 + i * 0.35, 0.9), y = y0 + 14 + i * 40;
              return (
                <g key={i} opacity={pr(t, g.at + 0.2 + i * 0.35, 0.3)}>
                  <Tx x={900} y={y + 24} s={22} c={BRAND.light} w={700} a="start">{SERIES[i].n}</Tx>
                  <rect x={780 - w} y={y} width={w} height="32" rx="10" fill={SERIES[i].c()} />
                  <Tx x={780 - w - 8} y={y + 24} s={24} c={BRAND.card} a="start">{v.toFixed(2)}</Tx>
                </g>
              );
            })}
            <Pill t={t} at={g.at + 2.4} x={480} y={y0 + 164} text={g.call} s={22} fill={BRAND.navyDeep} stroke={BRAND.accent} />
          </g>
        );
      })}
    </Panel>
  );
};

/* ───────── 20 · المقارنة الثانية: مواد محددة في أربعة أصناف ───────── */
export const P20_FRAMES = sec(19);
export const Poison20Compare2: React.FC = () => {
  const t = useTime();
  const cult = ["العجوة", "البرني", "العنبرة", "الصفاوي"];
  const rows = [
    { n: "حمض الغاليك", v: [13.391, 15.144, 16.483, 11.677], s: ["13.391", "15.144", "16.483", "11.677"], call: "العجوة أعلى من الصفاوي ~15% وأقل من العنبرة ~19%" },
    { n: "الكاتيشين", v: [0.934, 2.342, 0.951, 1.502], s: ["0.934", "2.342", "0.951", "1.502"], call: "الكاتيشين في البرني ≈ 2.5 ضعف العجوة" },
    { n: "الكيرسيتين", v: [0.125, 1.245, 0.593, 0.685], s: ["0.125", "1.245", "0.593", "0.685"], call: "الكيرسيتين في البرني ≈ عشرة أضعاف العجوة" },
    { n: "الروتين", v: [0.958, 0.593, 0.846, 0.937], s: ["0.958", "0.593", "0.846", "0.937"], call: "الروتين في العجوة أعلى من البرني ~62%" },
    { n: "اللوتيولين", v: [0.491, 0.206, 0.052, 0.0548], s: ["0.491", "0.206", "0.052", "0.0548"], call: "اللوتيولين في العجوة ≈ 2.4 ضعف البرني" },
  ];
  const cx = [650, 490, 330, 170];
  return (
    <Panel t={t} title="أربعة أصناف من المدينة" sub="ملغ لكل 100 غرام — كما في جداول الدراسة" badges={[{ kind: "none", at: 15.4, text: "اختلاف الأرقام ليس دليل حماية سريرية" }]}>
      <A t={t} at={0.4} dy={-10}>{cult.map((c, i) => <Tx key={i} x={cx[i]} y={262} s={27}>{c}</Tx>)}</A>
      {rows.map((r, ri) => {
        const y = 340 + ri * 90, at = 1 + ri * 2.6, mx = Math.max(...r.v), top = r.v.indexOf(mx);
        const on = pr(t, at, 0.4);
        return (
          <g key={ri}>
            <A t={t} at={at} dy={0}><Tx x={920} y={y + 10} s={26} a="start">{r.n}</Tx></A>
            {r.v.map((v, i) => (
              <g key={i} opacity={on}>
                <rect x={cx[i] - 76} y={y - 34} width="152" height="68" rx="14" fill={alpha(BRAND.accent, 0.14 + 0.62 * (v / mx) * pr(t, at + 0.2 + i * 0.12, 0.5))} stroke={i === top && t > at + 1.1 ? BRAND.green : alpha(BRAND.light, 0.25)} strokeWidth={i === top && t > at + 1.1 ? 5 : 2} />
                <Tx x={cx[i]} y={y + 9} s={25}>{r.s[i]}</Tx>
              </g>
            ))}
          </g>
        );
      })}
      {rows.map((r, ri) => <Pill key={ri} t={t} at={1.8 + ri * 2.6} until={1 + (ri + 1) * 2.6 + (ri === 4 ? 4 : 0)} x={480} y={846} text={r.call} s={23} fill={BRAND.navyDeep} stroke={BRAND.green} />)}
    </Panel>
  );
};

/* ───────── 21 · المقارنة الثالثة: مراحل النضج ───────── */
export const P21_FRAMES = sec(15);
export const Poison21Ripen: React.FC = () => {
  const t = useTime();
  const slide = ln(t, 1, 3.6);
  const cards = [
    { n: "العجوة", x: 730, win: true },
    { n: "البرني", x: 480, win: false },
    { n: "الخلاص", x: 230, win: false },
  ];
  return (
    <Panel t={t} title="هل العجوة وحدها؟" sub="عجوة وبرني وخلاص عبر مراحل النضج" badges={[{ kind: "none", at: 12, text: "لا تُقارن عجوة الخلال بتمر ناضج كأن الظروف واحدة" }]}>
      <A t={t} at={0.4} dy={0}>
        <rect x="120" y="290" width="720" height="14" rx="7" fill={BRAND.light} opacity=".5" />
        {["الخلال", "…", "ناضج"].map((s, i) => <g key={i}><circle cx={780 - i * 300} cy="297" r="17" fill={BRAND.navy} stroke={BRAND.card} strokeWidth="4" /><Tx x={780 - i * 300} y={352} s={24} c={BRAND.light}>{s}</Tx></g>)}
        <circle cx={lerp(780, 480, slide)} cy="297" r="12" fill={BRAND.accent} />
      </A>
      <Pill t={t} at={0.8} x={480} y={232} text="مرحلة النضج تغيّر التركيب" s={26} />
      {cards.map((c, i) => (
        <A key={i} t={t} at={4 + i * 1.1} dy={24}>
          <rect x={c.x - 110} y="410" width="220" height="330" rx="26" fill={BRAND.navy} stroke={c.win ? BRAND.green : alpha(BRAND.light, 0.4)} strokeWidth={c.win ? 5 : 3} />
          <Tx x={c.x} y={458} s={32}>{c.n}</Tx>
          <Tx x={c.x} y={496} s={21} c={BRAND.light} w={700}>في طور الخلال</Tx>
          <Tx x={c.x} y={560} s={24} c={BRAND.light}>فينولات</Tx>
          <Tx x={c.x} y={610} s={26} c={c.win ? BRAND.green : BRAND.light}>{c.win ? "أعلى ↑" : "أقل"}</Tx>
          <Tx x={c.x} y={670} s={22} c={BRAND.light}>أنثوسيانيدينات</Tx>
          <Tx x={c.x} y={712} s={22} c={c.win ? BRAND.green : BRAND.light}>{c.win ? "بكمية معتبرة" : "أقل في المقارنة"}</Tx>
        </A>
      ))}
      <A t={t} at={8.4} dy={14}>
        <rect x="70" y="780" width="380" height="96" rx="22" fill={BRAND.navyDeep} stroke={BRAND.green} strokeWidth="3" /><Tx x={260} y={820} s={24}>تميّزت في الأصناف</Tx><Tx x={260} y={856} s={24}>والمراحل التي فُحصت</Tx>
        <Tx x={480} y={845} s={70} c={RED}>≠</Tx>
        <rect x="510" y="780" width="380" height="96" rx="22" fill={BRAND.navyDeep} stroke={RED} strokeWidth="3" /><Tx x={700} y={820} s={24}>وحدها بين كل</Tx><Tx x={700} y={856} s={24}>تمور العالم</Tx>
      </A>
    </Panel>
  );
};

/* ───────── 22 · الخلاصة: من المختبر إلى الإنسان ───────── */
export const P22_FRAMES = sec(18);
export const Poison22Chain: React.FC = () => {
  const t = useTime();
  const steps = [
    { y: 300, at: 0.8, ok: true, h: "المادة موجودة في التمر ومقيسة" },
    { y: 410, at: 3.4, ok: false, h: "هل تصل إلى الدم بعد الهضم والامتصاص؟" },
    { y: 520, at: 5.6, ok: false, h: "هل تبلغ موضع السمّ بتركيز كافٍ؟" },
    { y: 630, at: 7.8, ok: false, h: "هل تعطّل السمّ فعلاً داخل الجسم؟" },
  ];
  return (
    <Panel t={t} title="من المختبر إلى الإنسان" sub="ما الذي نحتاجه لنربط التمر بالحماية؟" badges={[{ kind: "none", at: 14.6, text: "لا يُستبدل مضادّ السمّ والإسعاف بالتمر" }]}>
      <rect x="826" y="330" width="6" height="340" fill={BRAND.light} opacity=".3" />
      <rect x="826" y="330" width="6" height={cl(ln(t, 1.4, 3)) * 80 + 0} fill={BRAND.green} />
      {steps.map((s, i) => (
        <A key={i} t={t} at={s.at} dx={40} dy={0}>
          <rect x="60" y={s.y - 42} width="720" height="84" rx="24" fill={BRAND.navy} stroke={s.ok ? BRAND.green : alpha(BRAND.light, 0.5)} strokeWidth="3.5" strokeDasharray={s.ok ? undefined : "10 8"} />
          <Tx x={420} y={s.y + 11} s={27}>{s.h}</Tx>
          <circle cx="829" cy={s.y} r="30" fill={s.ok ? BRAND.green : BRAND.base3} stroke={s.ok ? BRAND.green : BRAND.light} strokeWidth="4" strokeDasharray={s.ok ? undefined : "8 6"} />
          {s.ok ? <Tick x={829} y={s.y} r={14} c={BRAND.navyDeep} /> : <Tx x={829} y={s.y + 13} s={36} c={BRAND.light}>؟</Tx>}
        </A>
      ))}
      <A t={t} at={9.6} dy={14}>
        <rect x="60" y="740" width="380" height="150" rx="24" fill={BRAND.navyDeep} stroke={BRAND.light} strokeWidth="3" />
        <Tx x={250} y={782} s={24}>مركّب معزول</Tx><Tx x={250} y={818} s={24}>أو مستخلص مركّز</Tx><Tx x={250} y={854} s={24}>أو براءة اختراع</Tx>
        <Tx x={480} y={832} s={74} c={RED}>≠</Tx>
        <rect x="520" y="740" width="380" height="150" rx="24" fill={BRAND.navyDeep} stroke={RED} strokeWidth="3" />
        <Tx x={710} y={796} s={26}>نصيحة طبية</Tx><Tx x={710} y={834} s={24}>بديلة عن مضادّ السمّ</Tx><Tx x={710} y={870} s={24}>أو الإسعاف</Tx>
      </A>
    </Panel>
  );
};
