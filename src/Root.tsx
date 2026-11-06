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
import warsKalafReelSpec from "../data/specs/wars_kalaf_reel.json";
import tawafNisaReelSpec from "../data/specs/tawaf_nisa_reel.json";
import wuduAwdReelSpec from "../data/specs/wudu_awd_reel.json";
import khalaSalahReelSpec from "../data/specs/khala_salah_reel.json";
import mawtiAqsamReelSpec from "../data/specs/mawti_aqsam_reel.json";
import { BidahCartoon, BIDAH_TOTAL_FRAMES, BIDAH_FPS } from "./BidahCartoon";
const SpecDemo: React.FC = () => <MontageFromSpec spec={demoSpec as unknown as MontageSpec} />;
const WarsKalafRComp: React.FC = () => <MontageFromSpec spec={warsKalafReelSpec as unknown as MontageSpec} />;
const TawafNisaRComp: React.FC = () => <MontageFromSpec spec={tawafNisaReelSpec as unknown as MontageSpec} />;
const WuduAwdRComp: React.FC = () => <MontageFromSpec spec={wuduAwdReelSpec as unknown as MontageSpec} />;
const KhalaSalahRComp: React.FC = () => <MontageFromSpec spec={khalaSalahReelSpec as unknown as MontageSpec} />;
const MawtiAqsamRComp: React.FC = () => <MontageFromSpec spec={mawtiAqsamReelSpec as unknown as MontageSpec} />;

import streamArshFakhSpec from "../data/specs/stream_arsh_fakh_reel.json";
import streamJulaniTakfirSpec from "../data/specs/stream_julani_takfir_reel.json";
import streamMayyitIlmSpec from "../data/specs/stream_mayyit_ilm_reel.json";
const StreamArshFakhRComp: React.FC = () => <MontageFromSpec spec={streamArshFakhSpec as unknown as MontageSpec} />;
const StreamJulaniTakfirRComp: React.FC = () => <MontageFromSpec spec={streamJulaniTakfirSpec as unknown as MontageSpec} />;
const StreamMayyitIlmRComp: React.FC = () => <MontageFromSpec spec={streamMayyitIlmSpec as unknown as MontageSpec} />;

import streamIfkSalulSpec from "../data/specs/stream_ifk_salul_reel.json";
import streamSifatSam3Spec from "../data/specs/stream_sifat_sam3_reel.json";
import streamImanMakhluqSpec from "../data/specs/stream_iman_makhluq_reel.json";
const StreamIfkSalulRComp: React.FC = () => <MontageFromSpec spec={streamIfkSalulSpec as unknown as MontageSpec} />;
const StreamSifatSam3RComp: React.FC = () => <MontageFromSpec spec={streamSifatSam3Spec as unknown as MontageSpec} />;
const StreamImanMakhluqRComp: React.FC = () => <MontageFromSpec spec={streamImanMakhluqSpec as unknown as MontageSpec} />;

import abdulAmericaSpec from "../data/specs/abdul_america.json";
const AbdulAmericaComp: React.FC = () => <MontageFromSpec spec={abdulAmericaSpec as unknown as MontageSpec} />;

import tawafNawawiSpec from "../data/specs/tawaf_nawawi.json";
const TawafNawawiComp: React.FC = () => <MontageFromSpec spec={tawafNawawiSpec as unknown as MontageSpec} />;

import s2AshariKalbSpec from "../data/specs/s2_ashari_kalb_reel.json";
import s2AshariTiflaSpec from "../data/specs/s2_ashari_tifla_reel.json";
import s2QuburiSahabaSpec from "../data/specs/s2_quburi_sahaba_reel.json";
import s2ShiaIstislamSpec from "../data/specs/s2_shia_istislam_reel.json";

const S2AshariKalbComp: React.FC = () => <MontageFromSpec spec={s2AshariKalbSpec as unknown as MontageSpec} />;
const S2AshariTiflaComp: React.FC = () => <MontageFromSpec spec={s2AshariTiflaSpec as unknown as MontageSpec} />;
const S2QuburiSahabaComp: React.FC = () => <MontageFromSpec spec={s2QuburiSahabaSpec as unknown as MontageSpec} />;
const S2ShiaIstislamComp: React.FC = () => <MontageFromSpec spec={s2ShiaIstislamSpec as unknown as MontageSpec} />;

