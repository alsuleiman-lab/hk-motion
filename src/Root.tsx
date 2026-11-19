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
import { ExtDemo, EXT_DEMO_FRAMES } from "./ext/ExtDemo";
import { PaperSteps, PAPER_STEPS_FRAMES } from "./ext/PaperSteps";
import { CaseFile, CASE_FILE_FRAMES } from "./ext/CaseFile";
import { FontSpecimen, FONT_SPECIMEN_FRAMES } from "./ext/FontSpecimen";
import { KineticType, KINETIC_TYPE_FRAMES, KineticOver, KineticSplit, KINETIC_SPLIT_FRAMES } from "./ext/KineticType";
import { CineWords, CINE_WORDS_FRAMES } from "./ext/CineWords";
import { JordanDetain, JORDAN_FRAMES } from "./JordanDetain";
import { DubKmr, DubCkb, DUBKMR_FRAMES } from "./DubKmr";
import { DubKmrBoard, DubCkbPanels } from "./DubShots";
import { TimelineDemo, TIMELINE_DEMO_FRAMES } from "./TimelineDemo";

import { KhAlphaTrial, ALPHATRIAL_FRAMES } from "./KhAlphaTrial";
import { HybridGrad, HybridGradP135, HybridGradP160, HybridStar, HybridVig } from "./hybrid/HybridAssets";


// archive is required lazily: importing it runs every old project's module code (some download fonts), which slowed every render
const Archive: React.FC = SHOW_ARCHIVE ? // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("./ArchiveComps") as { ArchiveComps: React.FC }).ArchiveComps : () => null;


import { MontageFromSpec, specFrames } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import debateMosesReelSpec from "../data/specs/debate-moses-reel.json";
const DebateMosesReelComp: React.FC = () => <MontageFromSpec spec={debateMosesReelSpec as unknown as MontageSpec} />;
import c2598ReelSpec from "../data/specs/c2598-reel.json";
const C2598ReelComp: React.FC = () => <MontageFromSpec spec={c2598ReelSpec as unknown as MontageSpec} />;
import c2598Spec from "../data/specs/c2598.json";
const C2598Comp: React.FC = () => <MontageFromSpec spec={c2598Spec as unknown as MontageSpec} />;
import tirmidhi325Spec from "../data/specs/tirmidhi32_5.json";
const Tirmidhi325Comp: React.FC = () => <MontageFromSpec spec={tirmidhi325Spec as unknown as MontageSpec} />;
import tirmidhi324Spec from "../data/specs/tirmidhi32_4.json";
const Tirmidhi324Comp: React.FC = () => <MontageFromSpec spec={tirmidhi324Spec as unknown as MontageSpec} />;
import tirmidhi323Spec from "../data/specs/tirmidhi32_3.json";
const Tirmidhi323Comp: React.FC = () => <MontageFromSpec spec={tirmidhi323Spec as unknown as MontageSpec} />;
import tirmidhi322Spec from "../data/specs/tirmidhi32_2.json";
const Tirmidhi322Comp: React.FC = () => <MontageFromSpec spec={tirmidhi322Spec as unknown as MontageSpec} />;
import tirmidhi321Spec from "../data/specs/tirmidhi32_1.json";
const Tirmidhi321Comp: React.FC = () => <MontageFromSpec spec={tirmidhi321Spec as unknown as MontageSpec} />;
import debateEpSpec from "../data/specs/debate-ep.json";
const DebateEpComp: React.FC = () => <MontageFromSpec spec={debateEpSpec as unknown as MontageSpec} />;
const DebateEpBothVComp: React.FC = () => <MontageBoth spec={debateEpSpec as unknown as MontageSpec} phone />;
const DebateEpBothComp: React.FC = () => <MontageBoth spec={debateEpSpec as unknown as MontageSpec} />;
import urwaReelSpec from "../data/specs/urwa-reel.json";
const UrwaReelComp: React.FC = () => <MontageFromSpec spec={urwaReelSpec as unknown as MontageSpec} />;
import anchorKillsChildrenReelSpec from "../data/specs/anchor-kills-children-reel.json";
const AnchorKillsChildrenReelComp: React.FC = () => <MontageFromSpec spec={anchorKillsChildrenReelSpec as unknown as MontageSpec} />;
import anchorKillsChildrenSpec from "../data/specs/anchor-kills-children.json";
const AnchorKillsChildrenComp: React.FC = () => <MontageFromSpec spec={anchorKillsChildrenSpec as unknown as MontageSpec} />;
import { MontageBoth, BOTH, BOTHV } from "./MontageBoth";









