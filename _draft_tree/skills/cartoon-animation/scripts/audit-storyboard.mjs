// node audit-storyboard.mjs <plan.json> [workspace-root]
// Checks timing and asset invariants. It cannot judge art quality or whether a transcript is correct.
import fs from "node:fs";
import path from "node:path";
const file = process.argv[2];
if (!file) { console.error("usage: node audit-storyboard.mjs plan.json [workspace-root]"); process.exit(2); }
const root = path.resolve(process.argv[3] ?? process.cwd());
const plan = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const frame = 1 / (plan.fps || 30);
const roles = new Set([...(plan.characters ?? []), "none"]);
if (!plan.beats?.length) errors.push("No scene plan");
for (const [i, beat] of (plan.beats ?? []).entries()) {
  for (const key of ["environment", "action", "shot", "note"]) if (!beat[key]) errors.push(`Scene ${i}: missing ${key}`);
  if (!roles.has(beat.actor) || !roles.has(beat.speaker)) errors.push(`Scene ${i}: unspecified actor or speaker`);
  if (!(beat.to > beat.from)) errors.push(`Scene ${i}: invalid duration`);
  const expected = i ? plan.beats[i - 1].to : 0;
  if (Math.abs(beat.from - expected) > frame) errors.push(`Scene ${i}: gap or overlap at ${beat.from}`);
  if (beat.actor !== beat.speaker && !beat.narration) errors.push(`Scene ${i}: actor differs from speaker without narration flag`);
}
if (plan.beats?.length && Math.abs(plan.beats.at(-1).to - plan.duration) > frame) errors.push("Last scene does not reach audio end");
for (const [i, cue] of (plan.captions ?? []).entries()) {
  if (!cue.words?.length) errors.push(`Caption ${i}: empty`);
  for (const [j, word] of (cue.words ?? []).entries()) {
    if (word.at < cue.from || word.at >= cue.to) errors.push(`Caption ${i}: word outside display interval`);
    if (j && word.at < cue.words[j - 1].at) errors.push(`Caption ${i}: unordered words`);
  }
}
for (const entity of plan.entities ?? []) {
  if (Math.abs(entity.at - entity.spokenAt) > frame) errors.push(`${entity.name}: reveal differs from spoken word by more than a frame`);
  if (!entity.asset || !fs.existsSync(path.resolve(root, "public", entity.asset))) errors.push(`${entity.name}: missing actual asset`);
}
for (const quote of plan.quotations ?? []) {
  if (!quote.byUserRequest || !quote.text || !quote.book || !quote.url) errors.push("Unrequested or undocumented source quotation");
  if (!(quote.from >= 0 && quote.to > quote.from && quote.to <= plan.duration)) errors.push("Quotation lies outside the video");
}
for (const asset of plan.assets ?? []) if (!fs.existsSync(path.resolve(root, "public", asset))) errors.push(`Missing asset ${asset}`);
// Main-picture inactivity: no gap over 2.5 s between meaningful picture events (captions, whole-frame zoom and shake do not count).
const MAX_IDLE = plan.maxIdle ?? 2.5;
if (!plan.events?.length) console.warn("NOTE: no `events` in the plan; main-picture inactivity (> 2.5 s) was not checked.");
else {
  const times = [0, ...plan.events.map(Number).filter(Number.isFinite).sort((a, b) => a - b), plan.duration];
  for (let i = 1; i < times.length; i++) if (times[i] - times[i - 1] > MAX_IDLE) errors.push(`Main picture idle ${times[i - 1].toFixed(2)}–${times[i].toFixed(2)}s (> ${MAX_IDLE}s without a meaningful event)`);
}
const sets = new Set((plan.beats ?? []).map(beat => beat.environment));
if (plan.requireDistinctSets && sets.size < 2) errors.push("Distinct workplaces collapsed to one setting");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`PASS: ${plan.beats.length} scenes, ${plan.captions.length} timed key phrases, ${(plan.entities ?? []).length} entity onsets, ${sets.size} settings`);
console.log("Visual review and transcript listening are still required; this is not a quality verdict.");
