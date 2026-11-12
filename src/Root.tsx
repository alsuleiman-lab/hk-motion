import React from "react";
import { Composition, Folder } from "remotion";
import { SHOW_ARCHIVE, SHOW_REFERENCE } from "./archive";
import { ByRecency } from "./ByRecency";
import { FamilyStickCast } from "./FamilyStickCast";
import { DodoFamilyCast } from "./DodoFamilyCast";
import { SakugaDemo, SpotDemo, TravelDemo, SAKUGA_DEMO_FRAMES, SPOT_DEMO_FRAMES, TRAVEL_DEMO_FRAMES, CollageDemo, CollageDemoL, COLLAGE_DEMO_FRAMES } from "./SourceMovesDemo";
import { ConvergeDemo, BlurRiseDemo, PanelDemo, CONVERGE_DEMO_FRAMES, BLURRISE_DEMO_FRAMES, PANEL_DEMO_FRAMES, PhoneDemo, PHONE_DEMO_FRAMES } from "./FlowDemos";
import { FlashDemo, FLASH_DEMO_FRAMES } from "./SpaceFlashDemo";
import { TypeCompareDemo, TYPECOMPARE_DEMO_FRAMES } from "./TypeCompareDemo";
import { EuTextPractice, EU_TEXT_PRACTICE_FRAMES } from "./EuTextPractice";
import { ElementsLab, ELEMENTS_LAB_FRAMES } from "./ElementsLab";
import { MorphDemo, MORPH_DEMO_FRAMES } from "./MorphDemo";
import { TimelineDemo, TIMELINE_DEMO_FRAMES } from "./TimelineDemo";

import { MaskTest, MASKTEST_FRAMES } from "./MaskedVideo";
import { KhAlphaTrial, ALPHATRIAL_FRAMES } from "./KhAlphaTrial";
import { HybridGrad, HybridGradP135, HybridGradP160, HybridStar, HybridVig } from "./hybrid/HybridAssets";


// archive is required lazily: importing it runs every old project's module code (some download fonts), which slowed every render
const Archive: React.FC = SHOW_ARCHIVE ? // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("./ArchiveComps") as { ArchiveComps: React.FC }).ArchiveComps : () => null;


import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";

