import subprocess
import os

SOURCE = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8\source.mp4"
PUB = r"s:\AI_Tools\Remotion_Workspace\public"
WORK = r"s:\AI_Tools\Remotion_Workspace\render_work\lessons\GAMoY6n_Fw8"

# ------------------------------------------------------------------
# CLIP 1 (FULL CONTEXT WITH SERAJ'S PROPOSITION):
# 1) 292.0 - 345.0 (53.0s): سراج يطرح الشبهة في المناظرة:
#    «اليوم نبدأ بالآية الأولى {والشمس تجري لمستقر لها}.. والحديث فسرها بالوقوف الكامل تحت العرش.. والعلم يقول لا تتوقف مطلقا!»
# 2) 1653.0 - 1657.8 (4.8s): الشيخ: «اسمعوا يا إخوة إيش رح أجيب لكم الآن..»
# 3) 1724.8 - 1730.0 (5.2s): الشيخ: «لما ادعى الإسلام ها هو كان يرد على الملحدين.. خلينا نسمع رده!»
# 4) 1746.2 - 1756.2 (10.0s): سراج القديم: «وهذا الادعاء لا يستقيم بل هو ادعاء سقيم..»
# 5) 1761.0 - 1782.5 (21.5s): سراج القديم: «ففي الحديث لا يوجد أي إشارة لأن الشمس تتوقف عن الجريان بل فقط يوم القيامة..»
# 6) 1802.5 - 1813.2 (10.7s): سراج القديم: «فليس في الحديث أنها تتوقف الآن أو تتوقف كل يوم.. أما أنها تسجد فلا يقتضي توقفها..»
# 7) 1839.0 - 1842.3 (3.3s): سراج القديم: «ولا يفهم ذلك أحد فيه ذرة عقل!»
# 8) 1842.3 - 1846.0 (3.7s): الشيخ: «شكل العقل راح لما رجعت للإلحاد!»
# 9) 1888.2 - 1890.2 (2.0s): الشيخ: «شفت شلون لما يكون واحد يفهم؟»
# 10) 1901.8 - 1906.5 (4.7s): سراج المتورط: «سجل إجابتي إنه هذا خارج محل النزاع!»
# ------------------------------------------------------------------
c1_cuts = [
    (292.0, 345.0),    # 53.0s: Seraj brings the doubt in the debate
    (1653.0, 1655.3),  # 2.3s: Sheikh: "اسمعوا يا إخوة إيش رح أجيب لكم الآن" (tightened from 1657.8 to remove 2.5s silence)
    (1724.8, 1730.0),  # 5.2s: Sheikh: "لما ادعى الإسلام ها هو كان يرد على الملحدين.. خلينا نسمع رده!"
    (1746.2, 1756.2),  # 10.0s: Seraj: "وهذا الادعاء لا يستقيم بل هو ادعاء سقيم.."
    (1761.0, 1781.7),  # 20.7s: Seraj: "ففي الحديث لا يوجد أي إشارة.. فقط يوم القيامة" (tightened from 1782.5 to avoid cut syllable)
    (1802.2, 1814.5),  # 12.3s: Seraj: "فليس في الحديث أنها تتوقف الآن.. أما أنها تسجد فلا يقتضي معها أن تتوقف" (extended from 1813.2 to finish sentence)
    (1839.0, 1842.3),  # 3.3s: Seraj: "ولا يفهم ذلك أحد فيه ذرة عقل!"
    (1842.3, 1846.0),  # 3.7s: Sheikh: "شكل العقل راح لما رجعت للإلحاد!"
    (1888.2, 1890.2),  # 2.0s: Sheikh: "شفت شلون لما يكون واحد يفهم؟"
    (1902.1, 1906.5),  # 4.4s: Seraj: "سجل إجابتي إنه هذا خارج محل النزاع!" (tightened start from 1901.8 to avoid clipped prefix)
]

inputs = ""
filter_parts = []
for i, (st, en) in enumerate(c1_cuts):
    dur = en - st
    inputs += f' -ss {st} -t {dur} -i "{SOURCE}"'
    filter_parts.append(f"[{i}:v:0][{i}:a:0]")

n = len(c1_cuts)
fc = "".join(filter_parts) + f"concat=n={n}:v=1:a=1[outv][outa]"
out_path = os.path.join(PUB, "stream_clip1_sun.mp4")
cmd = f'ffmpeg -y -threads 4 {inputs} -filter_complex "{fc}" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 18 -threads 4 -c:a aac -b:a 192k "{out_path}"'

print("Executing ffmpeg concatenation for Clip 1 (Total dur:", sum(en - st for st, en in c1_cuts), "s)...")
subprocess.run(cmd, shell=True, check=True)

# Extract audio for transcription
audio_out = os.path.join(WORK, "c1_audio16k.wav")
cmd_audio = f'ffmpeg -y -i "{out_path}" -vn -ar 16000 -ac 1 -c:a pcm_s16le "{audio_out}"'
subprocess.run(cmd_audio, shell=True, check=True)
print("Clip 1 audio extracted successfully!")
