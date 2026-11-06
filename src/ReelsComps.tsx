import React from "react";
import { Composition, Folder } from "remotion";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import injilSpec from "../data/specs/InjilSufi.json";
import ahlaSpec from "../data/specs/AhlaShughl.json";

/** Reels built from data specs; registered here (not in Root.tsx) so a clean-up of Root cannot drop them. Add a reel = import + one line. */
const InjilSufiVideo: React.FC = () => <MontageFromSpec spec={injilSpec as unknown as MontageSpec} />;
const AhlaShughlVideo: React.FC = () => <MontageFromSpec spec={ahlaSpec as unknown as MontageSpec} />;

export const ReelsComps: React.FC = () => (
  <Folder name="Reels">
    <Composition id="InjilSufi" component={InjilSufiVideo} durationInFrames={injilSpec.frames} fps={30} width={1080} height={1920} />
    <Composition id="AhlaShughl" component={AhlaShughlVideo} durationInFrames={ahlaSpec.frames} fps={30} width={1080} height={1920} />
  </Folder>
);
