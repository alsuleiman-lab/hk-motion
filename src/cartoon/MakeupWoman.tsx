// شخصية جديدة بأسلوب «عائلة أبو خط»: المرأة المتبرجة (المتكلمة وحدها). تستعمل عظام rig.ts نفسها (poseAt / chain)
// ورأساً بحجم رؤوس المكتبة نفسه، وتضيف الشعر المموّج والمكياج والفستان والهاتف. لا تعدّل المكتبة الأصلية.
import {poseAt, speechAt, chain, ease, palette, type Motion, type SpeechInterval, type V} from '../../cartoon_projects/family_stick/rig';

export type WomanMood = 'smug' | 'worried' | 'sad';
export const WOMAN = {
  hair: '#1f1a22', hairHi: '#4b3f55', dress: '#c9253d', dressDark: '#8f1428', lip: '#d4163c', shadow: '#7d4fb0',
  blush: '#f08aa3', skin: '#fff3df', earring: '#e8b830', phone: '#2a2d36', screen: '#0f1218',
};
const f = (n: number) => Math.round(n * 1000) / 1000;
const ink = palette.ink;
const path = (d: string, fill = 'none', w = 3.4, stroke = ink) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ellipse = (x: number, y: number, rx: number, ry: number, fill: string, w = 3.4, op = 1) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${w ? ink : 'none'}" stroke-width="${w}" opacity="${op}"/>`;
const mix = (a: number, b: number, u: number) => a + (b - a) * u;
function limb(a: V, b: V, c: V, w = 3.5) {
  const bf = {x: mix(b.x, a.x, .26), y: mix(b.y, a.y, .26)}, af = {x: mix(b.x, c.x, .26), y: mix(b.y, c.y, .26)};
  return path(`M${f(a.x)} ${f(a.y)} L${f(bf.x)} ${f(bf.y)} Q${f(b.x)} ${f(b.y)} ${f(af.x)} ${f(af.y)} L${f(c.x)} ${f(c.y)}`, 'none', w);
}

/** وضع حمل الهاتف: اليد اليمنى أمام الصدر (حل مرفق سفلي ثابت) وتنزل اليسرى وتستقر. */
export function phonePose(t: number, m: Motion, speech: readonly SpeechInterval[], hold: number) {
  const p = poseAt(t, m, speech), u = ease(hold);
  const target = {x: mix(p.wrists[1].x, 70, u), y: mix(p.wrists[1].y, -214, u)};
  const arm = chain(p.shoulders[1], target, 56, 57, 1);
  p.elbows[1] = arm.joint; p.wrists[1] = arm.end;
  return p;
}

