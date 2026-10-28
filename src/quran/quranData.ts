export interface SubtitleCue {
  text: string;
  start: number;
  end: number;
  highlightWord?: string;
  highlightColor?: string;
  pillColor?: string;
}

export const FPS = 30;
export const TOTAL_DURATION = 37.78;
export const TOTAL_FRAMES = Math.floor(TOTAL_DURATION * FPS); // 1133 frames

export const subtitleCues: SubtitleCue[] = [
  {
    text: "قال الله سبحانه وتعالى",
    start: 0.0,
    end: 2.1,
  },
  {
    text: "فَلَمَّا فَصَلَ طَالُوتُ بِالْجُنُودِ",
    start: 2.1,
    end: 4.3,
    highlightWord: "طَالُوتُ",
    highlightColor: "#F59E0B",
  },
  {
    text: "قَالَ إِنَّ اللَّهَ مُبْتَلِيكُمْ بِنَهَرٍ",
    start: 4.3,
    end: 7.1,
    highlightWord: "بِنَهَرٍ",
    highlightColor: "#38BDF8",
  },
  {
    text: "فَمَنْ شَرِبَ مِنْهُ فَلَيْسَ مِنِّي",
    start: 7.1,
    end: 10.0,
    highlightWord: "فَلَيْسَ مِنِّي",
    highlightColor: "#F87171",
  },
  {
    text: "وَمَنْ لَمْ يَطْعَمْهُ فَإِنَّهُ مِنِّي",
    start: 10.0,
    end: 13.1,
    highlightWord: "فَإِنَّهُ مِنِّي",
    highlightColor: "#34D399",
  },
  {
    text: "إِلَّا مَنِ اغْتَرَفَ غُرْفَةً بِيَدِهِ",
    start: 13.1,
    end: 16.0,
    highlightWord: "غُرْفَةً بِيَدِهِ",
    highlightColor: "#FBBF24",
  },
  {
    text: "وكأن الله سبحانه وتعالى يعلّمنا",
    start: 16.0,
    end: 19.0,
  },
  {
    text: "أنك إذا سِرتَ بالطريق الصحيح",
    start: 19.0,
    end: 21.5,
    highlightWord: "بالطريق الصحيح",
    highlightColor: "#34D399",
  },
  {
    text: "مع الأنبياء والصديقين..",
    start: 21.5,
    end: 23.5,
    highlightWord: "والصديقين",
    highlightColor: "#F59E0B",
  },
  {
    text: "« فَـلَا تَلْتَفِـتْ ! »",
    start: 23.5,
    end: 25.5,
    highlightWord: "فَـلَا تَلْتَفِـتْ",
    highlightColor: "#FFFFFF",
    pillColor: "rgba(220, 38, 38, 0.95)",
  },
  {
    text: "ولو اضطررت للالتفات إلى أمرٍ تحتاجه",
    start: 25.5,
    end: 29.8,
  },
  {
    text: "فقط بقدر حاجتك!",
    start: 29.8,
    end: 31.4,
    highlightWord: "بقدر حاجتك",
    highlightColor: "#F59E0B",
  },
  {
    text: "وسِر في طريقك.. ولا تنشغل!",
    start: 31.4,
    end: 34.2,
    highlightWord: "ولا تنشغل",
    highlightColor: "#34D399",
  },
  {
    text: "والسلام عليكم ورحمة الله",
    start: 34.2,
    end: 37.5,
  },
];
