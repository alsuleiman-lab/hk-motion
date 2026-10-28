// Preload (loaded through NODE_OPTIONS from tools/env.sh): every child process started by our Node tools is created with windowsHide:true,
// so NO console/terminal windows flash on the user's screen while a montage works (user order 2026-10-22: «أريد ألا أراها»).
// Covers spawn / spawnSync / exec / execSync / execFile / execFileSync / fork; an explicit windowsHide in the caller's options is respected.
import cp from "node:child_process";
import { syncBuiltinESMExports } from "node:module";

const wrap = (name, optIndex) => {
  const orig = cp[name];
  if (typeof orig !== "function" || orig.__hidden) return;
  const fn = function (...args) {
    // locate the options object: the first plain object after the command (or after the args array)
    let i = args.findIndex((a, k) => k >= 1 && a && typeof a === "object" && !Array.isArray(a));
    if (i === -1) {
      const at = Math.min(optIndex(args), args.length);
      const cb = typeof args[args.length - 1] === "function" ? args.length - 1 : -1;
      const pos = cb !== -1 && at > cb ? cb : at;
      args.splice(pos, 0, { windowsHide: true });
    } else if (args[i].windowsHide === undefined) {
      args[i] = { ...args[i], windowsHide: true };
    }
    return orig.apply(this, args);
  };
  fn.__hidden = true;
  Object.assign(fn, orig);
  cp[name] = fn;
};
// options position when absent: spawn/spawnSync/execFile/execFileSync(cmd, [args], [opts]); exec/execSync(cmd, [opts]); fork(module, [args], [opts])
const withArgs = (a) => (Array.isArray(a[1]) ? 2 : 1);
for (const n of ["spawn", "spawnSync", "execFile", "execFileSync", "fork"]) wrap(n, withArgs);
for (const n of ["exec", "execSync"]) wrap(n, () => 1);
syncBuiltinESMExports();
