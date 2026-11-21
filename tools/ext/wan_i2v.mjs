// صورة ← فيديو قصير بنموذج Wan 2.2 (٥ مليار) المحلي عبر ComfyUI على 8188 (يجب أن يكون شغّالاً؛ أول لقطة بُنيت بـcomfy_still).
//   node tools/ext/wan_i2v.mjs <صورة.png> "<وصف الحركة>" <مخرج.mp4> [--len 97] [--seed 7] [--w 1024] [--h 576] [--steps 20]
// الطول بالإطارات (٢٤ إطاراً/ث): 97 = أربع ثوانٍ. العرض والارتفاع من مضاعفات ٣٢. يكتب المخرج المرندر كما يخرجه ComfyUI (h264).
import fs from "node:fs";
import path from "node:path";

const [img, motion, out] = process.argv.slice(2);
if (!img || !motion || !out) { console.error('usage: node tools/ext/wan_i2v.mjs <image.png> "<motion prompt>" <out.mp4> [--len 97] [--seed 7] [--w 1024] [--h 576] [--steps 20]'); process.exit(2); }
const arg = (n, d) => (process.argv.includes("--" + n) ? Number(process.argv[process.argv.indexOf("--" + n) + 1]) : d);
const H = "http://127.0.0.1:8188";
const NEG = "blurry, low quality, still image, frozen, static, text, letters, watermark, subtitles, deformed, distorted, extra limbs, bad anatomy, flickering, overexposed";

// رفع الصورة إلى مجلد إدخال ComfyUI
const name = "wan_in_" + Date.now() + path.extname(img);
const fd = new FormData();
fd.append("image", new Blob([fs.readFileSync(img)]), name);
fd.append("overwrite", "true");
const up = await (await fetch(H + "/upload/image", { method: "POST", body: fd })).json();

const wf = {
  1: { class_type: "UNETLoader", inputs: { unet_name: "wan2.2_ti2v_5B_fp16.safetensors", weight_dtype: "default" } },
  2: { class_type: "CLIPLoader", inputs: { clip_name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors", type: "wan", device: "default" } },
  3: { class_type: "VAELoader", inputs: { vae_name: "wan2.2_vae.safetensors" } },
  4: { class_type: "LoadImage", inputs: { image: up.name } },
  5: { class_type: "CLIPTextEncode", inputs: { text: motion, clip: ["2", 0] } },
  6: { class_type: "CLIPTextEncode", inputs: { text: NEG, clip: ["2", 0] } },
  7: { class_type: "Wan22ImageToVideoLatent", inputs: { vae: ["3", 0], start_image: ["4", 0], width: arg("w", 1024), height: arg("h", 576), length: arg("len", 97), batch_size: 1 } },
  8: { class_type: "ModelSamplingSD3", inputs: { model: ["1", 0], shift: 8 } },
  9: { class_type: "KSampler", inputs: { model: ["8", 0], positive: ["5", 0], negative: ["6", 0], latent_image: ["7", 0], seed: arg("seed", 7), steps: arg("steps", 20), cfg: 5, sampler_name: "uni_pc", scheduler: "simple", denoise: 1 } },
  10: { class_type: "VAEDecode", inputs: { samples: ["9", 0], vae: ["3", 0] } },
  11: { class_type: "CreateVideo", inputs: { images: ["10", 0], fps: 24 } },
  12: { class_type: "SaveVideo", inputs: { video: ["11", 0], filename_prefix: "wan/shot", format: "mp4", codec: "h264" } },
};
const r = await (await fetch(H + "/prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: wf }) })).json();
if (!r.prompt_id) { console.error(JSON.stringify(r).slice(0, 900)); process.exit(1); }
const t0 = Date.now();
for (let i = 0; i < 900; i++) {
  await new Promise((s) => setTimeout(s, 4000));
  const o = (await (await fetch(`${H}/history/${r.prompt_id}`)).json())[r.prompt_id];
  if (o?.status?.status_str === "error") { console.error(JSON.stringify(o.status).slice(0, 1200)); process.exit(1); }
  const outs = o?.outputs?.["12"];
  if (outs) {
    const f = (outs.images ?? outs.videos ?? outs.gifs ?? [])[0];
    const buf = Buffer.from(await (await fetch(`${H}/view?filename=${encodeURIComponent(f.filename)}&subfolder=${encodeURIComponent(f.subfolder)}&type=${f.type}`)).arrayBuffer());
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, buf);
    console.log("saved", out, buf.length, "bytes in", Math.round((Date.now() - t0) / 1000), "s"); process.exit(0);
  }
}
console.error("timeout"); process.exit(1);
