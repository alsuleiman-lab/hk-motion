import React from "react";
import { Composition, Folder } from "remotion";
import { SHOW_ARCHIVE } from "./archive";
import { ByRecency } from "./ByRecency";
import { FamilyStickCast } from "./FamilyStickCast";
import { DodoFamilyCast } from "./DodoFamilyCast";
import { JuhaStory15, JUHA_STORY_FRAMES } from "./JuhaStory15";
import { SakugaDemo, SpotDemo, TravelDemo, SAKUGA_DEMO_FRAMES, SPOT_DEMO_FRAMES, TRAVEL_DEMO_FRAMES, CollageDemo, CollageDemoL, COLLAGE_DEMO_FRAMES } from "./SourceMovesDemo";
import { ConvergeDemo, BlurRiseDemo, PanelDemo, CONVERGE_DEMO_FRAMES, BLURRISE_DEMO_FRAMES, PANEL_DEMO_FRAMES, PhoneDemo, PHONE_DEMO_FRAMES } from "./FlowDemos";
import { FlashDemo, FLASH_DEMO_FRAMES } from "./SpaceFlashDemo";
import { TypeCompareDemo, TYPECOMPARE_DEMO_FRAMES } from "./TypeCompareDemo";
import { EuTextPractice, EU_TEXT_PRACTICE_FRAMES } from "./EuTextPractice";
import { ElementsLab, ELEMENTS_LAB_FRAMES } from "./ElementsLab";
import { MorphDemo, MORPH_DEMO_FRAMES } from "./MorphDemo";
import { TimelineDemo, TIMELINE_DEMO_FRAMES } from "./TimelineDemo";

import { MaskTest, MASKTEST_FRAMES } from "./MaskedVideo";
import { KhMaskTest, KMT_FRAMES } from "./KhMaskTest";
import { KhBench, KHBENCH_FRAMES } from "./KhBench";
import { KhCssMaskTrial, KhCssMaskTrialOT, CSSMASK_FRAMES } from "./KhCssMaskTrial";
import { KhAlphaTrial, ALPHATRIAL_FRAMES } from "./KhAlphaTrial";
import { HybridGrad, HybridGradP135, HybridGradP160, HybridStar, HybridVig } from "./hybrid/HybridAssets";


// archive is required lazily: importing it runs every old project's module code (some download fonts), which slowed every render
const Archive: React.FC = SHOW_ARCHIVE ? // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("./ArchiveComps") as { ArchiveComps: React.FC }).ArchiveComps : () => null;


import { JuhaInshallah15, JUHA_15S_FPS, JUHA_15S_FRAMES } from "./juha/JuhaInshallah15";
import { CartoonEndScreen } from "./juha/CartoonEndScreen";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import demoSpec from "../data/specs/demo.json";
import nifas40Spec from "../data/specs/nifas_40.json";
import nifasReelSpec from "../data/specs/nifas_40_reel.json";
import warsKalafSpec from "../data/specs/wars_kalaf.json";
import warsKalafReelSpec from "../data/specs/wars_kalaf_reel.json";
import { BidahCartoon, BIDAH_TOTAL_FRAMES, BIDAH_FPS } from "./BidahCartoon";
const SpecDemo: React.FC = () => <MontageFromSpec spec={demoSpec as unknown as MontageSpec} />;
const Nifas40Comp: React.FC = () => <MontageFromSpec spec={nifas40Spec as unknown as MontageSpec} />;
const NifasReelComp: React.FC = () => <MontageFromSpec spec={nifasReelSpec as unknown as MontageSpec} />;
const WarsKalafLComp: React.FC = () => <MontageFromSpec spec={warsKalafSpec as unknown as MontageSpec} />;
const WarsKalafRComp: React.FC = () => <MontageFromSpec spec={warsKalafReelSpec as unknown as MontageSpec} />;
import {
  DebateThumb1,
  DebateThumb2,
  DebateThumb3,
  DebateThumb4,
  DebateThumb5,
  DebateThumb6,
  DebateThumb7,
  DebateThumb8,
} from "./DebateThumbnails";

