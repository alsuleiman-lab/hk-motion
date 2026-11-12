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
import L_tirm31_wayhSpec from "../data/specs/tirm31_wayh.json";
const L_tirm31_wayhComp: React.FC = () => <MontageFromSpec spec={L_tirm31_wayhSpec as unknown as MontageSpec} />;
import L_tirm31_tayammumSpec from "../data/specs/tirm31_tayammum.json";
const L_tirm31_tayammumComp: React.FC = () => <MontageFromSpec spec={L_tirm31_tayammumSpec as unknown as MontageSpec} />;
import L_tirm31_sayrafiSpec from "../data/specs/tirm31_sayrafi.json";
const L_tirm31_sayrafiComp: React.FC = () => <MontageFromSpec spec={L_tirm31_sayrafiSpec as unknown as MontageSpec} />;
import saintRambalSpec from "../data/specs/saint_rambal.json";
const SaintRambalComp: React.FC = () => <MontageFromSpec spec={saintRambalSpec as unknown as MontageSpec} />;
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
      <Folder name="الدروس">
        <Composition id="Tirm31-Sayrafi" component={L_tirm31_sayrafiComp} durationInFrames={L_tirm31_sayrafiSpec.frames} fps={30} width={1080} height={1920} />
        <Composition id="Tirm31-Tayammum" component={L_tirm31_tayammumComp} durationInFrames={L_tirm31_tayammumSpec.frames} fps={30} width={1080} height={1920} />
        <Composition id="Tirm31-Wayh" component={L_tirm31_wayhComp} durationInFrames={L_tirm31_wayhSpec.frames} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="البثوث">
        {/* بث للحوار مع المخالفين (1) */}
        <Composition id="Stream-Arsh-Fakh-R"component={StreamArshFakhRComp} durationInFrames={streamArshFakhSpec.frames} fps={30} width={1080} height={1920} />
        <Composition id="Stream-Mayyit-Ilm-R" component={StreamMayyitIlmRComp} durationInFrames={streamMayyitIlmSpec.frames} fps={30} width={1080} height={1920} />
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
