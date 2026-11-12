"""ctypes wrapper of tools/gpu/bridge.dll: Electron's shared D3D11 frame texture -> CUDA buffer (GPU to GPU). See bridge.cpp."""
import ctypes, os

_DLL = None


def load():
    global _DLL
    if _DLL is None:
        d = ctypes.CDLL(os.path.join(os.path.dirname(os.path.abspath(__file__)), "bridge.dll"))
        d.br_last_error.restype = ctypes.c_char_p
        d.br_init.argtypes = [ctypes.c_int] * 4
        d.br_import.argtypes = [ctypes.c_int, ctypes.c_ulonglong, ctypes.c_ulonglong, ctypes.c_int, ctypes.POINTER(ctypes.c_uint)]
        d.br_count.restype = ctypes.c_ulonglong
        _DLL = d
    return _DLL


class Bridge:
    """w x h = size of the shared texture (viewport incl. marker rows); call from the thread that owns torch's CUDA context."""

    def __init__(self, w, h, mark_rows=8, ordinal=0):
        self.d = load()
        self.w, self.h = w, h
        if self.d.br_init(w, h, mark_rows, ordinal) != 0:
            raise RuntimeError("br_init: " + self.d.br_last_error().decode())
        self.info = self.d.br_last_error().decode()

    def fetch(self, pid, handle, dst):
        """dst: CUDA uint8 tensor (h, w, 4), contiguous. Returns the frame marker read from the picture (0xFFFFFFFF = unreadable)."""
        mk = ctypes.c_uint(0)
        if self.d.br_import(int(pid), int(handle), int(dst.data_ptr()), int(dst.stride(0)), ctypes.byref(mk)) != 0:
            raise RuntimeError("br_import: " + self.d.br_last_error().decode())
        return mk.value
