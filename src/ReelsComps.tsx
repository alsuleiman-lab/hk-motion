import React from "react";
import { Folder } from "remotion";
import { MuftiIraqComps } from "./MuftiIraqComps";

/** Reels built from data specs; registered here (not in Root.tsx) so a clean-up of Root cannot drop them. Add a reel = import + one line. */
export const ReelsComps: React.FC = () => (
  <Folder name="Reels">
    <MuftiIraqComps />
  </Folder>
);