export function makeupWomanMarkup(t: number, m: Motion = 'talk', o: {
  speech?: readonly SpeechInterval[]; mood?: WomanMood; flip?: boolean; phone?: number; mouthOpen?: number; height?: number; bones?: boolean; poseT?: number; tears?: number;
} = {}) {
  const speech = o.speech ?? [], mood = o.mood ?? 'smug', H = o.height ?? 1.02;
  const phoneHold = o.phone ?? 0;
  const pt = o.poseT ?? t;
  const p = phoneHold > 0 ? phonePose(pt, m, speech, phoneHold) : poseAt(pt, m, speech);
  const sp = speechAt(t, speech);
  const mouthOpen = o.mouthOpen ?? sp.mouthOpen;
  const sitting = m === 'sit' || m === 'sitTalk';
  let s = '';
  if (sitting) s += path('M-47 -57 L59 -57 L59 -49 L-47 -49Z', '#b89979') + path('M-37 -49 L-37 0 M49 -49 L49 0');
  // legs + heels
  for (let j = 0; j < 2; j++) s += limb(p.hips[j], p.knees[j], p.ankles[j]) + `<g transform="translate(${f(p.ankles[j].x)} ${f(p.ankles[j].y)})">${ellipse(j ? 8 : -8, 3, 21, 8, ink, 0)}</g>`;
  // back hair (long, wavy, to the shoulders)
  const hy = p.dy;
  let back = path(`M-50 -300 Q-62 -340 -2 -346 Q60 -340 50 -300 L58 -214 Q50 -196 34 -204 L30 -262 L-30 -262 L-34 -204 Q-50 -196 -58 -214Z`, WOMAN.hair, 2.6);
  // body: red fitted dress to above the knees, pink-lined collar
  const dress = path(`M-25 ${-228 + hy} Q0 ${-240 + hy} 25 ${-228 + hy} L40 ${-150 + hy} L52 ${-104 + hy * .5} Q0 ${-88 + hy * .5} -52 ${-104 + hy * .5} L-40 ${-150 + hy}Z`, WOMAN.dress, 3.4)
    + path(`M-18 ${-226 + hy} Q0 ${-210 + hy} 18 ${-226 + hy}`, 'none', 2.6, WOMAN.dressDark)
    + path(`M-37 ${-146 + hy} Q0 ${-136 + hy} 37 ${-146 + hy}`, 'none', 2.2, WOMAN.dressDark);
  // arms (bare, thin lines like the library) and hands
  let arms = '';
  for (let j = 0; j < 2; j++) arms += limb(p.shoulders[j], p.elbows[j], p.wrists[j], 3.5);
  const hands = [0, 1].map((j) => {
    const w = p.wrists[j], e = p.elbows[j], a = Math.atan2(w.y - e.y, w.x - e.x) * 180 / Math.PI;
    const open = j === 1 && (m === 'talk' || m === 'sitTalk') && phoneHold < .5;
    const palm = open ? 'M-4 -5 L5 -8 L7 -19 Q10 -22 12 -18 L11 -6 L16 -20 Q20 -21 20 -17 L18 -4 L25 -14 Q29 -14 28 -10 L22 0 L30 -4 Q34 -3 30 2 L19 13 Q6 19 -4 6Z' : 'M-4 -7 Q7 -14 15 -6 Q23 2 15 9 Q4 15 -4 6Z';
    // red nails
    return `<g transform="translate(${f(w.x)} ${f(w.y)}) rotate(${f(a)}) scale(.66)">${path(palm, ink, 1.5)}${open ? '' : ''}</g>`;
  }).join('');
  // phone in the right hand while holding
  let phone = '';
  if (phoneHold > 0) {
    const w = p.wrists[1];
    phone = `<g transform="translate(${f(w.x + 6)} ${f(w.y - 22)}) rotate(-8)" opacity="${Math.min(1, phoneHold * 3)}">${path('M-17 -30 L17 -30 L17 30 L-17 30Z', WOMAN.phone, 3)}<rect x="-13" y="-25" width="26" height="46" rx="2" fill="#27e0ff" opacity=".9"/><circle cx="0" cy="25" r="2" fill="#aaa"/></g>`;
  }
  // head
  let h = back;
  h += ellipse(0, -290, 44, 44, WOMAN.skin);
  // earrings
  h += ellipse(-45, -274, 5, 9, WOMAN.earring, 2) + ellipse(45, -274, 5, 9, WOMAN.earring, 2);
  // fringe (side-parted) + hair
  h += path('M-44 -300 Q-52 -342 -4 -340 Q46 -340 44 -300 Q34 -318 14 -326 Q-8 -330 -44 -300Z', WOMAN.hair, 2.4);
  h += path('M-30 -334 Q-10 -339 10 -336', 'none', 2, WOMAN.hairHi);
  // makeup: eyeshadow, blush, lashes
  h += ellipse(-17, -302, 12, 7, WOMAN.shadow, 0, .85) + ellipse(17, -302, 12, 7, WOMAN.shadow, 0, .85);
  h += ellipse(-27, -272, 9, 5, WOMAN.blush, 0, .7) + ellipse(27, -272, 9, 5, WOMAN.blush, 0, .7);
  const dot = (x: number) => ellipse(x, -293, 3.8, 5, ink, 0);
  h += dot(-17) + dot(17);
  // البكاء: خطّان لامعان على الخدّين وقطرات تنزل من العينين وتتلاشى
  if ((o.tears ?? 0) > 0) {
    for (const [k, x] of [[0, -19], [1, 19]] as const) {
      h += path(`M${x} -287 Q${x + (k ? 3 : -3)} -272 ${x + (k ? 2 : -2)} -258`, 'none', 4.2, '#9fdcff');
      for (let n = 0; n < 2; n++) {
        const ph = ((t * 0.9 + n * 0.5 + k * 0.23) % 1);
        const y = -286 + ph * 34;
        h += `<path d="M${x + (k ? 2 : -2) * ph} ${f(y)} q-4.5 -7 0 -12 q4.5 5 0 12Z" fill="#cfeeff" stroke="${ink}" stroke-width="1.4" opacity="${f(1 - Math.max(0, ph - 0.55) * 2.2)}"/>`;
      }
    }
  }
  h += path('M-26 -296 L-31 -301 M-23 -299 L-26 -306 M-19 -300 L-19 -307 M26 -296 L31 -301 M23 -299 L26 -306 M19 -300 L19 -307', 'none', 2.2);
  const brow = mood === 'smug' ? 'M-27 -314 Q-17 -320 -8 -314 M8 -316 Q18 -324 27 -314' : mood === 'sad' ? 'M-26 -307 Q-17 -313 -9 -321 M9 -321 Q17 -313 26 -307' : 'M-26 -309 Q-17 -318 -8 -312 M8 -312 Q17 -318 26 -309';
  h += path(brow, 'none', 2.6);
  h += path('M24 -265 L24.1 -265', 'none', 3.2); // beauty mark
  // lips
  const gap = 15 * Math.max(0, Math.min(1, mouthOpen));
  if (mouthOpen < .035) {
    h += mood === 'sad' ? path('M-14 -262 Q0 -270 14 -262 Q0 -266 -14 -262Z', WOMAN.lip, 2) : path('M-17 -266 Q-8 -273 0 -268 Q8 -273 17 -266 Q0 -253 -17 -266Z', WOMAN.lip, 2);
  } else {
    h += path(`M-17 -268 Q-8 -275 0 -270 Q8 -275 17 -268 Q15 ${f(-267 + gap)} 0 ${f(-266 + gap)} Q-15 ${f(-267 + gap)} -17 -268Z`, ink, 2)
      + path(`M-17 -268 Q-8 -275 0 -270 Q8 -275 17 -268`, 'none', 3.2, WOMAN.lip)
      + path(`M-14 ${f(-266 + gap)} Q0 ${f(-262 + gap)} 14 ${f(-266 + gap)}`, 'none', 3.2, WOMAN.lip);
  }
  s += `<g transform="translate(0 ${f(hy)})">${''}</g>`;
  // draw order: back hair is inside head group so it sits behind the head; body first
  s += dress + arms + hands + phone;
  s += `<g transform="translate(0 ${f(hy)}) rotate(${f(p.angle)} 0 -239)">${h}</g>`;
  if (o.bones) for (let j = 0; j < 2; j++) for (const v of [p.shoulders[j], p.elbows[j], p.wrists[j], p.hips[j], p.knees[j], p.ankles[j]]) s += ellipse(v.x, v.y, 4, 4, '#ffffff', 1.5);
  return `<g transform="scale(${(o.flip ? -1 : 1) * H} ${H}) translate(${f(p.rootX)} 0)">${s}</g>`;
}
