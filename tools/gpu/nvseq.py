"""NVDEC straight into CUDA for streams that PyNvVideoCodec's SimpleDecoder indexes WRONGLY (2026-11-12: VP9).

Why: in a VP9 stream a packet may be a "superframe" (a hidden alt-ref frame + the shown frame). NVIDIA's parser decodes the pictures right and in
display order, but stamps them with lagging timestamps around the hidden frames, so SimpleDecoder (which maps index <-> timestamp) returned the
NEXT frame and drifted (4 frames off by frame 100; measured on public/saint_rambal/bg/raw_MGfi4fD9DDs.mp4, tools/gpu/check_decoder.py).
Here the low-level demuxer + decoder are driven directly and frames are COUNTED in output order: frame k = the k-th picture the decoder shows.
The count starts at a keyframe whose index comes from its PACKET timestamp (container timestamps are exact). Bit-exact with ffmpeg's decode.

    d = SeqDecoder(path, pts_list)    # pts_list: the sorted packet timestamps of the video stream (ffprobe), one per shown frame
    nv12 = d.frame(idx)               # CUDA uint8 tensor (h * 3 / 2, w), NV12; None past the end (the caller holds the last frame)
"""
import bisect

import torch
import PyNvVideoCodec as nvc


class SeqDecoder:
    def __init__(self, path, pts_list, w, h, ahead=150):
        self.path, self.pts, self.w, self.h, self.ahead = path, pts_list, w, h, ahead
        self.n = len(pts_list)
        self.dm = self.dec = None
        self.next_idx = 0          # index of the next picture the decoder will output
        self.buf = {}              # idx -> NV12 copies of pictures that came out with a requested one (decoder latency), kept for the next call
        self.eof = False

    def _index_of_pts(self, t):
        j = bisect.bisect_left(self.pts, t)
        c = [k for k in (j - 1, j) if 0 <= k < self.n]
        k = min(c, key=lambda k: abs(self.pts[k] - t))
        if abs(self.pts[k] - t) > 2:
            raise RuntimeError(f"keyframe pts {t} is not a packet timestamp of {self.path}")
        return k

    def _restart(self, idx):
        self.dm = nvc.CreateDemuxer(self.path)
        self.dec = nvc.CreateDecoder(gpuid=0, codec=self.dm.GetNvCodecId(), usedevicememory=True)
        pk = self.dm.Seek(int(idx)) if idx > 0 else None   # nearest keyframe at or before frame `idx` (frame-index units)
        self.buf.clear()
        self.eof = False
        if pk is None:
            self.next_idx = 0
            self.first = None
        else:
            if not pk.key:
                raise RuntimeError(f"seek of {self.path} to {idx} did not land on a keyframe")
            self.next_idx = self._index_of_pts(pk.pts)
            self.first = pk           # fed first by _pump

    def _copy(self, f):
        x = torch.from_dlpack(f)
        if x.shape[-1] != self.w:
            x = x[..., : self.w]
        return x.clone()            # the decoder reuses its surfaces: copy at once (GPU -> GPU)

    def _pump(self, idx):
        """feed packets until picture `idx` came out (or the stream ended); returns it or None"""
        got = None
        while got is None and not self.eof:
            if self.first is not None:
                pk, self.first = self.first, None
            else:
                pk = self.dm.Demux()
                if pk.bsl == 0:            # end of the stream: flush the decoder
                    self.eof = True
                    pk = nvc.PacketData()
            for f in self.dec.Decode(pk):
                k = self.next_idx
                self.next_idx += 1
                if k == idx:
                    got = self._copy(f)
                elif k > idx:
                    self.buf[k] = self._copy(f)
        return got

    def frame(self, idx):
        idx = max(0, min(int(idx), self.n - 1))
        if idx in self.buf:
            x = self.buf.pop(idx)
            for k in [k for k in self.buf if k < idx]:
                del self.buf[k]
            return x
        if self.dec is None or idx < self.next_idx or idx - self.next_idx > self.ahead:
            self._restart(idx)
        self.buf = {k: v for k, v in self.buf.items() if k > idx}
        return self._pump(idx)

    def close(self):
        self.dm = self.dec = None
        self.buf.clear()
