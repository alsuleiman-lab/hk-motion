import React from "react";
import { Composition } from "remotion";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import muftiIraqSpec from "../data/specs/mufti_iraq.json";

/** «مفتي العراق: سني قبوري» (عرضي فقط) — registered here, not in Root.tsx (other sessions rewrite Root). */
const MuftiIraqVideo: React.FC = () => <MontageFromSpec spec={muftiIraqSpec as unknown as MontageSpec} />;

export const MuftiIraqComps: React.FC = () => (
  <Composition id="Mufti-Iraq-L" component={MuftiIraqVideo} durationInFrames={muftiIraqSpec.frames} fps={30} width={1920} height={1080} />
);