import streamArshFakhSpec from "../data/specs/stream_arsh_fakh_reel.json";
import streamMayyitIlmSpec from "../data/specs/stream_mayyit_ilm_reel.json";
const StreamArshFakhRComp: React.FC = () => <MontageFromSpec spec={streamArshFakhSpec as unknown as MontageSpec} />;
import kitabSunnaSpec from "../data/specs/kitab_sunna.json";
const KitabSunnaComp: React.FC = () => <MontageFromSpec spec={kitabSunnaSpec as unknown as MontageSpec} />;
import fatimaSheikhaynSpec from "../data/specs/fatima_sheikhayn.json";
const FatimaSheikhaynComp: React.FC = () => <MontageFromSpec spec={fatimaSheikhaynSpec as unknown as MontageSpec} />;
import saintRambalSpec from "../data/specs/saint_rambal.json";
const SaintRambalComp: React.FC = () => <MontageFromSpec spec={saintRambalSpec as unknown as MontageSpec} />;
import QCs_01Spec from "../data/specs/qc_01.json";
const QCs_01Comp: React.FC = () => <MontageFromSpec spec={QCs_01Spec as unknown as MontageSpec} />;
import QCs_02Spec from "../data/specs/qc_02.json";
const QCs_02Comp: React.FC = () => <MontageFromSpec spec={QCs_02Spec as unknown as MontageSpec} />;
import QCs_03Spec from "../data/specs/qc_03.json";
const QCs_03Comp: React.FC = () => <MontageFromSpec spec={QCs_03Spec as unknown as MontageSpec} />;
import QCs_04Spec from "../data/specs/qc_04.json";
const QCs_04Comp: React.FC = () => <MontageFromSpec spec={QCs_04Spec as unknown as MontageSpec} />;
import QCs_05Spec from "../data/specs/qc_05.json";
const QCs_05Comp: React.FC = () => <MontageFromSpec spec={QCs_05Spec as unknown as MontageSpec} />;
import QCs_06Spec from "../data/specs/qc_06.json";
const QCs_06Comp: React.FC = () => <MontageFromSpec spec={QCs_06Spec as unknown as MontageSpec} />;
import QCs_07Spec from "../data/specs/qc_07.json";
const QCs_07Comp: React.FC = () => <MontageFromSpec spec={QCs_07Spec as unknown as MontageSpec} />;
import QCs_08Spec from "../data/specs/qc_08.json";
const QCs_08Comp: React.FC = () => <MontageFromSpec spec={QCs_08Spec as unknown as MontageSpec} />;
import QCs_09Spec from "../data/specs/qc_09.json";
const QCs_09Comp: React.FC = () => <MontageFromSpec spec={QCs_09Spec as unknown as MontageSpec} />;
import QCs_10Spec from "../data/specs/qc_10.json";
const QCs_10Comp: React.FC = () => <MontageFromSpec spec={QCs_10Spec as unknown as MontageSpec} />;
import QCs_11Spec from "../data/specs/qc_11.json";
const QCs_11Comp: React.FC = () => <MontageFromSpec spec={QCs_11Spec as unknown as MontageSpec} />;
import QCs_12Spec from "../data/specs/qc_12.json";
const QCs_12Comp: React.FC = () => <MontageFromSpec spec={QCs_12Spec as unknown as MontageSpec} />;
import QCs_14Spec from "../data/specs/qc_14.json";
const QCs_14Comp: React.FC = () => <MontageFromSpec spec={QCs_14Spec as unknown as MontageSpec} />;
import QCs_15Spec from "../data/specs/qc_15.json";
const QCs_15Comp: React.FC = () => <MontageFromSpec spec={QCs_15Spec as unknown as MontageSpec} />;
import QCs_16Spec from "../data/specs/qc_16.json";
const QCs_16Comp: React.FC = () => <MontageFromSpec spec={QCs_16Spec as unknown as MontageSpec} />;
import QCs_17Spec from "../data/specs/qc_17.json";
const QCs_17Comp: React.FC = () => <MontageFromSpec spec={QCs_17Spec as unknown as MontageSpec} />;
import QCs_18Spec from "../data/specs/qc_18.json";
const QCs_18Comp: React.FC = () => <MontageFromSpec spec={QCs_18Spec as unknown as MontageSpec} />;
import QCs_19Spec from "../data/specs/qc_19.json";
const QCs_19Comp: React.FC = () => <MontageFromSpec spec={QCs_19Spec as unknown as MontageSpec} />;
import QCs_20Spec from "../data/specs/qc_20.json";
const QCs_20Comp: React.FC = () => <MontageFromSpec spec={QCs_20Spec as unknown as MontageSpec} />;
import QCs_21Spec from "../data/specs/qc_21.json";
const QCs_21Comp: React.FC = () => <MontageFromSpec spec={QCs_21Spec as unknown as MontageSpec} />;
const StreamMayyitIlmRComp: React.FC = () => <MontageFromSpec spec={streamMayyitIlmSpec as unknown as MontageSpec} />;





import { PoisonComps } from "./PoisonComps";
import { ReelsComps } from "./ReelsComps";

