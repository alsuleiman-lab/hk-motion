import React from "react";
import { Composition, Folder } from "remotion";
import { SHOW_ARCHIVE } from "./archive";
import { ByRecency } from "./ByRecency";
import { FamilyStickCast } from "./FamilyStickCast";
import { DodoFamilyCast } from "./DodoFamilyCast";
import { DeedsCounterDodo, DEEDS_FRAMES } from "./DeedsCounterDodo";
import { JuhaStory15, JUHA_STORY_FRAMES } from "./JuhaStory15";
import { KamliPoetKing, KAMLI_FRAMES } from "./KamliPoetKing";
import { SakugaDemo, SpotDemo, TravelDemo, SAKUGA_DEMO_FRAMES, SPOT_DEMO_FRAMES, TRAVEL_DEMO_FRAMES, CollageDemo, CollageDemoL, COLLAGE_DEMO_FRAMES } from "./SourceMovesDemo";
import { ConvergeDemo, BlurRiseDemo, PanelDemo, CONVERGE_DEMO_FRAMES, BLURRISE_DEMO_FRAMES, PANEL_DEMO_FRAMES, PhoneDemo, PHONE_DEMO_FRAMES } from "./FlowDemos";
import { FlashDemo, FLASH_DEMO_FRAMES } from "./SpaceFlashDemo";
import { TypeCompareDemo, TYPECOMPARE_DEMO_FRAMES } from "./TypeCompareDemo";
import { EuTextPractice, EU_TEXT_PRACTICE_FRAMES } from "./EuTextPractice";
import { ElementsLab, ELEMENTS_LAB_FRAMES } from "./ElementsLab";
import { MorphDemo, MORPH_DEMO_FRAMES } from "./MorphDemo";
import { TimelineDemo, TIMELINE_DEMO_FRAMES } from "./TimelineDemo";
import { KitL1, KitL4, KitP1, KitP4, COVERKIT_FRAMES } from "./CoverKit";

import { MaskTest, MASKTEST_FRAMES } from "./MaskedVideo";
import { KhMaskTest, KMT_FRAMES } from "./KhMaskTest";
import { KhBench, KHBENCH_FRAMES } from "./KhBench";
import { KhCssMaskTrial, KhCssMaskTrialOT, CSSMASK_FRAMES } from "./KhCssMaskTrial";
import { KhAlphaTrial, ALPHATRIAL_FRAMES } from "./KhAlphaTrial";
import { IbnBazPaperCover } from "./IbnBazPaperCover";
import { IbnBazPaperCoverLandscape } from "./IbnBazPaperCoverLandscape";
import { HybridGrad, HybridGradP135, HybridGradP160, HybridStar, HybridVig } from "./hybrid/HybridAssets";


// archive is required lazily: importing it runs every old project's module code (some download fonts), which slowed every render
const Archive: React.FC = SHOW_ARCHIVE ? // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("./ArchiveComps") as { ArchiveComps: React.FC }).ArchiveComps : () => null;

import { DeedatFalaqShort, FALAQ_FPS, FALAQ_TOTAL_FRAMES } from "./quran/DeedatFalaqShort";
import { DeedatMasadShort, MASAD_FPS, MASAD_TOTAL_FRAMES } from "./quran/DeedatMasadShort";
import { DeedatNasrShort, NASR_FPS, NASR_TOTAL_FRAMES } from "./quran/DeedatNasrShort";
import { DeedatKafirunShort, KAFIRUN_FPS, KAFIRUN_TOTAL_FRAMES } from "./quran/DeedatKafirunShort";

import { JuhaInshallah15, JUHA_15S_FPS, JUHA_15S_FRAMES } from "./juha/JuhaInshallah15";
import { CartoonEndScreen } from "./juha/CartoonEndScreen";
import { JnCoverL, JnCoverP } from "./JnCover";
import { Duel2, DUEL2_FRAMES } from "./DuelHeritage";
import { ThumbDuelL, ThumbDuelP, ThumbEvidenceL, ThumbWordL, ThumbWordP } from "./ThumbPro";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import demoSpec from "../data/specs/demo.json";
import { BidahCartoon, BIDAH_TOTAL_FRAMES, BIDAH_FPS } from "./BidahCartoon";
const SpecDemo: React.FC = () => <MontageFromSpec spec={demoSpec as unknown as MontageSpec} />;
import zaynabSpec from "../data/specs/zaynab_shrine.json";
const ZaynabShrineVideo: React.FC = () => <MontageFromSpec spec={zaynabSpec as unknown as MontageSpec} />;
import zaynabShrinesSpec from "../data/specs/zaynab_shrines.json";
const ZaynabShrinesVideo: React.FC = () => <MontageFromSpec spec={zaynabShrinesSpec as unknown as MontageSpec} />;
import allahTahtSpec from "../data/specs/allah_taht.json";
const AllahTahtVideo: React.FC = () => <MontageFromSpec spec={allahTahtSpec as unknown as MontageSpec} />;
import shouldersSpec from "../data/specs/ShouldersPrayer.json";
const ShouldersPrayerVideo: React.FC = () => <MontageFromSpec spec={shouldersSpec as unknown as MontageSpec} />;
import allahTahtReelSpec from "../data/specs/allah_taht_reel.json";
const AllahTahtReelVideo: React.FC = () => <MontageFromSpec spec={allahTahtReelSpec as unknown as MontageSpec} />;

