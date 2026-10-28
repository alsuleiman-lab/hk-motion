import React from "react";
import { AbsoluteFill } from "remotion";
import { TitleBar } from "./TitleBar";

/** Demo of the standing title bar (not a deliverable). */
export const TitleBarDemo: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(135deg,#e9c4a0,#dca7a2)" }}>
    <TitleBar title="هل الاستغاثة مجمع على جوازها؟" />
  </AbsoluteFill>
);
