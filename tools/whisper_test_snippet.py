import whisper_timestamped as whisper
import json

audio = "render_work/debate_jobeX3sJVhM/audio16k.wav"
model = whisper.load_model("tiny", device="cuda")
result = whisper.transcribe(model, audio, language="ar", initial_prompt="ولكن إذا سألك فكيف لا يلد ولا يولد", 
                            vad=True, detect_disfluencies=True)
# We just need to find the segment around 6103