import { Clip1SunPortrait, CLIP1_FRAMES, CLIP1_FPS } from "./Clip1SunPortrait";
import { Clip2TaaddudPortrait, CLIP2_FRAMES, CLIP2_FPS } from "./Clip2TaaddudPortrait";
import { Clip3SunrisePortrait, CLIP3_FRAMES, CLIP3_FPS } from "./Clip3SunrisePortrait";
import { Clip4ThronePortrait, CLIP4_FRAMES, CLIP4_FPS } from "./Clip4ThronePortrait";
import { Clip5TaslamPortrait, CLIP5_FRAMES, CLIP5_FPS } from "./Clip5TaslamPortrait";



export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>
      <Composition id="FamilyStickCast" component={FamilyStickCast} durationInFrames={180} fps={30} width={1080} height={1920} />
      <Composition id="DodoFamilyCast" component={DodoFamilyCast} durationInFrames={180} fps={30} width={1080} height={1920} />
      <Composition id="DeedsCounterDodo" component={DeedsCounterDodo} durationInFrames={DEEDS_FRAMES} fps={30} width={1080} height={1920} />


      <Composition id="KamliPoetKing" component={KamliPoetKing} durationInFrames={KAMLI_FRAMES} fps={30} width={1080} height={1920} />

      {/* ACTIVE project(s): Livestream Debate Shorts */}
      <Composition id="Clip1SunPortrait" component={Clip1SunPortrait} durationInFrames={CLIP1_FRAMES} fps={CLIP1_FPS} width={1080} height={1920} />
      <Composition id="Clip2TaaddudPortrait" component={Clip2TaaddudPortrait} durationInFrames={CLIP2_FRAMES} fps={CLIP2_FPS} width={1080} height={1920} />
      <Composition id="Clip3SunrisePortrait" component={Clip3SunrisePortrait} durationInFrames={CLIP3_FRAMES} fps={CLIP3_FPS} width={1080} height={1920} />
      <Composition id="Clip4ThronePortrait" component={Clip4ThronePortrait} durationInFrames={CLIP4_FRAMES} fps={CLIP4_FPS} width={1080} height={1920} />
      <Composition id="Clip5TaslamPortrait" component={Clip5TaslamPortrait} durationInFrames={CLIP5_FRAMES} fps={CLIP5_FPS} width={1080} height={1920} />

      <Composition id="BidahCartoon" component={BidahCartoon} durationInFrames={BIDAH_TOTAL_FRAMES} fps={BIDAH_FPS} width={1080} height={1920} />
      <Composition id="Spec-Demo" component={SpecDemo} durationInFrames={demoSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Spec-Demo-L" component={SpecDemo} durationInFrames={demoSpec.frames} fps={30} width={1920} height={1080} />
      <Composition id="ZaynabShrine" component={ZaynabShrineVideo} durationInFrames={zaynabSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="ZaynabShrine-L" component={ZaynabShrineVideo} durationInFrames={zaynabSpec.frames} fps={30} width={1920} height={1080} />
      <Composition id="ZaynabShrines" component={ZaynabShrinesVideo} durationInFrames={zaynabShrinesSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="ZaynabShrines-L" component={ZaynabShrinesVideo} durationInFrames={zaynabShrinesSpec.frames} fps={30} width={1920} height={1080} />
      <Composition id="AllahTaht-L" component={AllahTahtVideo} durationInFrames={allahTahtSpec.frames} fps={30} width={1920} height={1080} />
      <Composition id="ShouldersPrayer" component={ShouldersPrayerVideo} durationInFrames={shouldersSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="AllahTahtReel"component={AllahTahtReelVideo} durationInFrames={allahTahtReelSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="JuhaInshallah15" component={JuhaInshallah15} durationInFrames={JUHA_15S_FRAMES} fps={JUHA_15S_FPS} width={1080} height={1920} />
      <Composition id="CartoonOutro" component={CartoonEndScreen} durationInFrames={90} fps={30} width={1080} height={1920} />
      <Composition id="DeedatMasadShort" component={DeedatMasadShort} durationInFrames={MASAD_TOTAL_FRAMES} fps={MASAD_FPS} width={1080} height={1920} />
      <Composition id="DeedatNasrShort" component={DeedatNasrShort} durationInFrames={NASR_TOTAL_FRAMES} fps={NASR_FPS} width={1080} height={1920} />
      <Composition id="DeedatKafirunShort" component={DeedatKafirunShort} durationInFrames={KAFIRUN_TOTAL_FRAMES} fps={KAFIRUN_FPS} width={1080} height={1920} />
      <Composition id="DeedatFalaqShort" component={DeedatFalaqShort} durationInFrames={FALAQ_TOTAL_FRAMES} fps={FALAQ_FPS} width={1080} height={1920} />
      <Composition id="Juha-15s" component={JuhaStory15} durationInFrames={JUHA_STORY_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="KhAlphaTrial" component={KhAlphaTrial} durationInFrames={ALPHATRIAL_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="KhCssMaskTrialOT" component={KhCssMaskTrialOT} durationInFrames={CSSMASK_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="KhCssMaskTrial" component={KhCssMaskTrial} durationInFrames={CSSMASK_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="KhBench-old" component={KhBench} durationInFrames={KHBENCH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ mode: "old" as const }} />
      <Composition id="KhBench-css" component={KhBench} durationInFrames={KHBENCH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ mode: "css" as const }} />
      <Composition id="KhBench-gl" component={KhBench} durationInFrames={KHBENCH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ mode: "gl" as const }} />
      <Composition id="KhMaskTest" component={KhMaskTest} durationInFrames={KMT_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="IbnBaz-Paper-Cover" component={IbnBazPaperCover} durationInFrames={3} fps={30} width={1080} height={1920} />
      <Composition id="IbnBaz-Paper-Cover-Landscape" component={IbnBazPaperCoverLandscape} durationInFrames={3} fps={30} width={1920} height={1080} />
      <Composition id="IbnBaz-Paper-Cover-Landscape-Open" component={IbnBazPaperCoverLandscape} durationInFrames={5389} fps={30} width={1920} height={1080} defaultProps={{introReveal:true}} />
      <Composition id="Jn-Cover-L" component={JnCoverL} durationInFrames={60} fps={30} width={1920} height={1080} />
      <Composition id="Jn-Cover-P" component={JnCoverP} durationInFrames={60} fps={30} width={1080} height={1920} />
      <Composition id="Duel2" component={Duel2} durationInFrames={DUEL2_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="ThumbPro-Duel-L" component={ThumbDuelL} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="ThumbPro-Word-L" component={ThumbWordL} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="ThumbPro-Evidence-L" component={ThumbEvidenceL} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="ThumbPro-Duel-P" component={ThumbDuelP} durationInFrames={30} fps={30} width={1080} height={1920} />
      <Composition id="ThumbPro-Word-P" component={ThumbWordP} durationInFrames={30} fps={30} width={1080} height={1920} />
      <Composition id="HybridGrad" component={HybridGrad} durationInFrames={1} fps={30} width={1920} height={1080} />
      <Composition id="HybridVig" component={HybridVig} durationInFrames={1} fps={30} width={1920} height={1080} />
      <Composition id="HybridGradP135" component={HybridGradP135} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="HybridGradP160" component={HybridGradP160} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="HybridVigP" component={HybridVig} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="HybridStar" component={HybridStar} durationInFrames={1} fps={30} width={140} height={140} />
      <Folder name="Demos">
        <Composition id="ElementsLab" component={ElementsLab} durationInFrames={ELEMENTS_LAB_FRAMES} fps={30} width={1920} height={1080} />
        <Composition id="EuText-Practice" component={EuTextPractice} durationInFrames={EU_TEXT_PRACTICE_FRAMES} fps={30} width={1920} height={1080} />
        <Composition id="TimelineCounter-Demo" component={TimelineDemo} durationInFrames={TIMELINE_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="MorphKit-Demo" component={MorphDemo} durationInFrames={MORPH_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="TypeCompare-Demo" component={TypeCompareDemo} durationInFrames={TYPECOMPARE_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="FlashCut-Demo" component={FlashDemo} durationInFrames={FLASH_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="ConvergeMerge-Demo" component={ConvergeDemo} durationInFrames={CONVERGE_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="BlurRise-Demo" component={BlurRiseDemo} durationInFrames={BLURRISE_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="PanelToCanvas-Demo" component={PanelDemo} durationInFrames={PANEL_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="PhoneChips-Demo" component={PhoneDemo} durationInFrames={PHONE_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="SakugaMove-Demo" component={SakugaDemo} durationInFrames={SAKUGA_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="SpotlightCard-Demo" component={SpotDemo} durationInFrames={SPOT_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="TimelineTravel-Demo" component={TravelDemo} durationInFrames={TRAVEL_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ theme: "teal" as const }} />
        <Composition id="CollageAssemble-Demo" component={CollageDemo} durationInFrames={COLLAGE_DEMO_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="CollageAssemble-L-Demo" component={CollageDemoL} durationInFrames={COLLAGE_DEMO_FRAMES} fps={30} width={1920} height={1080} />
        <Composition id="MaskedVideo-Demo" component={MaskTest} durationInFrames={MASKTEST_FRAMES} fps={30} width={1920} height={1080} />
      </Folder>
      <Folder name="tools">
      <Composition id="CoverKitLand1" component={KitL1} durationInFrames={COVERKIT_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="CoverKitLand4" component={KitL4} durationInFrames={COVERKIT_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="CoverKitPort1" component={KitP1} durationInFrames={COVERKIT_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="CoverKitPort4" component={KitP4} durationInFrames={COVERKIT_FRAMES} fps={30} width={1080} height={1920} />
      </Folder>
      <Archive />
    </ByRecency>
  );
};
