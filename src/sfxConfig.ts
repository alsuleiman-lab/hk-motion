/** Global sound-effect levels (user: followers complained there were too many/too loud). Light effects only, never music.
 *  Volumes are relative to the speech (1.0). pop = 0 means no pop sounds on element reveals. Change here, applies to every composition. */
export const SFX_LEVELS = { whoosh: 0.06, pop: 0, chime: 0.05 } as const;
/** Only every Nth scene change gets a whoosh. */
export const WHOOSH_EVERY = 2;

/** User rule 2026-10-20: sound effects are wanted, but LIGHT (never loud), FEW, never annoying. Used by the new motion components (files in public/sfx):
 *  shutter = FlashCut flashes, tick = a chosen row / stop landing, whoosh = one soft sweep per camera flight / panel flight, pop = nothing by default.
 *  Rule of thumb: ≤ 6 effects per minute of video, never two within 1.5 s, never over an important word, all ≤ 0.06 of the speech level. */
export const SFX_LEVELS_MOTION = { shutter: 0.05, tick: 0.04, whoosh: 0.05, impact: 0.06 } as const;
export const SFX_MAX_PER_MINUTE = 6;
export const SFX_MIN_GAP_SEC = 1.5;