import { Clip4ThronePortrait, CLIP4_FRAMES, CLIP4_FPS } from "./Clip4ThronePortrait";
import { ShiaHandDebate, SHIA_HAND_FPS, SHIA_HAND_TOTAL_FRAMES } from "./ShiaHandDebate";
import { PoisonComps } from "./PoisonComps";
import { ReelsComps } from "./ReelsComps";

export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>
      {/* بث للحوار مع المخالفين (2) - 4 ريلز إحراج وقصف جبهات */}
      <Composition id="S2-Ashari-Kalb-R" component={S2AshariKalbComp} durationInFrames={s2AshariKalbSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="S2-Ashari-Tifla-R" component={S2AshariTiflaComp} durationInFrames={s2AshariTiflaSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="S2-Quburi-Sahaba-R" component={S2QuburiSahabaComp} durationInFrames={s2QuburiSahabaSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="S2-Shia-Istislam-R" component={S2ShiaIstislamComp} durationInFrames={s2ShiaIstislamSpec.frames} fps={30} width={1080} height={1920} />
      {/* عبدول السيد وأمريكا (عرضي + طولي كامل) */}
      <Composition id="Abdul-America" component={AbdulAmericaComp} durationInFrames={abdulAmericaSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Abdul-America-L" component={AbdulAmericaComp} durationInFrames={abdulAmericaSpec.frames} fps={30} width={1920} height={1080} />
      {/* لماذا يطوفون حول قبر النووي؟ (عرضي + طولي كامل) */}
      <Composition id="Tawaf-Nawawi" component={TawafNawawiComp} durationInFrames={tawafNawawiSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Tawaf-Nawawi-L" component={TawafNawawiComp} durationInFrames={tawafNawawiSpec.frames} fps={30} width={1920} height={1080} />
      {/* مقاطع إحراج وتناقضات الخصوم من بث للحوار مع المخالفين */}
      <Composition id="Stream-Ifk-Salul-R" component={StreamIfkSalulRComp} durationInFrames={streamIfkSalulSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Stream-Sifat-Sam3-R" component={StreamSifatSam3RComp} durationInFrames={streamSifatSam3Spec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Stream-Iman-Makhluq-R" component={StreamImanMakhluqRComp} durationInFrames={streamImanMakhluqSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Stream-Arsh-Fakh-R"component={StreamArshFakhRComp} durationInFrames={streamArshFakhSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Stream-Julani-Takfir-R" component={StreamJulaniTakfirRComp} durationInFrames={streamJulaniTakfirSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Stream-Mayyit-Ilm-R" component={StreamMayyitIlmRComp} durationInFrames={streamMayyitIlmSpec.frames} fps={30} width={1080} height={1920} />

      <Composition id="ShiaHandDebate" component={ShiaHandDebate} durationInFrames={SHIA_HAND_TOTAL_FRAMES} fps={SHIA_HAND_FPS} width={1080} height={1920} />
      <Composition id="FamilyStickCast" component={FamilyStickCast} durationInFrames={180} fps={30} width={1080} height={1920} />
      <Composition id="DodoFamilyCast" component={DodoFamilyCast} durationInFrames={180} fps={30} width={1080} height={1920} />

      {/* ACTIVE project(s): Livestream Debate Shorts */}
      <Composition id="Clip4ThronePortrait" component={Clip4ThronePortrait} durationInFrames={CLIP4_FRAMES} fps={CLIP4_FPS} width={1080} height={1920} />

      <Composition id="BidahCartoon" component={BidahCartoon} durationInFrames={BIDAH_TOTAL_FRAMES} fps={BIDAH_FPS} width={1080} height={1920} />

      {/* دروس شرح جامع الترمذي - المجلس 30 */}
      <Composition id="Wars-Kalaf-R" component={WarsKalafRComp} durationInFrames={warsKalafReelSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Tawaf-Nisa-R" component={TawafNisaRComp} durationInFrames={tawafNisaReelSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Wudu-Awd-R" component={WuduAwdRComp} durationInFrames={wuduAwdReelSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Khala-Salah-R" component={KhalaSalahRComp} durationInFrames={khalaSalahReelSpec.frames} fps={30} width={1080} height={1920} />
      <Composition id="Mawti-Aqsam-R" component={MawtiAqsamRComp} durationInFrames={mawtiAqsamReelSpec.frames} fps={30} width={1080} height={1920} />

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
      <PoisonComps />
      <ReelsComps />
      <Folder name="tools">
      </Folder>
      <Archive />
    </ByRecency>
  );
};
