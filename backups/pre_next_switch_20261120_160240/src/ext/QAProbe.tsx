import React, { useEffect, useState } from "react";
import { continueRender, delayRender, getInputProps, useCurrentFrame, useVideoConfig, getRemotionEnvironment } from "remotion";

/**
 * فحص التخطيط الآلي (فكرة من مهارة فيديو سينمائي خارجية، مكيّفة): يعمل فقط حين تُمرَّر خاصية الفحص `qa: true`
 * (أداة `tools/layout_probe.mjs`)، فيمرّ على كل عنصر يحمل `data-qa="اسم"` ويطبع أسطر `QA|إطار|رمز|عنصر|تفصيل`:
 *   OUT      العنصر خارج الإطار الآمن (الهامش `margin`)
 *   CLIP     محتواه أكبر من صندوقه والفائض مخفيّ (مقصوص)
 *   SPILL    نص يخرج من صندوقه
 *   OVERLAP  عنصران غير متداخلين بالنسب (لا أحدهما داخل الآخر) يتقاطعان
 * أضفه مرة واحدة آخر التركيبة: <QAProbe margin={40} />. ويوسَم بـ data-qa كل ما يُقرأ (الأسماء، الأرقام)؛ الزخرفة بلا وسم.
 */
export const QAProbe: React.FC<{ margin?: number }> = ({ margin = 40 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const on = Boolean(((getRemotionEnvironment().isPlayer ? {} : getInputProps()) as { qa?: boolean }).qa);
  const [handle] = useState(() => (on ? delayRender("qa-probe") : null));
  useEffect(() => {
    if (!on || handle === null) return;
    const t = setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-qa]")).filter((el) => {
        let o = 1;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || "1");
        return o > 0.9;
      });
      const log = (code: string, id: string, d: string) => console.log(`QA|${frame}|${code}|${id}|${d}`);
      const rects = els.map((el) => ({ el, id: el.dataset.qa || "?", r: el.getBoundingClientRect() }));
      for (const { el, id, r } of rects) {
        if (r.width === 0 && r.height === 0) continue;
        const wholly = r.right <= 0 || r.bottom <= 0 || r.left >= W || r.top >= H; // خارج الكاميرا كلياً: ليس في اللقطة أصلاً
        if (wholly) continue;
        if (r.left < margin - 1 || r.top < margin - 1 || r.right > W - margin + 1 || r.bottom > H - margin + 1)
          log("OUT", id, `l${r.left | 0} t${r.top | 0} r${r.right | 0} b${r.bottom | 0}`);
        const cs = getComputedStyle(el);
        if (cs.overflow !== "visible" && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2))
          log("CLIP", id, `scroll ${el.scrollWidth}x${el.scrollHeight} > box ${el.clientWidth}x${el.clientHeight}`);
        const range = document.createRange();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.textContent?.trim()) continue;
          // نص داخل حاوية overflow مخفية (أعمدة العدّاد الدوّارة مثلاً) يُقصّ عمداً: ليس انسكاباً
          let hidden = false;
          for (let p: HTMLElement | null = n.parentElement; p && p !== el; p = p.parentElement) if (getComputedStyle(p).overflow !== "visible") { hidden = true; break; }
          if (hidden) continue;
          range.selectNodeContents(n);
          const t2 = range.getBoundingClientRect();
          if (t2.left < r.left - 2 || t2.right > r.right + 2 || t2.top < r.top - 2 || t2.bottom > r.bottom + 2) {
            log("SPILL", id, `نص خارج صندوقه`);
            break;
          }
        }
      }
      for (let i = 0; i < rects.length; i++)
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
          const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
          if (w > 2 && h > 2) log("OVERLAP", `${a.id} × ${b.id}`, `${w | 0}x${h | 0}`);
        }
      console.log(`QA|${frame}|CHECKED|${els.length}|عنصراً`);
      continueRender(handle);
    }, 450);
    return () => clearTimeout(t);
  }, [on, handle, frame, margin, W, H]);
  return null;
};