import { Clip4ThronePortrait, CLIP4_FRAMES, CLIP4_FPS } from "./Clip4ThronePortrait";
import { ShiaHandDebate, SHIA_HAND_FPS, SHIA_HAND_TOTAL_FRAMES } from "./ShiaHandDebate";
import { PoisonComps } from "./PoisonComps";
import datePoisonSpec from "../data/specs/DatePoison.json";
const DatePoisonLComp: React.FC = () => <MontageFromSpec spec={datePoisonSpec as unknown as MontageSpec} />;

export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>
      {/* Debate Livestream Thumbnails (1920x1080) */}
      <Composition id="DebateThumb1" component={DebateThumb1} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="DebateThumb2" component={DebateThumb2} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="DebateThumb3" component={DebateThumb3} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="DebateThumb4" component={DebateThumb4} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="DebateThumb5" component={DebateThumb5} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="DebateThumb6" component={DebateThumb6} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="DebateThumb7" component={DebateThumb7} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="DebateThumb8" component={DebateThumb8} durationInFrames={30} fps={30} width={1920} height={1080} />
      <Composition id="ShiaHandDebate" component={ShiaHandDebate} durationInFrames={SHIA_HAND_TOTAL_FRAMES} fps={SHIA_HAND_FPS} width={1080} height={1920} />
      <Composition id="FamilyStickCast" component={FamilyStickCast} durationInFrames={180} fps={30} width={1080} height={1920} />
      <Composition id="DodoFamilyCast" component={DodoFamilyCast} durationInFrames={180} fps={30} width={1080} height={1920} />



      {/* ACTIVE project(s): Livestream Debate Shorts */}
      <Composition id="Clip4ThronePortrait" component={Clip4ThronePortrait} durationInFrames={CLIP4_FRAMES} fps={CLIP4_FPS} width={1080} height={1920} />

      <Composition id="BidahCartoon" component={BidahCartoon} durationInFrames={BIDAH_TOTAL_FRAMES} fps={BIDAH_FPS} width={1080} height={1920} />
      {/* دروس: خطأ شائع في النفاس */}
      <Composition id="Nifas-40-L" component={Nifas40Comp} durationInFrames={nifas40Spec.frames} fps={30} width={1920} height={1080} />
      <Composition id="Nifas-40-Reel" component={NifasReelComp} durationInFrames={nifasReelSpec.frames} fps={30} width={1080} height={1920} />
      {/* دروس: نبات الورس وعلاج الكلف */}
      <Composition id="Wars-Kalaf-L" component={WarsKalafLComp} durationInFrames={warsKalafSpec.frames} fps={30} width={1920} height={1080} />
      <Composition id="Wars-Kalaf-R" component={WarsKalafRComp} durationInFrames={warsKalafReelSpec.frames} fps={30} width={1080} height={1920} />

      <Composition id="Spec-Demo-L" component={SpecDemo} durationInFrames={demoSpec.frames} fps={30} width={1920} height={1080} />
      <Composition id="JuhaInshallah15" component={JuhaInshallah15} durationInFrames={JUHA_15S_FRAMES} fps={JUHA_15S_FPS} width={1080} height={1920} />
      <Composition id="CartoonOutro" component={CartoonEndScreen} durationInFrames={90} fps={30} width={1080} height={1920} />
      <Composition id="Juha-15s" component={JuhaStory15} durationInFrames={JUHA_STORY_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="KhAlphaTrial" component={KhAlphaTrial} durationInFrames={ALPHATRIAL_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="KhCssMaskTrialOT" component={KhCssMaskTrialOT} durationInFrames={CSSMASK_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="KhCssMaskTrial" component={KhCssMaskTrial} durationInFrames={CSSMASK_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="KhBench-old" component={KhBench} durationInFrames={KHBENCH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ mode: "old" as const }} />
      <Composition id="KhBench-css" component={KhBench} durationInFrames={KHBENCH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ mode: "css" as const }} />
      <Composition id="KhBench-gl" component={KhBench} durationInFrames={KHBENCH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ mode: "gl" as const }} />
      <Composition id="KhMaskTest" component={KhMaskTest} durationInFrames={KMT_FRAMES} fps={30} width={1920} height={1080} />
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
      <Composition id="DatePoison-L" component={DatePoisonLComp} durationInFrames={datePoisonSpec.frames} fps={30} width={1920} height={1080} />
      <PoisonComps />
      <Folder name="tools">
      </Folder>
      <Archive />
    </ByRecency>
  );
};