export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>

      <Folder name="مونتاج الجلسة">
        <Composition id="KitabSunna-L" component={KitabSunnaComp} durationInFrames={kitabSunnaSpec.frames} fps={30} width={1920} height={1080} />
        <Composition id="KitabSunna" component={KitabSunnaComp} durationInFrames={kitabSunnaSpec.frames} fps={30} width={1080} height={1920} />
        <Composition id="FatimaSheikhayn-L" component={FatimaSheikhaynComp} durationInFrames={fatimaSheikhaynSpec.frames} fps={30} width={1920} height={1080} />
        <Composition id="FatimaSheikhayn" component={FatimaSheikhaynComp} durationInFrames={fatimaSheikhaynSpec.frames} fps={30} width={1080} height={1920} />
        <Composition id="SaintRambal-L" component={SaintRambalComp} durationInFrames={saintRambalSpec.frames} fps={30} width={1920} height={1080} />
        <Composition id="SaintRambal" component={SaintRambalComp} durationInFrames={saintRambalSpec.frames} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="البثوث">
        {/* بث للحوار مع المخالفين (1) */}
        <Composition id="Stream-Arsh-Fakh-R"component={StreamArshFakhRComp} durationInFrames={streamArshFakhSpec.frames} fps={30} width={1080} height={1920} />
        <Composition id="Stream-Mayyit-Ilm-R" component={StreamMayyitIlmRComp} durationInFrames={streamMayyitIlmSpec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-01-R" component={QCs_01Comp} durationInFrames={QCs_01Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-02-R" component={QCs_02Comp} durationInFrames={QCs_02Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-03-R" component={QCs_03Comp} durationInFrames={QCs_03Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-04-R" component={QCs_04Comp} durationInFrames={QCs_04Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-05-R" component={QCs_05Comp} durationInFrames={QCs_05Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-06-R" component={QCs_06Comp} durationInFrames={QCs_06Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-07-R" component={QCs_07Comp} durationInFrames={QCs_07Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-08-R" component={QCs_08Comp} durationInFrames={QCs_08Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-09-R" component={QCs_09Comp} durationInFrames={QCs_09Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-10-R" component={QCs_10Comp} durationInFrames={QCs_10Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-11-R" component={QCs_11Comp} durationInFrames={QCs_11Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-12-R" component={QCs_12Comp} durationInFrames={QCs_12Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-14-R" component={QCs_14Comp} durationInFrames={QCs_14Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-15-R" component={QCs_15Comp} durationInFrames={QCs_15Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-16-R" component={QCs_16Comp} durationInFrames={QCs_16Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-17-R" component={QCs_17Comp} durationInFrames={QCs_17Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-18-R" component={QCs_18Comp} durationInFrames={QCs_18Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-19-L" component={QCs_19Comp} durationInFrames={QCs_19Spec.frames} fps={30} width={1920} height={1080} />
        <Composition id="QC-20-R" component={QCs_20Comp} durationInFrames={QCs_20Spec.frames} fps={30} width={1080} height={1920} />
        <Composition id="QC-21-R" component={QCs_21Comp} durationInFrames={QCs_21Spec.frames} fps={30} width={1080} height={1920} />
      </Folder>

      {SHOW_REFERENCE && <Composition id="FamilyStickCast" component={FamilyStickCast} durationInFrames={180} fps={30} width={1080} height={1920} />}
      {SHOW_REFERENCE && <Composition id="DodoFamilyCast" component={DodoFamilyCast} durationInFrames={180} fps={30} width={1080} height={1920} />}
      {SHOW_REFERENCE && <Composition id="KhAlphaTrial" component={KhAlphaTrial} durationInFrames={ALPHATRIAL_FRAMES} fps={30} width={1920} height={1080} />}
      <Folder name="أصول الهجين (مخفية)">
      <Composition id="HybridGrad" component={HybridGrad} durationInFrames={1} fps={30} width={1920} height={1080} />
      <Composition id="HybridVig" component={HybridVig} durationInFrames={1} fps={30} width={1920} height={1080} />
      <Composition id="HybridGradP135" component={HybridGradP135} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="HybridGradP160" component={HybridGradP160} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="HybridVigP" component={HybridVig} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="HybridStar" component={HybridStar} durationInFrames={1} fps={30} width={140} height={140} />
      </Folder>
      {SHOW_REFERENCE && <Folder name="عروض مرجعية">
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
      </Folder>}
      <PoisonComps />
      <ReelsComps />
      <Folder name="أدوات">
      </Folder>
      <Archive />
    </ByRecency>
  );
};
