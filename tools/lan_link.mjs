// Preview link that opens on the phone and the PC (delivery-links skill, 2026-11-17): the CURRENT LAN address (it changes), checked to answer before it is sent.
//   node tools/lan_link.mjs [<CompositionId>] [--at m.ss | --frame N] [--port 3100]
// Prints one line: http://<lan-ip>:<port>/<Comp>[?m.ss|?N]; exit 1 when the server does not answer on that address (then start Studio or use the tunnel).
import os from "node:os";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const comp = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--"))) ?? "";
const port = Number(opt("--port") ?? 3100);
const skip = /vEthernet|WSL|VirtualBox|VMware|Hyper-V|Loopback|Bluetooth|Tailscale|ZeroTier/i;
const cands = [];
for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list ?? []) {
  if (a.family !== "IPv4" || a.internal || skip.test(name) || a.address.startsWith("169.254.")) continue;
  const rank = a.address.startsWith("192.168.") ? 0 : a.address.startsWith("10.") ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(a.address) ? 2 : 3;
  cands.push({ ip: a.address, rank });
}
cands.sort((x, y) => x.rank - y.rank);
if (!cands.length) { console.error("✘ لا عنوان شبكة محلية (الجهاز غير متصل بالشبكة)"); process.exit(1); }
const q = opt("--at") ? `?${opt("--at")}` : opt("--frame") ? `?${opt("--frame")}` : "";
for (const { ip } of cands) {
  const base = `http://${ip}:${port}`;
  try {
    const r = await fetch(base + "/", { signal: AbortSignal.timeout(3000) });
    if (r.ok || r.status < 500) { console.log(`${base}/${comp}${q}`); process.exit(0); }
  } catch { /* try the next address */ }
}
console.error(`✘ الخادم لا يجيب على المنفذ ${port} في ${cands.map((c) => c.ip).join("، ")}`);
process.exit(1);
