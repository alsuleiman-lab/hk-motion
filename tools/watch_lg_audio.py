import subprocess
import time
import os
import sys
import ctypes
from ctypes import wintypes

LOG_FILE = r"S:\AI_Tools\Remotion_Workspace\tools\watch_lg.log"
PS1_SWITCHER = r"S:\AI_Tools\Remotion_Workspace\tools\switch_audio_device.ps1"

def log(msg):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except Exception:
        pass

# --- Fast In-Memory Process Detection using Win32 API ---
TH32CS_SNAPPROCESS = 0x00000002

class PROCESSENTRY32(ctypes.Structure):
    _fields_ = [
        ('dwSize', wintypes.DWORD),
        ('cntUsage', wintypes.DWORD),
        ('th32ProcessID', wintypes.DWORD),
        ('th32DefaultHeapID', ctypes.c_size_t),
        ('th32ModuleID', wintypes.DWORD),
        ('cntThreads', wintypes.DWORD),
        ('th32ParentProcessID', wintypes.DWORD),
        ('pcPriClassBase', wintypes.LONG),
        ('dwFlags', wintypes.DWORD),
        ('szExeFile', ctypes.c_char * 260)
    ]

def is_hk_stream_running():
    """Checks if HK Stream.exe is currently running (takes ~0.1ms)."""
    try:
        hSnap = ctypes.windll.kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
        if hSnap == -1:
            return False
        pe = PROCESSENTRY32()
        pe.dwSize = ctypes.sizeof(PROCESSENTRY32)
        has_next = ctypes.windll.kernel32.Process32First(hSnap, ctypes.byref(pe))
        found = False
        while has_next:
            exe_name = pe.szExeFile.lower()
            if b"hk stream" in exe_name or b"hk_stream" in exe_name:
                found = True
                break
            has_next = ctypes.windll.kernel32.Process32Next(hSnap, ctypes.byref(pe))
        ctypes.windll.kernel32.CloseHandle(hSnap)
        return found
    except Exception:
        return False

# --- Fast Audio Device Presence Detection via WinMM API ---
class WAVEINCAPSW(ctypes.Structure):
    _fields_ = [
        ('wMid', wintypes.WORD),
        ('wPid', wintypes.WORD),
        ('vDriverVersion', wintypes.UINT),
        ('szPname', ctypes.c_wchar * 32),
        ('dwFormats', wintypes.DWORD),
        ('wChannels', wintypes.WORD),
        ('wReserved1', wintypes.WORD),
    ]

def is_lg_connected():
    """Checks if LG-TONE recording device is currently connected (takes ~0.05ms)."""
    try:
        num = ctypes.windll.winmm.waveInGetNumDevs()
        caps = WAVEINCAPSW()
        for i in range(num):
            if ctypes.windll.winmm.waveInGetDevCapsW(i, ctypes.byref(caps), ctypes.sizeof(caps)) == 0:
                name_upper = caps.szPname.upper()
                if "LG-TONE" in name_upper or "LG TONE" in name_upper:
                    return True
        return False
    except Exception:
        return False

def switch_device(target, reason):
    """Executes PowerShell switch script completely hidden with zero window."""
    try:
        res = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS1_SWITCHER, "-Target", target],
            capture_output=True,
            text=True,
            creationflags=0x08000000 # CREATE_NO_WINDOW
        )
        output = res.stdout.strip()
        if "SWITCHED:" in output:
            dev_name = output.split(":", 2)[-1]
            log(f"Switched default audio input to {target} ({dev_name}) [{reason}].")
            return True
        elif "ALREADY_DEFAULT:" in output:
            return True
        elif "NOT_FOUND:" in output:
            log(f"Warning: Target {target} not found during switch attempt.")
            return False
    except Exception as e:
        log(f"Error during switch_device({target}): {e}")
        return False

def main():
    log("Audio Router Watcher started (Background service: HK Stream -> AVerMedia | Standby -> LG-TONE).")
    last_target = None
    last_hk_state = None
    last_lg_state = None

    while True:
        try:
            hk_running = is_hk_stream_running()
            lg_connected = is_lg_connected()

            # Determine desired target based on user priority:
            # 1. When HK Stream is running -> AverMedia
            # 2. When HK Stream is NOT running -> LG-TONE (if connected)
            if hk_running:
                desired_target = "AVerMedia"
                reason = "HK Stream is running"
            elif lg_connected:
                desired_target = "LG"
                reason = "HK Stream closed & LG-TONE connected"
            else:
                desired_target = None

            # Detect state transitions
            state_changed = (
                (hk_running != last_hk_state) or
                (lg_connected != last_lg_state) or
                (desired_target != last_target)
            )

            if state_changed and desired_target is not None:
                switch_device(desired_target, reason)
                last_target = desired_target
            elif desired_target is None:
                last_target = None

            last_hk_state = hk_running
            last_lg_state = lg_connected

        except Exception as e:
            log(f"Unexpected loop error: {e}")

        # Sleep briefly (1.5 seconds gives responsive switching while consuming ~0% CPU)
        time.sleep(1.5)

if __name__ == "__main__":
    main()
