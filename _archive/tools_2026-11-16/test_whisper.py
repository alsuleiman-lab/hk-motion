import os, sys
torch_lib = r'S:\AI_Tools\ComfyUI_windows_portable\python_embeded\Lib\site-packages\torch\lib'
if os.path.exists(torch_lib):
    try:
        os.add_dll_directory(torch_lib)
    except:
        pass
os.environ['PATH'] = torch_lib + os.pathsep + os.environ.get('PATH', '')

from faster_whisper import WhisperModel
print('Imported WhisperModel successfully')
model = WhisperModel('medium', device='cuda', compute_type='float16')
print('Loaded model successfully!')
