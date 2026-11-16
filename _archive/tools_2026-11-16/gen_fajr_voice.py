import asyncio
import os
import json
import edge_tts

scenes = [
    {
        "id": "scene1",
        "text": "أكبر مشكلة بتضيّع عليك صلاة الفجر؟ إنك تصحى على المنبّه، تطفّيه، وترجع تنام!",
        "target_start": 0.0,
        "target_end": 8.0,
        "rate": "+4%"
    },
    {
        "id": "scene2",
        "text": "بتقول: هقوم بعد خمس دقايق… وفجأة تلاقي الوقت عدى، وفاتتك الصلاة.",
        "target_start": 8.0,
        "target_end": 17.0,
        "rate": "+2%"
    },
    {
        "id": "scene3",
        "text": "عشان كده تطبيق فجر بيقدّم لك طريقة مختلفة: المنبّه مش هيتوقف غير لما تقوم وتروح للمغسلة وتصورها.",
        "target_start": 17.0,
        "target_end": 28.0,
        "rate": "+2%"
    },
    {
        "id": "scene4",
        "text": "يعني بدل ما تطفي المنبّه وإنت لسه في السرير، التطبيق يساعدك تقوم وتتحرك وتبدأ يومك.",
        "target_start": 28.0,
        "target_end": 39.0,
        "rate": "+2%"
    },
    {
        "id": "scene5",
        "text": "خطوة بسيطة ممكن تساعدك تكسر عادة الرجوع للنوم، وتقرّبك من إنك تستقبل يومك بالصلاة.",
        "target_start": 39.0,
        "target_end": 50.0,
        "rate": "+2%"
    },
    {
        "id": "scene6",
        "text": "حمّل تطبيق فجر، وخلّي منبّهك بداية للقيام، مش فرصة للنوم من جديد. فجر… خطوة تساعدك تقوم لصلاة الفجر.",
        "target_start": 50.0,
        "target_end": 60.0,
        "rate": "+3%"
    }
]

async def process_all():
    os.makedirs("public/fajr", exist_ok=True)
    all_data = []
    for sc in scenes:
        sid = sc["id"]
        comm = edge_tts.Communicate(sc["text"], "ar-EG-ShakirNeural", rate=sc["rate"])
        audio_file = f"public/fajr/{sid}.mp3"
        words = []
        with open(audio_file, "wb") as f:
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    words.append({
                        "word": chunk["text"],
                        "start": chunk["offset"] / 10_000_000,
                        "duration": chunk["duration"] / 10_000_000
                    })
        all_data.append({
            "id": sid,
            "file": f"fajr/{sid}.mp3",
            "text": sc["text"],
            "target_start": sc["target_start"],
            "target_end": sc["target_end"],
            "words": words
        })
    with open("public/fajr/fajr_scenes.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print("All scenes voiceover and timestamps generated!")

if __name__ == "__main__":
    asyncio.run(process_all())
