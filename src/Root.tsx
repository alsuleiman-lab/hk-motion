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
import { ActiveSpeaker, ACTIVE_FRAMES } from "./ext/ActiveSpeaker";
import { CineSpeaker, CINE_SPEAKER_FRAMES } from "./ext/CineKit";
import { StepsTemplate, STEPS_FRAMES } from "./ext/StepsKit";
import { SheikhCast, SHEIKH_CAST_FRAMES } from "./ext/SheikhCast";
import { BoardTemplate, BOARD_FRAMES } from "./ext/BoardKit";
import { CineWords, CINE_WORDS_FRAMES } from "./ext/CineWords";
import { AnimeScene, ANIME_FRAMES, ANIME_FPS } from "./ext/AnimeScene";
import { KeyArt1, KEY1_W, KEY1_H } from "./ext/KeyArt1";
import { KeyArt2, KEY2_W, KEY2_H } from "./ext/KeyArt2";
import { JordanDetain, JORDAN_FRAMES } from "./JordanDetain";
import { DubKmr, DubCkb, DUBKMR_FRAMES } from "./DubKmr";
import { DubKmrBoard, DubCkbPanels } from "./DubShots";
import { DubKmrBoard2, DUBKMR_BOARD2_FRAMES } from "./DubBoard";
import { DubKmrSync, DUBKMR_SYNC_FRAMES } from "./DubSync";
import { TimelineDemo, TIMELINE_DEMO_FRAMES } from "./TimelineDemo";

import { KhAlphaTrial, ALPHATRIAL_FRAMES } from "./KhAlphaTrial";
import { HybridGrad, HybridGradP135, HybridGradP160, HybridStar, HybridVig } from "./hybrid/HybridAssets";


// archive is required lazily: importing it runs every old project's module code (some download fonts), which slowed every render
const Archive: React.FC = SHOW_ARCHIVE ? // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("./ArchiveComps") as { ArchiveComps: React.FC }).ArchiveComps : () => null;


/* every montage spec (data/specs/*.json) registers itself — طولي، عرضي، الاثنان معاً، وللجوال (src/SpecComps.tsx): no spec is imported here by name any more,
   so adding or deleting a spec never needs this file (2026-11-20) */
import { SpecComps } from "./SpecComps";









import { ReelsComps } from "./ReelsComps";




export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>

      <Folder name="مونتاج الجلسة">
        <SpecComps kind="full" />
      </Folder>
      <Folder name="البثوث">
        {/* بث للحوار مع المخالفين (1) */}
      </Folder>
      <Folder name="ريلز">
        <SpecComps kind="reel" />
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
        <Composition id="Ref-ActiveSpeaker" component={ActiveSpeaker} durationInFrames={ACTIVE_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-CineSpeaker" component={CineSpeaker} durationInFrames={CINE_SPEAKER_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-SheikhCast" component={SheikhCast} durationInFrames={SHEIKH_CAST_FRAMES} fps={30} width={1080} height={1080} />
        <Composition id="Ref-StepsTemplate" component={StepsTemplate} durationInFrames={STEPS_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-BoardTemplate" component={BoardTemplate} durationInFrames={BOARD_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-CineWords" component={CineWords} durationInFrames={CINE_WORDS_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Ref-AnimeScene" component={AnimeScene} durationInFrames={ANIME_FRAMES} fps={ANIME_FPS} width={1920} height={1080} />
        <Composition id="Ref-KeyArt1" component={KeyArt1} durationInFrames={1} fps={24} width={KEY1_W} height={KEY1_H} />
        <Composition id="Ref-KeyArt2" component={KeyArt2} durationInFrames={2} fps={24} width={KEY2_W} height={KEY2_H} />
      </Folder>
      <Folder name="موشن توضيحي مستقل">
        <Composition id="Jordan-Detain" component={JordanDetain} durationInFrames={JORDAN_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Kmr-Hasad" component={DubKmr} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Ckb-Hasad" component={DubCkb} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Kmr-Board" component={DubKmrBoard} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Ckb-Panels" component={DubCkbPanels} durationInFrames={DUBKMR_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Kmr-Board2" component={DubKmrBoard2} durationInFrames={DUBKMR_BOARD2_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Dub-Kmr-Sync" component={DubKmrSync} durationInFrames={DUBKMR_SYNC_FRAMES} fps={30} width={1080} height={1920} />
      </Folder>
      <ReelsComps />
      <Folder name="أدوات">
      </Folder>
      <Archive />
    </ByRecency>
  );
};
