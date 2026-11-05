import React from "react";
import { ThumbPro, Cutout } from "./ThumbPro";

const SH: Cutout = {
  src: "sheikh_gallery/brown/sheikh_cov.png",
  headX: 994,
  headTop: 57,
  headW: 238,
  srcW: 1920
};

export const DebateThumb1: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="cov/ms_marinid.jpg"
    tone="#1a3050"
    words={{ main: "أثبتَ لله", accent: "3 علوم؟! ", sub: "سأل ليُحرج أهل السنة فارتدت الشبهة عليه" }}
    sheikh={SH}
  />
);

export const DebateThumb2: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="cov/ms_bukhari.jpg"
    tone="#3a2515"
    words={{ main: "لماذا عفا عن", accent: "ابن أبي سرح؟", sub: "كشف شبهة الشفاعة في حد الردة" }}
    sheikh={SH}
  />
);

export const DebateThumb3: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="people/azharMosque.jpg"
    tone="#1c2438"
    words={{ main: "اتهمه بالتدليس في", accent: "الحاكمية!", sub: "متصل يهاجم الشيخ بغضب.. فكيف جاءه الرد؟" }}
    sheikh={SH}
  />
);

export const DebateThumb4: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="broll/ghasiq_night.jpg"
    tone="#182035"
    words={{ main: "هل يعلم الله", accent: "موتك الآن؟", sub: "حل إشكال قرآني دقيق في علم الله الأزلي" }}
    sheikh={SH}
  />
);

export const DebateThumb5: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="cov/ms_calli.jpg"
    tone="#402018"
    words={{ main: "شيعي يسأل عن", accent: "العرش!", sub: "سأل ليُحرج أهل السنة فاعترف بما ينقض مذهبه" }}
    sheikh={SH}
  />
);

export const DebateThumb6: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="cov/ms_marinid.jpg"
    tone="#252035"
    words={{ main: "تكفير", accent: "الأشاعرة!", sub: "مواجهة ساخنة مع أبو موسى حول منهج ابن تيمية" }}
    sheikh={SH}
  />
);

export const DebateThumb7: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="people/azharCourt.jpg"
    tone="#203045"
    words={{ main: "أين الله؟", accent: "حوار أشعري", sub: "هل يوجد فاصل ومباينة بين الخالق والمخلوق؟" }}
    sheikh={SH}
  />
);

export const DebateThumb8: React.FC = () => (
  <ThumbPro
    format="landscape"
    layout="word"
    bg="broll/falaq_dawn.jpg"
    tone="#352518"
    words={{ main: "لماذا لم يُكفّر", accent: "المأمون؟! ", sub: "الإمام أحمد وفتنة القول بخلق القرآن" }}
    sheikh={SH}
  />
);

