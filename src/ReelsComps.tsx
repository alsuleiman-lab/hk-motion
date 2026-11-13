import React from "react";
import { Folder, Composition } from "remotion";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec } from "./MontageSpec";
import dafeSpec from "../data/specs/dafe_hasad.json";

const DafeVideo: React.FC = () => <MontageFromSpec spec={dafeSpec as unknown as MontageSpec} />;

/** Reels built from data specs; registered here (not in Root.tsx) so a clean-up of Root cannot drop them. Add a reel = import + one line. */
export const ReelsComps: React.FC = () => (
  <Folder name="Reels">
    <Composition id="Dafe-Hasad" component={DafeVideo} durationInFrames={dafeSpec.frames} fps={30} width={1080} height={1920} />
  </Folder>
);
