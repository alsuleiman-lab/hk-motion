import React from "react";
import { Composition, Folder } from "remotion";
import { PH, PW } from "./PoisonKit";
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

export const PoisonComps: React.FC = () => (
  <Folder name="Poison">
    {POISON_SCENES.map((s) => <Composition key={s.id} id={s.id} component={s.component} durationInFrames={s.frames} fps={30} width={PW} height={PH} />)}
  </Folder>
);
