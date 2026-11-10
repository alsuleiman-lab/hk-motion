import React from "react";
import { Folder, Composition } from "remotion";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import jafriSpec from "../data/specs/jafri_raqs.json";
import englishSpec from "../data/specs/english_proverb.json";
import atfalSpec from "../data/specs/atfaluhum_rijal.json";
import azkaSpec from "../data/specs/azka_ashari.json";
import qissSpec from "../data/specs/qiss_mashlula.json";
import { MuftiIraqComps } from "./MuftiIraqComps";

const mk = (s: unknown): React.FC => () => <MontageFromSpec spec={s as MontageSpec} />;
const JafriVideo = mk(jafriSpec), EnglishVideo = mk(englishSpec), AtfalVideo = mk(atfalSpec), AzkaVideo = mk(azkaSpec), QissVideo = mk(qissSpec);
/** Reels built from data specs; registered here (not in Root.tsx) so a clean-up of Root cannot drop them. Add a reel = import + one line. */
export const ReelsComps: React.FC = () => (
  <Folder name="Reels">
    <MuftiIraqComps />
    <Composition id="Jafri-Raqs" component={JafriVideo} durationInFrames={jafriSpec.frames} fps={30} width={1080} height={1920} />
    <Composition id="English-Proverb" component={EnglishVideo} durationInFrames={englishSpec.frames} fps={30} width={1080} height={1920} />
    <Composition id="Atfaluhum-Rijal" component={AtfalVideo} durationInFrames={atfalSpec.frames} fps={30} width={1080} height={1920} />
    <Composition id="Azka-Ashari" component={AzkaVideo} durationInFrames={azkaSpec.frames} fps={30} width={1080} height={1920} />
    <Composition id="Qiss-Mashlula" component={QissVideo} durationInFrames={qissSpec.frames} fps={30} width={1080} height={1920} />
  </Folder>
);
