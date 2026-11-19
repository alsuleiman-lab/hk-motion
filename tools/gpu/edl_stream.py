"""THE CUT READ STRAIGHT FROM THE ORIGINAL (user 2026-11-19: «يظل عندنا الملف الأصلي… ونشتغل على ترميز الملف الأصلي»).

The compositor (tools/gpu_compositor.py) asks a slot's video for frame `idx` of the CUT timeline. Until now that meant the heavy cut file (an encode of the original + the duplicate-frame repair).
EdlStream gives the same frames WITHOUT that file: it reads the original through NVDEC (the same calls tools/cut_build_gpu.py uses) and does, per frame, exactly what the build did:
  * the cut list (public/<p>_map.json: kept stretches of the original in seconds) → the source frame of every cut frame (nearest, cumulative rounding: the same arithmetic as cut_build_gpu.frames());
  * the same duplicate-frame repair (a frame equal to its predecessor while the next one differs becomes the average of its two neighbours; the same gray measure, x0 and threshold).
The result is the NV12 the build would have encoded, minus one encode generation (the build's NVENC cq 15 pass). Colour: the heavy file carried no colour tags, so it was read as limited range BT.709: the same here.
Random access works (a seek per jump); sequential playback keeps a small window so each source frame is decoded once.

    EdlStream(src, mapf, to_rgb, smooth=True)   .get(idx) -> rgb (3,h,w) on the card · .get_nv12(idx) -> NV12 (3h/2, w) uint8 · .n .fps .w .h .full .m601
"""
import json
import os
import subprocess
import sys
import threading
from fractions import Fraction

import torch

sys.path.insert(0, os.environ.get("GR_PYNVC", r"S:\AI_Tools\PyNvVideoCodec_GpuRender\site"))
import PyNvVideoCodec as nvc  # noqa: E402

FPS = 30


class EdlStream:
    def __init__(self, src, mapf, to_rgb, smooth=True, x0=900, thr=0.35):
        pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", src],
                                       capture_output=True, text=True, check=True).stdout)["streams"][0]
        self.src, self.w, self.h = src, int(pr["width"]), int(pr["height"])
        sfps = float(Fraction(pr["r_frame_rate"]))
        self.fps, self.full, self.m601 = float(FPS), False, False
        self.to_rgb, self.smooth, self.thr = to_rgb, smooth, thr
        self.xs = x0 if x0 < self.w else 0
        plan, cum = [], 0.0   # source frame of every cut frame (cut_build_gpu.frames(): cumulative rounding, nearest frame)
        for s in json.load(open(mapf, encoding="utf-8"))["segments"]:
            d = s["b"] - s["a"]
            n = int(round((cum + d) * FPS)) - int(round(cum * FPS)); cum += d
            plan += [int(round((s["a"] + k / FPS) * sfps)) for k in range(n)]
        if not plan:
            raise RuntimeError(f"the cut list {mapf} has no frames")
        self.plan, self.n = plan, len(plan)
        self.dec, self.base, self.got = None, 0, []
        self.cache = {}                 # cut index -> (NV12 raw frame, gray)
        self.cur_idx, self.cur = -1, None
        self.lock = threading.Lock()
        self.last_use = 0

    # ---- the original, forward through a window of decoded frames (the calls of cut_build_gpu.frames()) ----
    def _decoder(self):
        if self.dec is None:
            self.dec = nvc.CreateSimpleDecoder(open(self.src, "rb"), gpuid=0, useDeviceMemory=True, outputColorType=nvc.OutputColorType.NATIVE)
            self.base, self.got = -1, []

    def _source_frame(self, sidx):
        self._decoder()
        end = self.base + len(self.got)
        if not (self.base <= sidx < end):
            if not self.got or sidx < self.base or sidx >= end + 64:   # a jump: seek (the decoder restarts at the key frame before it)
                self.dec.seek_to_index(sidx); self.base, self.got = sidx, []
            while sidx >= self.base + len(self.got):
                batch = self.dec.get_batch_frames(32)
                if not batch:
                    break
                self.base += len(self.got); self.got = [torch.from_dlpack(f) for f in batch]   # the decoder reuses its surfaces: a frame is cloned when taken
        j = sidx - self.base
        if not (0 <= j < len(self.got)):
            raise RuntimeError(f"no frame for source index {sidx}")
        x = self.got[j]
        return (x[..., : self.w] if x.shape[-1] != self.w else x).clone()

    def _gray(self, f):   # (Y - 16) * 255/219 on every 4th pixel right of x0 (the webcam side): the same measure as tools/smooth_dups.py / cut_build_gpu.gray
        return (f[: self.h : 4, self.xs :: 4].float() - 16.0) * (255.0 / 219.0)

    def _raw(self, k):
        e = self.cache.get(k)
        if e is None:
            x = self._source_frame(self.plan[k]); e = (x, self._gray(x)); self.cache[k] = e
        return e

    def get_nv12(self, idx):
        idx = max(0, min(int(idx), self.n - 1))
        x, g = self._raw(idx)
        out = x
        if self.smooth and 0 < idx < self.n - 1:
            xp, gp = self._raw(idx - 1)
            xn, gn = self._raw(idx + 1)
            if float((g - gp).abs().mean()) < self.thr and not (float((gn - g).abs().mean()) < self.thr):
                out = ((xp.to(torch.int16) + xn.to(torch.int16) + 1) >> 1).to(torch.uint8)   # 50/50, rounded (cv2.addWeighted)
        for k in [k for k in self.cache if k < idx - 2 or k > idx + 4]:
            del self.cache[k]
        return out

    # ---- the interface of NvStream ----
    def prepare(self, idx):
        def go():
            with self.lock:
                self._decoder()
        if self.dec is None:
            threading.Thread(target=go, daemon=True).start()

    def get(self, idx):
        with self.lock:
            idx = max(0, min(int(idx), self.n - 1))
            if idx == self.cur_idx:
                return self.cur
            x = self.get_nv12(idx)
            self.cur = self.to_rgb(x.reshape(-1) if x.is_contiguous() else x.contiguous().reshape(-1), self.w, self.h, self.full, self.m601)
            self.cur_idx = idx
            return self.cur

    def _kill(self):
        self.dec = None
        self.cache.clear()

    def idle_kill(self, frame_no):
        with self.lock:
            if self.dec is not None and frame_no - self.last_use > 120:
                self.dec = None
                self.cache.clear()
                self.cur_idx = -1