import { ReelsComps } from "./ReelsComps";




export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>

      <Folder name="مونتاج الجلسة">
        <Composition id="C2598-L" component={C2598Comp} durationInFrames={specFrames(c2598Spec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
        <Composition id="Debate-Ep-L" component={DebateEpComp} durationInFrames={specFrames(debateEpSpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
        <Composition id="Debate-Ep" component={DebateEpComp} durationInFrames={specFrames(debateEpSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Debate-Ep-Both" component={DebateEpBothComp} durationInFrames={specFrames(debateEpSpec as unknown as MontageSpec)} fps={30} width={BOTH.W} height={BOTH.H} />
        <Composition id="Debate-Ep-BothV" component={DebateEpBothVComp} durationInFrames={specFrames(debateEpSpec as unknown as MontageSpec)} fps={30} width={BOTHV.W} height={BOTHV.H} />
        <Composition id="Urwa-Reel" component={UrwaReelComp} durationInFrames={specFrames(urwaReelSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Anchor-Kills-Children-L" component={AnchorKillsChildrenComp} durationInFrames={specFrames(anchorKillsChildrenSpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
      </Folder>
      <Folder name="البثوث">
        <Composition id="Tirmidhi325" component={Tirmidhi325Comp} durationInFrames={specFrames(tirmidhi325Spec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Tirmidhi324" component={Tirmidhi324Comp} durationInFrames={specFrames(tirmidhi324Spec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Tirmidhi323" component={Tirmidhi323Comp} durationInFrames={specFrames(tirmidhi323Spec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Tirmidhi322" component={Tirmidhi322Comp} durationInFrames={specFrames(tirmidhi322Spec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Tirmidhi321" component={Tirmidhi321Comp} durationInFrames={specFrames(tirmidhi321Spec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        {/* بث للحوار مع المخالفين (1) */}
      </Folder>
      <Folder name="ريلز">
        <Composition id="Debate-Moses-Reel" component={DebateMosesReelComp} durationInFrames={specFrames(debateMosesReelSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="C2598-Reel" component={C2598ReelComp} durationInFrames={specFrames(c2598ReelSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Tirmidhi322-L" component={Tirmidhi322Comp} durationInFrames={specFrames(tirmidhi322Spec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Anchor-Kills-Children-Reel" component={AnchorKillsChildrenReelComp} durationInFrames={specFrames(anchorKillsChildrenReelSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
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
      </Folder>}
      <Folder name="موشن توضيحي مستقل (مرجعي)">
        <Composition id="Ext-Demo" component={ExtDemo} durationInFrames={EXT_DEMO_FRAMES} fps={30} width={1920} height={1080} />
        <Composition id="Ref-PaperSteps" component={PaperSteps} durationInFrames={PAPER_STEPS_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ palette: "warm" as const }} />
        <Composition id="Ref-CaseFile" component={CaseFile} durationInFrames={CASE_FILE_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-Fonts" component={FontSpecimen} durationInFrames={FONT_SPECIMEN_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-KineticType" component={KineticType} durationInFrames={KINETIC_TYPE_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-KineticOver" component={KineticOver} durationInFrames={KINETIC_TYPE_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-KineticSplit" component={KineticSplit} durationInFrames={KINETIC_SPLIT_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-CineWords" component={CineWords} durationInFrames={CINE_WORDS_FRAMES} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="موشن توضيحي مستقل">
        <Composition id="Jordan-Detain" component={JordanDetain} durationInFrames={JORDAN_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Kmr-Hasad" component={DubKmr} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Ckb-Hasad" component={DubCkb} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Kmr-Board" component={DubKmrBoard} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Ckb-Panels" component={DubCkbPanels} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
      </Folder>
      <ReelsComps />
      <Folder name="أدوات">
      </Folder>
      <Archive />
    </ByRecency>
  );
};
