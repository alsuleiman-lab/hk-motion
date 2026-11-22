import React from "react";
import { Composition, Folder } from "remotion";
import { TitleBarDemo } from "./TitleBarDemo";
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

import { FajrAd, FAJR_FPS, FAJR_TOTAL_FRAMES } from "./FajrAd";
import { FajrAd2, FAJR2_FPS, FAJR2_FRAMES } from "./FajrAd2";

/** (2026-11-22, user order: folders by kind, one folder per project) everything here is inside «الأرشيف», one sub-folder per old project.
 *  Finished / delivered projects. Loaded ONLY when SHOW_ARCHIVE is true (src/archive.ts) so their module-level work (Google-font downloads etc.) never slows the active project's renders. */
export const ArchiveComps: React.FC = () => (

        <>
      <Folder name="الأرشيف">
        <Folder name="نصوص خلف الشيخ (الأزهر)">
        <Composition id="AzBehindP" component={AzBehindP} durationInFrames={1254} fps={30} width={1080} height={1920} />
        <Composition id="AzBehind" component={AzBehind} durationInFrames={1254} fps={30} width={1920} height={1080} />
        </Folder>
        <Folder name="إعلان الفجر">
        <Composition id="FajrAd2" component={FajrAd2} durationInFrames={FAJR2_FRAMES} fps={FAJR2_FPS} width={1080} height={1920} />
        <Composition id="FajrAd" component={FajrAd} durationInFrames={FAJR_TOTAL_FRAMES} fps={FAJR_FPS} width={1080} height={1920} />
        </Folder>
        <Folder name="تجارب شريط العنوان والنص خلف الشيخ">
        <Composition id="TitleBarDemoL" component={TitleBarDemo} durationInFrames={900} fps={30} width={1920} height={1080} />
        <Composition id="TitleBarDemoP" component={TitleBarDemo} durationInFrames={900} fps={30} width={1080} height={1920} />
        <Composition id="BehindLayer" component={BehindLayer} durationInFrames={300} fps={30} width={1920} height={1080} />
        <Composition id="BehindFonts" component={BehindFonts} durationInFrames={600} fps={30} width={1920} height={1080} />
        <Composition id="BehindFonts2" component={BehindFonts2} durationInFrames={255} fps={30} width={1920} height={1080} />
        <Composition id="TitleBarGallery" component={TitleBarGallery} durationInFrames={30} fps={30} width={1920} height={2100} />
        </Folder>
        <Folder name="حلقة الترمذي (نصوص خلف الشيخ وشريط العنوان)">
        <Composition id="TirBehindP" component={TirBehindP} durationInFrames={1140} fps={30} width={1080} height={1920} />
        <Composition id="TirShort" component={TirShort} durationInFrames={SHORT_FRAMES} fps={TIR_FPS} width={1920} height={1080} />
        <Composition id="TirShortPortrait" component={TirShortPortrait} durationInFrames={SHORT_FRAMES} fps={TIR_FPS} width={1080} height={1920} />
        <Composition id="TirPortrait" component={TirPortrait} durationInFrames={TIR_FRAMES} fps={TIR_FPS} width={1080} height={1920} />
        <Composition id="TirLandscape" component={TirLandscape} durationInFrames={TIR_FRAMES} fps={TIR_FPS} width={1920} height={1080} />
        <Composition id="TirBehind" component={TirBehind} durationInFrames={1140} fps={30} width={1920} height={1080} />
        </Folder>
      </Folder>
    </>
      
);
