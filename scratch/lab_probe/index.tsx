import React from "react";
import { registerRoot, Composition } from "remotion";
import { LabScene } from "../../src/ElementsLab";

// probe only: every gallery element as a still, both orientations (scratch/lab_probe/stills.mjs)
const Root: React.FC = () => (
  <>
    <Composition id="LabLand" component={LabScene} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{ id: "Word" }} />
    <Composition id="LabPort" component={LabScene} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ id: "Word" }} />
  </>
);
registerRoot(Root);
