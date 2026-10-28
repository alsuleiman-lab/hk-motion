// Free local still generation for collage B-roll (adapted idea from gbro-collage-broll / VOX-COLLAGE-BROLL; MIT) with the local ComfyUI + z_image_turbo.
//   node tools/comfy_still.mjs "<prompt>" <out.png> [--seed 7] [--orient portrait|landscape] [--w 832] [--h 1216]
//   --orient landscape = 1344x768 (≈16:9, scale to 1920x1080 afterwards); portrait (default) = 832x1216 (scale/crop to 1080x1920)
// ComfyUI must already be running on 127.0.0.1:8188 (start: S:\AI_Tools\ComfyUI_windows_portable\run_nvidia_gpu.bat, below-normal priority) and should be stopped when done to free VRAM.
// Tips for collage stills: ban text/numerals explicitly; any clock/dial/gauge = plain tick lines only; no "Zzz" on sleepers.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";

const [prompt, out] = process.argv.slice(2);
if (!prompt || !out) { console.error('usage: node tools/comfy_still.mjs "<prompt>" <out.png> [--seed 7] [--w 832] [--h 1216]'); process.exit(2); }
const arg = (n, d) => (process.argv.includes("--" + n) ? Number(process.argv[process.argv.indexOf("--" + n) + 1]) : d);
const H = "http://127.0.0.1:8188";
const landscape = process.argv.includes("--orient") && process.argv[process.argv.indexOf("--orient") + 1] === "landscape";
const wf = {
  1: { class_type: "UNETLoader", inputs: { unet_name: "z_image_turbo_bf16.safetensors", weight_dtype: "default" } },
  2: { class_type: "CLIPLoader", inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2", device: "default" } },
  3: { class_type: "VAELoader", inputs: { vae_name: "ae.safetensors" } },
  4: { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["2", 0] } },
  5: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["4", 0] } },
  6: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["1", 0], shift: 3 } },
  7: { class_type: "EmptySD3LatentImage", inputs: { width: arg("w", landscape ? 1344 : 832), height: arg("h", landscape ? 768 : 1216), batch_size: 1 } },
  8: { class_type: "KSampler", inputs: { model: ["6", 0], positive: ["4", 0], negative: ["5", 0], latent_image: ["7", 0], seed: arg("seed", 7), steps: 8, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 } },
  9: { class_type: "VAEDecode", inputs: { samples: ["8", 0], vae: ["3", 0] } },
  10: { class_type: "SaveImage", inputs: { images: ["9", 0], filename_prefix: "collage_still" } },
};
const keep = process.argv.includes("--keep");
const comfyUp = async () => { try { return (await fetch(H + "/system_stats", { signal: AbortSignal.timeout(2500) })).ok; } catch { return false; } };
let child = null;
if (!(await comfyUp())) {
  fs.mkdirSync(".tmp", { recursive: true });
  const root = "S:/AI_Tools/ComfyUI_windows_portable";
  child = spawn(path.join(root, "python_embeded", "python.exe"), ["-s", "ComfyUI/main.py", "--windows-standalone-build", "--highvram", "--listen", "127.0.0.1", "--port", "8188", "--disable-auto-launch"], { cwd: root, windowsHide: true, stdio: ["ignore", fs.openSync(".tmp/comfy.log", "a"), fs.openSync(".tmp/comfy.log", "a")] });
  child.unref();
  try { os.setPriority(child.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* ignore */ }
  fs.mkdirSync(".tmp", { recursive: true }); fs.writeFileSync(".tmp/comfy.pid", String(child.pid));
  for (let i = 0; i < 160 && !(await comfyUp()); i++) await new Promise((s) => setTimeout(s, 2000));
  if (!(await comfyUp())) { console.error("تعذّر تشغيل ComfyUI في الخلفية"); try { spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"]); } catch { /* ignore */ } process.exit(1); }
}
process.on("exit", () => { if (child && !keep) { try { const k = spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, encoding: "utf8" }); fs.writeFileSync(".tmp/comfy_exit.log", `pid ${child.pid} status ${k.status} ${k.stdout} ${k.stderr} ${k.error ?? ""}`); } catch (e) { fs.writeFileSync(".tmp/comfy_exit.log", String(e)); } } });
let r;
try { r = await (await fetch(H + "/prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: wf }) })).json(); }
catch { console.error("تعذّر الاتصال بـComfyUI على 8188"); process.exit(1); }
if (!r.prompt_id) { console.error(JSON.stringify(r).slice(0, 600)); process.exit(1); }
for (let i = 0; i < 240; i++) {
  await new Promise((s) => setTimeout(s, 2000));
  const o = (await (await fetch(`${H}/history/${r.prompt_id}`)).json())[r.prompt_id];
  if (o?.status?.status_str === "error") { console.error(JSON.stringify(o.status).slice(0, 800)); process.exit(1); }
  if (o?.outputs?.["10"]) {
    const im = o.outputs["10"].images[0];
    const buf = Buffer.from(await (await fetch(`${H}/view?filename=${im.filename}&subfolder=${im.subfolder}&type=${im.type}`)).arrayBuffer());
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, buf);
    console.log("saved", out, buf.length); process.exit(0);
  }
}
console.error("timeout"); process.exit(1);
