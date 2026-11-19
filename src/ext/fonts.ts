import React from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

/**
 * خطوط الموشن المستقل الفخمة واليدوية (أمر المستخدم 2026-11-19: «استخدم خطوط فخمة جداً… خطوط يدوية وخطوط فخمة»، والخطوط العادية ممنوعة هنا).
 * كلها ملفات محلية في public/fonts (لا تحميل من الإنترنت وقت الرندر). المجانية من مستودع خطوط قوقل (رخصة OFL)، والباقي خطوط المستخدم المثبتة على جهازه.
 * «فرشاة الليمون» رخصتها للاستعمال الشخصي فقط: لا تُستعمل في فيديو منشور.
 */
export const FONTS = {
  ruqaa: { family: "XRuqaa", files: [["400", "ArefRuqaa-Regular.ttf"], ["700", "ArefRuqaa-Bold.ttf"]], label: "رقعة عارف (يدوي)" },
  ruqaaInk: { family: "XRuqaaInk", files: [["400", "ArefRuqaaInk-Regular.ttf"], ["700", "ArefRuqaaInk-Bold.ttf"]], label: "رقعة عارف بالحبر الملوّن" },
  kafRuqaa: { family: "XKafRuqaa", files: [["400", "KAF-AREF-RUQAA-TITL-.otf"]], label: "رقعة كاف للعناوين" },
  kafRuqaaSw: { family: "XKafRuqaaSw", files: [["400", "KAF-AREF-RUQAA-SALT-SW-.otf"]], label: "رقعة كاف بالذيول" },
  reemInk: { family: "XReemInk", files: [["400", "ReemKufiInk-Regular.ttf"]], label: "ريم الكوفي بالحبر" },
  reem: { family: "XReem", files: [["400 700", "ReemKufi[wght].ttf"]], label: "ريم الكوفي" },
  marhey: { family: "XMarhey", files: [["300 700", "Marhey[wght].ttf"]], label: "مرحي (يدوي)" },
  rakkas: { family: "XRakkas", files: [["400", "Rakkas-Regular.ttf"]], label: "رقّاص (عناوين ثقيلة)" },
  mirza: { family: "XMirza", files: [["700", "Mirza-Bold.ttf"]], label: "ميرزا (نسخ فخم)" },
  katibeh: { family: "XKatibeh", files: [["400", "Katibeh-Regular.ttf"]], label: "كاتبة (يدوي)" },
  messiri: { family: "XMessiri", files: [["400 700", "ElMessiri[wght].ttf"]], label: "المسيري" },
  blakaInk: { family: "XBlakaInk", files: [["400", "BlakaInk-Regular.ttf"]], label: "بلاكا بالحبر (مغربي)" },
  gulzar: { family: "XGulzar", files: [["400", "Gulzar-Regular.ttf"]], label: "گلزار (نستعليق)" },
  jomhuria: { family: "XJomhuria", files: [["400", "Jomhuria-Regular.ttf"]], label: "جمهورية (عناوين)" },
  baloo: { family: "XBaloo", files: [["400 800", "BalooBhaijaan2[wght].ttf"]], label: "بالو (مستدير ثقيل)" },
  lalezar: { family: "XLalezar", files: [["400", "Lalezar-Regular.ttf"]], label: "لاله‌زار" },
  amiri: { family: "XAmiri", files: [["400", "Amiri-Regular.ttf"], ["700", "Amiri-Bold.ttf"]], label: "أميري" },
  kitab: { family: "XKitab", files: [["400", "Kitab-Regular.ttf"]], label: "كتاب (خط المستخدم)" },
  sahlab: { family: "XSahlab", files: [["400", "ALLEXP03SAHLAB.otf"]], label: "سحلب (خط المستخدم)" },
  mars: { family: "XMars", files: [["400", "Mars.otf"]], label: "مارس (خط المستخدم)" },
  typokar: { family: "XTypokar", files: [["400", "typokar.ttf"]], label: "تايبوكار (خط المستخدم)" },
  zain: { family: "XZain", files: [["400", "alfont_com_zain-Regular-mob.ttf"]], label: "زين (خط المستخدم)" },
  lemon: { family: "XLemon", files: [["400", "lemon-brush-arabic-personal-use-only.otf"]], label: "فرشاة الليمون (شخصي فقط)" },
} as const;
export type FontKey = keyof typeof FONTS;
export const ff = (k: FontKey) => `${FONTS[k].family}, serif`;

const loaded = new Set<string>();
/** يحمّل الخطوط المطلوبة من الملفات المحلية قبل أول إطار. */
export const useFonts = (keys: FontKey[]) => {
  const need = keys.filter((k) => !loaded.has(k));
  const [h] = React.useState(() => (need.length ? delayRender("fonts " + need.join(",")) : null));
  React.useEffect(() => {
    if (!h) return;
    const faces = need.flatMap((k) => FONTS[k].files.map(([w, f]) => new FontFace(FONTS[k].family, `url(${staticFile("fonts/" + f)})`, { weight: w })));
    Promise.all(faces.map((f) => f.load())).then((l) => { l.forEach((f) => document.fonts.add(f)); need.forEach((k) => loaded.add(k)); continueRender(h); }).catch((e) => cancelRender(e));
  }, [h]);
};
