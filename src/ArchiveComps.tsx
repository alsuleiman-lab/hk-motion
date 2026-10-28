import React from "react";
import { SilentReaction, calculateSilentMetadata } from "./SilentReaction";
import { Composition } from "remotion";
import { TrialComposition } from "./TrialComposition";
import { FPS as TRIAL_FPS, TOTAL_FRAMES as TRIAL_TOTAL_FRAMES } from "./trialData";
import { AhmedComposition } from "./AhmedComposition";
import { FPS as AHMED_FPS, TOTAL_FRAMES as AHMED_TOTAL_FRAMES } from "./ahmedData";
import { MyComponent, TOTAL_FRAMES } from "./Composition";
import { FPS } from "./data";
import { REF_FPS, REF_FRAMES, RefAlternate, RefSplit } from "./RefStyle";
import { P_FPS, P_FRAMES, RefPortrait } from "./RefPortrait";
import { IST_FPS, IST_FRAMES, IstComposition } from "./IstComposition";
import { TitleBarDemo } from "./TitleBarDemo";
import { LIVE_FPS, LIVE_FRAMES, LivePortrait } from "./LivePortrait";
import { BehindLayer } from "./BehindDemo";
import { BehindFonts } from "./BehindFonts";
import { BehindFonts2 } from "./BehindFonts2";
import { TirBehind } from "./TirBehind";
import { TitleBarGallery } from "./TitleBarVariants";
import { TIR_FPS, TIR_FRAMES, TirLandscape, TirShort } from "./TirLandscape";
import { SHORT_FRAMES } from "./tirShort";
import { TirPortrait, TirShortPortrait } from "./TirPortrait";
import { AzBehind } from "./AzBehind";
import { AzBehindP } from "./AzBehindP";
import { TirBehindP } from "./TirBehindP";
import { QuranComposition, TOTAL_FRAMES as TOTAL_FRAMES_QURAN } from "./quran/QuranComposition";
import { DeedatFalaqShort, FALAQ_FPS, FALAQ_TOTAL_FRAMES } from "./quran/DeedatFalaqShort";

import { LessonMiracleLandscape, MIRACLE_DURATION_FRAMES, MIRACLE_FPS } from "./LessonMiracleLandscape";
import { LessonPrayerPortrait, PRAYER_DURATION_FRAMES, PRAYER_FPS } from "./LessonPrayerPortrait";
import { LessonPerfumePortrait, PERFUME_DURATION_FRAMES, PERFUME_FPS } from "./LessonPerfumePortrait";
import { LessonMarriagePortrait, MARRIAGE_DURATION_FRAMES, MARRIAGE_FPS } from "./LessonMarriagePortrait";
import { FajrAd, FAJR_FPS, FAJR_TOTAL_FRAMES } from "./FajrAd";
import { FajrAd2, FAJR2_FPS, FAJR2_FRAMES } from "./FajrAd2";

