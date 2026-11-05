import React from "react";
import { Composition, Folder, Sequence, useCurrentFrame } from "remotion";
import { CfgCtx, PH, PW, SrcCtx } from "./PoisonKit";
import type { PoisonCfg } from "./PoisonKit";
import { P18_FRAMES, P19_FRAMES, P20_FRAMES, P21_FRAMES, P22_FRAMES, Poison18Compounds, Poison19Compare1, Poison20Compare2, Poison21Ripen, Poison22Chain } from "./PoisonC";
import { P08_FRAMES, P09_FRAMES, P10_FRAMES, P11_FRAMES, P12_FRAMES, P13_FRAMES, P14_FRAMES, P15_FRAMES, P16_FRAMES, P17_FRAMES, Poison08Sodium, Poison09Hyal, Poison10Inflam, Poison11Arsenic, Poison12Pectin, Poison13Mercury, Poison14Aflatoxin, Poison15Ochra, Poison16Pesticide, Poison17Limits } from "./PoisonB";
import { P01_FRAMES, P02_FRAMES, P03_FRAMES, P04_FRAMES, P05_FRAMES, P06_FRAMES, P07_FRAMES, Poison01Cell, Poison02Three, Poison03Snake, Poison04PLA2, Poison05SVMP, Poison06Clot, Poison07Neuro } from "./PoisonA";

/** «كيف تعمل السموم» — explanatory clips, 960×1080 each (half-screen / sticker, transparent corners). Add a scene = one line here + set_title. */
export const POISON_SCENES: { id: string; component: React.FC; frames: number }[] = [
  { id: "Poison-01-Cell", component: Poison01Cell, frames: P01_FRAMES },
  { id: "Poison-02-ThreeActions", component: Poison02Three, frames: P02_FRAMES },
  { id: "Poison-03-Snake", component: Poison03Snake, frames: P03_FRAMES },
  { id: "Poison-04-PLA2", component: Poison04PLA2, frames: P04_FRAMES },
  { id: "Poison-05-SVMP", component: Poison05SVMP, frames: P05_FRAMES },
  { id: "Poison-06-Clotting", component: Poison06Clot, frames: P06_FRAMES },
  { id: "Poison-07-Neurotoxin", component: Poison07Neuro, frames: P07_FRAMES },
  { id: "Poison-08-SodiumChannel", component: Poison08Sodium, frames: P08_FRAMES },
  { id: "Poison-09-Hyaluronidase", component: Poison09Hyal, frames: P09_FRAMES },
  { id: "Poison-10-Inflammation", component: Poison10Inflam, frames: P10_FRAMES },
  { id: "Poison-11-Arsenic", component: Poison11Arsenic, frames: P11_FRAMES },
  { id: "Poison-12-Pectin", component: Poison12Pectin, frames: P12_FRAMES },
  { id: "Poison-13-Mercury", component: Poison13Mercury, frames: P13_FRAMES },
  { id: "Poison-14-Aflatoxin", component: Poison14Aflatoxin, frames: P14_FRAMES },
  { id: "Poison-15-Ochratoxin", component: Poison15Ochra, frames: P15_FRAMES },
  { id: "Poison-16-Pesticide", component: Poison16Pesticide, frames: P16_FRAMES },
  { id: "Poison-17-Limits", component: Poison17Limits, frames: P17_FRAMES },
  { id: "Poison-18-DateCompounds", component: Poison18Compounds, frames: P18_FRAMES },
  { id: "Poison-19-Compare1", component: Poison19Compare1, frames: P19_FRAMES },
  { id: "Poison-20-Compare2", component: Poison20Compare2, frames: P20_FRAMES },
  { id: "Poison-21-Ripening", component: Poison21Ripen, frames: P21_FRAMES },
  { id: "Poison-22-Chain", component: Poison22Chain, frames: P22_FRAMES },
];

/** the script's reference numbers per scene (its «المراجع» lines); the first appears at 1.5 s, the next ones every 2.5 s unless a montage retimes them */
export const SCENE_REFS: Record<string, number[]> = {
  "Poison-01-Cell": [3, 4], "Poison-02-ThreeActions": [3, 4, 5, 24], "Poison-03-Snake": [3, 28], "Poison-04-PLA2": [4, 5, 6, 22],
  "Poison-05-SVMP": [7, 6, 25, 22], "Poison-06-Clotting": [6, 3], "Poison-07-Neurotoxin": [8, 32], "Poison-08-SodiumChannel": [9, 29],
  "Poison-09-Hyaluronidase": [10, 21, 22], "Poison-10-Inflammation": [11, 22, 30], "Poison-11-Arsenic": [12, 13, 29], "Poison-12-Pectin": [13, 14, 29],
  "Poison-13-Mercury": [15, 29], "Poison-14-Aflatoxin": [16, 29], "Poison-15-Ochratoxin": [17, 29], "Poison-16-Pesticide": [18, 19],
  "Poison-17-Limits": [20, 27, 31], "Poison-18-DateCompounds": [4, 5, 6, 11], "Poison-19-Compare1": [21], "Poison-20-Compare2": [22],
  "Poison-21-Ripening": [23], "Poison-22-Chain": [24, 25, 26],
};
export const sceneRefs = (id: string, at?: number[]) => (SCENE_REFS[id] ?? []).map((n, i) => ({ n, at: at?.[i] ?? 1.5 + i * 2.5 }));
export const WithRefs: React.FC<{ id: string; at?: number[]; children: React.ReactNode }> = ({ id, at, children }) => <SrcCtx.Provider value={sceneRefs(id, at)}>{children}</SrcCtx.Provider>;

/** one explainer clip inside a montage (spec item `poison`, landscape): `mode` half = the left 960×1080 half (his frame is shifted right by a `shifts` window), sticker = scaled in front of the video;
 *  `at`/`until` = cut seconds; `map` retimes the scene to his words; `parts` = optional parts to draw; `refs` = sources shown under the clip (scene seconds). */
export const PoisonClip: React.FC<{ id: string; at: number; until: number; x: number; y: number; scale: number; cfg: PoisonCfg; refs: { n: number; at: number }[] }> = ({ id, at, until, x, y, scale, cfg, refs }) => {
  const f = useCurrentFrame();
  const C = POISON_SCENES.find((s) => s.id === id)?.component;
  if (!C) throw new Error(`مقطع شرح غير موجود: ${id}`);
  const from = Math.round(at * 30), dur = Math.max(1, Math.round((until - at) * 30));
  const rel = f - from;
  if (rel < 0 || rel > dur) return null;
  const pop = Math.min(1, rel / 9), out = Math.min(1, (dur - rel) / 8);
  const e = 1 - Math.pow(1 - pop, 3);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: PW, height: PH, transformOrigin: "0 0", transform: `scale(${scale * (0.94 + 0.06 * e)})`, opacity: Math.min(e, Math.max(0, out)) }}>
      <Sequence from={from} durationInFrames={dur + 1} layout="none">
        <CfgCtx.Provider value={cfg}><SrcCtx.Provider value={refs}><C /></SrcCtx.Provider></CfgCtx.Provider>
      </Sequence>
    </div>
  );
};

export const PoisonComps: React.FC = () => (
  <Folder name="Poison">
    {POISON_SCENES.map((s) => {
      const C = s.component;
      return <Composition key={s.id} id={s.id} component={() => <WithRefs id={s.id}><C /></WithRefs>} durationInFrames={s.frames} fps={30} width={PW} height={PH} />;
    })}
  </Folder>
);
