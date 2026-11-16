import whisper
import json

model = whisper.load_model("tiny")
# transcribe slice 6102 to 6108
res = model.transcribe("render_work/debate_jobeX3sJVhM/audio16k.wav", 
                       word_timestamps=True,
                       initial_prompt="ولكن إذا سألك فكيف لا يلد ولا يولد",
                       clip_timestamps=[(6102.0, 6108.0)])

with open("render_work/debate_jobeX3sJVhM/start_words.json", "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
print("Done transcribing start slice.")

