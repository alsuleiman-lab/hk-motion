import React from "react";
import { AshariSilent, calculateAshariMetadata } from "./AshariSilent";
import { AbsoluteFill, Composition, Folder } from "remotion";
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

import streamArshFakhSpec from "../data/specs/stream_arsh_fakh_reel.json";
import streamMayyitIlmSpec from "../data/specs/stream_mayyit_ilm_reel.json";
import rabbiShiaSpec from "../data/specs/rabbi_shia.json";
import idlibImamSpec from "../data/specs/idlib_imam.json";
type FilterSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  temperature: number;
  tint: number;
  shadowLift: number;
  highlightRollOff: number;
  warmth: number;
  vignette: number;
  glow: number;
};

const NEUTRAL_FILTER: FilterSettings = { brightness: 100, contrast: 100, saturation: 100, sepia: 0, temperature: 0, tint: 0, shadowLift: 0, highlightRollOff: 0, warmth: 0, vignette: 0, glow: 0 };

const IdlibImamComp: React.FC<{ Filter: Partial<FilterSettings> }> = ({ Filter }) => {
  const grade = { ...NEUTRAL_FILTER, ...Filter };
  const temperature = grade.temperature / 100;
  const tint = grade.tint / 100;
  const colorMatrix = [
    1 + temperature * 0.12 + tint * 0.035, 0, 0, 0, 0,
    0, 1 + temperature * 0.015 - tint * 0.07, 0, 0, 0,
    0, 0, 1 - temperature * 0.14 + tint * 0.035, 0, 0,
    0, 0, 0, 1, 0,
  ].join(" ");
  const toneCurve = Array.from({ length: 33 }, (_, i) => {
    const value = i / 32;
    const lifted = value + (grade.shadowLift / 100) * 0.14 * (1 - value) ** 3;
    const highlightAmount = Math.max(0, (value - 0.55) / 0.45);
    const rolled = lifted - (grade.highlightRollOff / 100) * 0.2 * highlightAmount ** 2;
    return Math.max(0, Math.min(1, rolled)).toFixed(4);
  }).join(" ");
  return (
  <>
  <FilterCurrentValue settings={grade} />
  <AbsoluteFill style={{ backgroundColor: "#17100d" }}>
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="idlib-imam-color-grade" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={colorMatrix} />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={toneCurve} />
            <feFuncG type="table" tableValues={toneCurve} />
            <feFuncB type="table" tableValues={toneCurve} />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
    <AbsoluteFill
      style={{
        filter: [
          "url(#idlib-imam-color-grade)",
          `brightness(${grade.brightness / 100})`,
          `contrast(${grade.contrast / 100})`,
          `saturate(${grade.saturation / 100})`,
          `sepia(${grade.sepia / 100})`,
        ].join(" "),
      }}
    >
      <MontageFromSpec spec={idlibImamSpec as unknown as MontageSpec} />
    </AbsoluteFill>
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: "linear-gradient(110deg, rgba(176,92,42,0.52), transparent 68%)",
        opacity: grade.warmth / 100,
      }}
    />
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 38%, rgba(12,7,4,0.72) 100%)",
        opacity: grade.vignette / 100,
      }}
    />
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: "radial-gradient(ellipse at 22% 18%, rgba(255,206,140,0.58), transparent 42%)",
        opacity: grade.glow / 100,
        mixBlendMode: "screen",
      }}
    />
  </AbsoluteFill>
  </>
  );
};

const FilterCurrentValue: React.FC<{ settings: FilterSettings }> = ({ settings }) => {
  if (typeof window !== "undefined") {
    (window as unknown as { __remotionFilterCurrent?: FilterSettings }).__remotionFilterCurrent = settings;
  }
  return null;
};
const RabbiShiaComp: React.FC = () => <MontageFromSpec spec={rabbiShiaSpec as unknown as MontageSpec} />;
const StreamArshFakhRComp: React.FC = () => <MontageFromSpec spec={streamArshFakhSpec as unknown as MontageSpec} />;
const StreamMayyitIlmRComp: React.FC = () => <MontageFromSpec spec={streamMayyitIlmSpec as unknown as MontageSpec} />;





import { ReelsComps } from "./ReelsComps";
import { FeastMix, FEAST_FRAMES } from "./FeastMix";
import { Tk10Montage, TK10_FRAMES } from "./Tk10Montage";

import { GovFilm, GOV_SECONDS } from "./GovFilm";
import { MosqueFilm, MOSQUE_SECONDS } from "./MosqueFilm";

export const RemotionRoot: React.FC = () => {
  return (
    <ByRecency>

      <Folder name="مونتاج الجلسة">
        <Composition id="Silent-Ashari-Portrait" component={AshariSilent} durationInFrames={640} fps={30} width={1080} height={1920} calculateMetadata={calculateAshariMetadata} defaultProps={{ name: "ashari-takfir-25", orient: "portrait" }} />
      <Composition id="FeastMix" component={FeastMix} durationInFrames={FEAST_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Tk10Montage" component={Tk10Montage} durationInFrames={TK10_FRAMES} fps={30} width={1080} height={1920} />
        <Composition id="Idlib-Imam" component={IdlibImamComp} durationInFrames={specFrames(idlibImamSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} defaultProps={{
          Filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            sepia: 0,
            temperature: 0,
            tint: 0,
            shadowLift: 0,
            highlightRollOff: 0,
            warmth: 0,
            vignette: 0,
            glow: 0,
          },
        }} />
        <Composition id="Idlib-Imam-L" component={IdlibImamComp} durationInFrames={specFrames(idlibImamSpec as unknown as MontageSpec)} fps={30} width={1920} height={1080} defaultProps={{
          Filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            sepia: 0,
            temperature: 0,
            tint: 0,
            shadowLift: 0,
            highlightRollOff: 0,
            warmth: 0,
            vignette: 0,
            glow: 0,
          },
        }} />
      </Folder>
      <Folder name="كرتون الجلسة">
        <Composition id="Dodo-Gov" component={GovFilm} durationInFrames={Math.round(GOV_SECONDS * 30)} fps={30} width={1080} height={1920} />
        <Composition id="Stick-Mosque" component={MosqueFilm} durationInFrames={Math.round(MOSQUE_SECONDS * 30)} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="البثوث">
        {/* بث للحوار مع المخالفين (1) */}
        <Composition id="Stream-Arsh-Fakh-R"component={StreamArshFakhRComp} durationInFrames={specFrames(streamArshFakhSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
        <Composition id="Stream-Mayyit-Ilm-R" component={StreamMayyitIlmRComp} durationInFrames={specFrames(streamMayyitIlmSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="ريلز">
        <Composition id="Rabbi-Shia" component={RabbiShiaComp} durationInFrames={specFrames(rabbiShiaSpec as unknown as MontageSpec)} fps={30} width={1080} height={1920} />
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