/** Finished / delivered projects. Loaded ONLY when SHOW_ARCHIVE is true (src/archive.ts) so their module-level work (Google-font downloads etc.) never slows the active project's renders. */
export const ArchiveComps: React.FC = () => (

        <>
      <Composition id="Silent-Cross-Portrait" component={SilentReaction} durationInFrames={650} fps={30} width={1080} height={1920} defaultProps={{ name: "cross-fall", orient: "portrait" as const }} calculateMetadata={calculateSilentMetadata} />
      <Composition id="Silent-Khateeb-Portrait" component={SilentReaction} durationInFrames={1000} fps={30} width={1080} height={1920} defaultProps={{ name: "khateeb-gaza", orient: "portrait" as const }} calculateMetadata={calculateSilentMetadata} />
      <Composition id="Silent-Azkar-Portrait" component={SilentReaction} durationInFrames={1200} fps={30} width={1080} height={1920} defaultProps={{ name: "az-adhkar", orient: "portrait" as const }} calculateMetadata={calculateSilentMetadata} />
      <Composition id="AzBehindP" component={AzBehindP} durationInFrames={1254} fps={30} width={1080} height={1920} />
      <Composition id="AzBehind" component={AzBehind} durationInFrames={1254} fps={30} width={1920} height={1080} />
      <Composition id="FajrAd2" component={FajrAd2} durationInFrames={FAJR2_FRAMES} fps={FAJR2_FPS} width={1080} height={1920} />
      <Composition
        id="FajrAd"
        component={FajrAd}
        durationInFrames={FAJR_TOTAL_FRAMES}
        fps={FAJR_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="LessonMarriagePortrait"
        component={LessonMarriagePortrait}
        durationInFrames={MARRIAGE_DURATION_FRAMES}
        fps={MARRIAGE_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="LessonPerfumePortrait"
        component={LessonPerfumePortrait}
        durationInFrames={PERFUME_DURATION_FRAMES}
        fps={PERFUME_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="LessonMiracleLandscape"
        component={LessonMiracleLandscape}
        durationInFrames={MIRACLE_DURATION_FRAMES}
        fps={MIRACLE_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="LessonPrayerPortrait"
        component={LessonPrayerPortrait}
        durationInFrames={PRAYER_DURATION_FRAMES}
        fps={PRAYER_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="DeedatFalaqShort"
        component={DeedatFalaqShort}
        durationInFrames={FALAQ_TOTAL_FRAMES}
        fps={FALAQ_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="TrialTwoMinutes"
        component={TrialComposition}
        durationInFrames={TRIAL_TOTAL_FRAMES}
        fps={TRIAL_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="AhmedAlTayeb"
        component={AhmedComposition}
        durationInFrames={AHMED_TOTAL_FRAMES}
        fps={AHMED_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Yoga"
        component={MyComponent}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="QuranTalut"
        component={QuranComposition}
        durationInFrames={TOTAL_FRAMES_QURAN}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="RefTestA" component={RefSplit} durationInFrames={REF_FRAMES} fps={REF_FPS} width={1920} height={1080} />
      <Composition id="RefPortraitTest" component={RefPortrait} durationInFrames={P_FRAMES} fps={P_FPS} width={1080} height={1920} />
      <Composition id="IstighathaLandscape" component={IstComposition} durationInFrames={IST_FRAMES} fps={IST_FPS} width={1920} height={1080} />
      <Composition id="TitleBarDemoL" component={TitleBarDemo} durationInFrames={900} fps={30} width={1920} height={1080} />
      <Composition id="TitleBarDemoP" component={TitleBarDemo} durationInFrames={900} fps={30} width={1080} height={1920} />
      <Composition id="LivePortrait" component={LivePortrait} durationInFrames={LIVE_FRAMES} fps={LIVE_FPS} width={1080} height={1920} />
      <Composition id="BehindLayer" component={BehindLayer} durationInFrames={300} fps={30} width={1920} height={1080} />


      <Composition id="BehindFonts" component={BehindFonts} durationInFrames={600} fps={30} width={1920} height={1080} />
      <Composition id="BehindFonts2" component={BehindFonts2} durationInFrames={255} fps={30} width={1920} height={1080} />
      <Composition id="TirBehindP" component={TirBehindP} durationInFrames={1140} fps={30} width={1080} height={1920} />
      <Composition id="TirShort" component={TirShort} durationInFrames={SHORT_FRAMES} fps={TIR_FPS} width={1920} height={1080} />
      <Composition id="TirShortPortrait" component={TirShortPortrait} durationInFrames={SHORT_FRAMES} fps={TIR_FPS} width={1080} height={1920} />
      <Composition id="TirPortrait" component={TirPortrait} durationInFrames={TIR_FRAMES} fps={TIR_FPS} width={1080} height={1920} />
      <Composition id="TirLandscape" component={TirLandscape} durationInFrames={TIR_FRAMES} fps={TIR_FPS} width={1920} height={1080} />
      <Composition id="TitleBarGallery" component={TitleBarGallery} durationInFrames={30} fps={30} width={1920} height={2100} />
      <Composition id="TirBehind" component={TirBehind} durationInFrames={1140} fps={30} width={1920} height={1080} />
      <Composition id="RefTestB" component={RefAlternate} durationInFrames={REF_FRAMES} fps={REF_FPS} width={1920} height={1080} />
        </>
      
);
