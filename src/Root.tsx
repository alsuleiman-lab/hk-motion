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

import { KhAlphaTrial, ALPHATRIAL_FRAMES } from "./KhAlphaTrial";
import { HybridGrad, HybridGradP135, HybridGradP160, HybridStar, HybridVig } from "./hybrid/HybridAssets";


// archive is required lazily: importing it runs every old project's module code (some download fonts), which slowed every render
const Archive: React.FC = SHOW_ARCHIVE ? // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require("./ArchiveComps") as { ArchiveComps: React.FC }).ArchiveComps : () => null;


import { MontageFromSpec, specFrames } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import muftiHirabaSpec from "../data/specs/mufti-hiraba.json";
const MuftiHirabaComp: React.FC = () => <MontageFromSpec spec={muftiHirabaSpec as unknown as MontageSpec} />;
const MuftiHirabaBothVComp: React.FC = () => <MontageBoth spec={muftiHirabaSpec as unknown as MontageSpec} phone />;
const MuftiHirabaBothComp: React.FC = () => <MontageBoth spec={muftiHirabaSpec as unknown as MontageSpec} />;
import hadraKhatibSpec from "../data/specs/hadra-khatib.json";
const HadraKhatibComp: React.FC = () => <MontageFromSpec spec={hadraKhatibSpec as unknown as MontageSpec} />;
const HadraKhatibBothComp: React.FC = () => <MontageBoth spec={hadraKhatibSpec as unknown as MontageSpec} />;
import { MontageBoth, BOTH, BOTHV } from "./MontageBoth";

import streamArshFakhSpec from "../data/specs/stream_arsh_fakh_reel.json";
import streamMayyitIlmSpec from "../data/specs/stream_mayyit_ilm_reel.json";
import rabbiShiaSpec from "../data/specs/rabbi_shia.json";
import individualReligiositySpec from "../data/specs/individual-religiosity.json";
const IndividualReligiosityLComp: React.FC = () => <MontageFromSpec spec={individualReligiositySpec as unknown as MontageSpec} />;
const IndividualReligiosityBothComp: React.FC = () => <MontageBoth spec={individualReligiositySpec as unknown as MontageSpec} />;
import sufiBaathSpec from "../data/specs/sufi-baath.json";
const SufiBaathComp: React.FC = () => <MontageFromSpec spec={sufiBaathSpec as unknown as MontageSpec} />;
const SufiBaathBothVComp: React.FC = () => <MontageBoth spec={sufiBaathSpec as unknown as MontageSpec} phone />;
const SufiBaathBothComp: React.FC = () => <MontageBoth spec={sufiBaathSpec as unknown as MontageSpec} />;
import ahmedAbdoMaherSpec from "../data/specs/ahmed-abdo-maher.json";
const AhmedAbdoMaherComp: React.FC = () => <MontageFromSpec spec={ahmedAbdoMaherSpec as unknown as MontageSpec} />;
const AhmedAbdoMaherBothComp: React.FC = () => <MontageBoth spec={ahmedAbdoMaherSpec as unknown as MontageSpec} />;
import individualReligiosityReelSpec from "../data/specs/individual-religiosity-reel.json";
const IndividualReligiosityReelComp: React.FC = () => <MontageFromSpec spec={individualReligiosityReelSpec as unknown as MontageSpec} />;



const RabbiShiaComp: React.FC = () => <MontageFromSpec spec={rabbiShiaSpec as unknown as MontageSpec} />;
const StreamArshFakhRComp: React.FC = () => <MontageFromSpec spec={streamArshFakhSpec as unknown as MontageSpec} />;
const StreamMayyitIlmRComp: React.FC = () => <MontageFromSpec spec={streamMayyitIlmSpec as unknown as MontageSpec} />;





import { ReelsComps } from "./ReelsComps";




export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>

      <Folder name="مونتاج الجلسة">
        <Composition id="Mufti-Hiraba" component={MuftiHirabaComp} durationInFrames={specFrames(muftiHirabaSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Mufti-Hiraba-L" component={MuftiHirabaComp} durationInFrames={specFrames(muftiHirabaSpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
        <Composition id="Mufti-Hiraba-Both" component={MuftiHirabaBothComp} durationInFrames={specFrames(muftiHirabaSpec as unknown as MontageSpec)} fps={30} width={BOTH.W} height={BOTH.H} />
        <Composition id="Mufti-Hiraba-BothV" component={MuftiHirabaBothVComp} durationInFrames={specFrames(muftiHirabaSpec as unknown as MontageSpec)} fps={30} width={BOTHV.W} height={BOTHV.H} />
        <Composition id="Hadra-Khatib" component={HadraKhatibComp} durationInFrames={specFrames(hadraKhatibSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Hadra-Khatib-L" component={HadraKhatibComp} durationInFrames={specFrames(hadraKhatibSpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
        <Composition id="Hadra-Khatib-Both" component={HadraKhatibBothComp} durationInFrames={specFrames(hadraKhatibSpec as unknown as MontageSpec)} fps={30} width={BOTH.W} height={BOTH.H} />
        <Composition id="Sufi-Baath" component={SufiBaathComp} durationInFrames={specFrames(sufiBaathSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Sufi-Baath-L" component={SufiBaathComp} durationInFrames={specFrames(sufiBaathSpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
        <Composition id="Sufi-Baath-Both" component={SufiBaathBothComp} durationInFrames={specFrames(sufiBaathSpec as unknown as MontageSpec)} fps={30} width={BOTH.W} height={BOTH.H} />
        <Composition id="Sufi-Baath-BothV" component={SufiBaathBothVComp} durationInFrames={specFrames(sufiBaathSpec as unknown as MontageSpec)} fps={30} width={BOTHV.W} height={BOTHV.H} />
        <Composition id="Ahmed-Abdo-Maher" component={AhmedAbdoMaherComp} durationInFrames={specFrames(ahmedAbdoMaherSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Ahmed-Abdo-Maher-L" component={AhmedAbdoMaherComp} durationInFrames={specFrames(ahmedAbdoMaherSpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
        <Composition id="Ahmed-Abdo-Maher-Both" component={AhmedAbdoMaherBothComp} durationInFrames={specFrames(ahmedAbdoMaherSpec as unknown as MontageSpec)} fps={30} width={BOTH.W} height={BOTH.H} />
        <Composition id="Individual-Religiosity-L" component={IndividualReligiosityLComp} durationInFrames={specFrames(individualReligiositySpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} />
        <Composition id="Individual-Religiosity-Both" component={IndividualReligiosityBothComp} durationInFrames={specFrames(individualReligiositySpec as unknown as MontageSpec)} fps={30} width={BOTH.W} height={BOTH.H} />
        <Composition id="Individual-Religiosity" component={IndividualReligiosityLComp} durationInFrames={specFrames(individualReligiositySpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="البثوث">
        {/* بث للحوار مع المخالفين (1) */}
        <Composition id="Stream-Arsh-Fakh-R"component={StreamArshFakhRComp} durationInFrames={specFrames(streamArshFakhSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Stream-Mayyit-Ilm-R" component={StreamMayyitIlmRComp} durationInFrames={specFrames(streamMayyitIlmSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="ريلز">
        <Composition id="Individual-Religiosity-Reel" component={IndividualReligiosityReelComp} durationInFrames={specFrames(individualReligiosityReelSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Rabbi-Shia"component={RabbiShiaComp} durationInFrames={specFrames(rabbiShiaSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
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
      <ReelsComps />
      <Folder name="أدوات">
      </Folder>
      <Archive />
    </ByRecency>
  );
};
