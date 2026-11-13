import { getInputProps } from "remotion";
/* (2026-11-13) a render can show them WITHOUT editing this file (Studio's list stays as set here): inputProps {"showArchive": true} / {"showReference": true}
   — e.g. node tools/gpu_render.mjs --comp <old Id> --props '{"showArchive":true}', or the whole-library check tools/gpu/all_comps_check.mjs */
const P = getInputProps() as { showArchive?: boolean; showReference?: boolean };
/** Studio's composition list shows only the ACTIVE projects. Finished/delivered projects are hidden (their source files stay); set true to show them again (e.g. to re-render an old video). */
export const SHOW_ARCHIVE = false || P.showArchive === true;
/** Reference material (character libraries, element demos, labs, trials) is hidden from Studio's list (user order 2026-11-08). Set true only to work on it, e.g. before `node tools/stills.mjs ElementsLab …` or the character-library previews, then set it back to false. */
export const SHOW_REFERENCE = false || P.showReference === true;
