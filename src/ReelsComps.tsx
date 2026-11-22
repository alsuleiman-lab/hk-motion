import React from "react";
import { Folder } from "remotion";
import { Composition } from "./SafeComposition";
import { DebateReel, DebateThumb } from "./DebateKit";
import r1 from "../data/debate/debate-r1.json";
import r2 from "../data/debate/debate-r2.json";
import r3 from "../data/debate/debate-r3.json";

/** Reels built from data specs; registered here (not in Root.tsx) so a clean-up of Root cannot drop them. Add a reel = import + one line.
 *  (2026-11-22, user order: folders by kind, one folder per project) Root.tsx mounts this INSIDE its «ريلز» folder, so each project here is one folder of its own: a new debate/reel project = a new <Folder name="<its title>"> here. */
export const ReelsComps: React.FC = () => (
  <Folder name="مناظرة نبوءات محمد ﷺ في كتب اليهود">
    <Composition id="DebateR1" component={DebateReel} width={1080} height={1920} fps={30} durationInFrames={r1.frames} defaultProps={r1} />
    <Composition id="DebateR2" component={DebateReel} width={1080} height={1920} fps={30} durationInFrames={r2.frames} defaultProps={r2} />
    <Composition id="DebateR3" component={DebateReel} width={1080} height={1920} fps={30} durationInFrames={r3.frames} defaultProps={r3} />
    <Composition id="DebateThumb" component={DebateThumb} width={1280} height={720} fps={30} durationInFrames={1} defaultProps={{ line1: "نبوءات محمد ﷺ", line2: "في كتب اليهود", tag: "مناظرة" }} />
  </Folder>
);
