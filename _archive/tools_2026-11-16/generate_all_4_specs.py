import json, os

def make_spec_kalb():
    dur = 177.43
    frames = 5323
    with open(".tmp/s2_ashari_kalb_words.json", "r", encoding="utf-8") as f:
        words = json.load(f)
    
    spec = {
        "id": "s2_ashari_kalb_reel",
        "title": "إحراج متصل أشعري يلزم نفسه والدي كالكلب والشيخ يقصف منطقه الفاسد",
        "cut": "s2_ashari_kalb_cut.mp4",
        "duration": dur,
        "frames": frames,
        "fps": 30,
        "showTitleBar": False,
        "cover": {
            "photo": "sheikh_gallery/black_white/sheikh_cov.png",
            "title": "متصل أشعري يلزم نفسه:\nوالدي كالكلب!",
            "sub": "متصل أشعري في نفي العلو"
        },
        "cams": [{"from": 0.0, "to": dur, "cx": 934}],
        "zooms": [
            {"from": 12.0, "to": 22.0, "amt": 0.08},
            {"from": 55.0, "to": 72.0, "amt": 0.08},
            {"from": 105.0, "to": 125.0, "amt": 0.08},
            {"from": 150.0, "to": 175.0, "amt": 0.08}
        ],
        "items": [
            {
                "t": "word",
                "text": "القدر المشترك لا يقتضي المماثلة!",
                "at": 0.5,
                "until": 4.5,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "«هل والدك كالكلب لأنهما في جهة؟!»",
                "at": 5.0,
                "until": 11.5,
                "y": 1570,
                "size": 40
            },
            {
                "t": "word",
                "text": "المتصل يلزم نفسه بما لا يعقل!",
                "at": 12.0,
                "until": 17.5,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "cream"
            },
            {
                "t": "torn",
                "text": "المتصل: «والدي كالكلب في كونه في جهة!»",
                "at": 28.0,
                "until": 35.0,
                "y": 1570,
                "size": 38
            },
            {
                "t": "word",
                "text": "شتمت والدك لأجل كلام فاسد!",
                "at": 58.0,
                "until": 65.0,
                "x": 540,
                "y": 1580,
                "size": 44,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "«هل تقول لأبيك أنت كالكلب؟!»",
                "at": 85.0,
                "until": 92.0,
                "y": 1570,
                "size": 42
            },
            {
                "t": "word",
                "text": "أهل الكلام وشبهات التشبيه",
                "at": 115.0,
                "until": 122.0,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "cream"
            },
            {
                "t": "torn",
                "text": "«لو كان القدر المشترك يقتضي المماثلة لجعلت والدك كالكلب!»",
                "at": 148.0,
                "until": 160.0,
                "y": 1570,
                "size": 36
            },
            {
                "t": "word",
                "text": "فبطل أصلكم الفاسد في نفي العلو",
                "at": 162.0,
                "until": 175.0,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "gold"
            }
        ],
        "words": words
    }
    with open("data/specs/s2_ashari_kalb_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    print("Updated data/specs/s2_ashari_kalb_reel.json")

def make_spec_tifla():
    dur = 128.93
    frames = 3868
    with open(".tmp/s2_ashari_tifla_words.json", "r", encoding="utf-8") as f:
        words = json.load(f)
    
    spec = {
        "id": "s2_ashari_tifla_reel",
        "title": "متصل أشعري يحتج بطفلته في نفي العلو والشيخ يقصفه إذا ربك عاجز فهذا إله لا نعبده",
        "cut": "s2_ashari_tifla_cut.mp4",
        "duration": dur,
        "frames": frames,
        "fps": 30,
        "showTitleBar": False,
        "cover": {
            "photo": "sheikh_gallery/black_white/sheikh_cov.png",
            "title": "متصل أشعري يحتج بطفلته!\nإذا ربك عاجز لا نعبده",
            "sub": "متصل أشعري وشبهة النزول"
        },
        "cams": [{"from": 0.0, "to": dur, "cx": 934}],
        "zooms": [
            {"from": 10.0, "to": 20.0, "amt": 0.08},
            {"from": 45.0, "to": 60.0, "amt": 0.08},
            {"from": 88.0, "to": 110.0, "amt": 0.08}
        ],
        "items": [
            {
                "t": "word",
                "text": "الرحمن على العرش استوى",
                "at": 0.5,
                "until": 5.0,
                "x": 540,
                "y": 1580,
                "size": 44,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "المتصل: «سألت بنتي أين الله فقالت بلا مكان!»",
                "at": 8.0,
                "until": 16.0,
                "y": 1570,
                "size": 38
            },
            {
                "t": "word",
                "text": "ينزل ربنا إلى السماء الدنيا",
                "at": 25.0,
                "until": 32.0,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "cream"
            },
            {
                "t": "torn",
                "text": "«الله قادر على شق السماء والتصرف بها!»",
                "at": 48.0,
                "until": 58.0,
                "y": 1570,
                "size": 38
            },
            {
                "t": "word",
                "text": "إذا ربك عاجز فهذا إله لا نعبده!",
                "at": 65.0,
                "until": 75.0,
                "x": 540,
                "y": 1580,
                "size": 44,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "«والسماوات مطويات بيمينه سبحانه»",
                "at": 85.0,
                "until": 95.0,
                "y": 1570,
                "size": 40
            },
            {
                "t": "word",
                "text": "ينزل ولا تحيط به المخلوقات سبحانه",
                "at": 105.0,
                "until": 125.0,
                "x": 540,
                "y": 1580,
                "size": 40,
                "tone": "gold"
            }
        ],
        "words": words
    }
    with open("data/specs/s2_ashari_tifla_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    print("Updated data/specs/s2_ashari_tifla_reel.json")

def make_spec_quburi():
    dur = 161.93
    frames = 4858
    with open(".tmp/s2_quburi_sahaba_words.json", "r", encoding="utf-8") as f:
        words = json.load(f)
    
    spec = {
        "id": "s2_quburi_sahaba_reel",
        "title": "قبوري يدافع عن القبور ويصف الصحابة بالجهل والشيخ يقصفه قبحك الله يا قليل الأدب",
        "cut": "s2_quburi_sahaba_cut.mp4",
        "duration": dur,
        "frames": frames,
        "fps": 30,
        "showTitleBar": False,
        "cover": {
            "photo": "sheikh_gallery/black_white/sheikh_cov.png",
            "title": "قبوري يطعن في الصحابة!\nقبحك الله يا قليل الأدب",
            "sub": "متصل قبوري يصف الصحابة بالجهل"
        },
        "cams": [{"from": 0.0, "to": dur, "cx": 934}],
        "zooms": [
            {"from": 15.0, "to": 28.0, "amt": 0.08},
            {"from": 45.0, "to": 65.0, "amt": 0.08},
            {"from": 95.0, "to": 115.0, "amt": 0.08},
            {"from": 135.0, "to": 158.0, "amt": 0.08}
        ],
        "items": [
            {
                "t": "word",
                "text": "الدفاع الباطل عن عبادة القبور",
                "at": 0.5,
                "until": 5.0,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "cream"
            },
            {
                "t": "torn",
                "text": "المتصل: «شهدتم أن الصحابة كانوا جهالاً!»",
                "at": 14.0,
                "until": 22.0,
                "y": 1570,
                "size": 38
            },
            {
                "t": "word",
                "text": "قبحك الله! تأدب مع الصحابة!",
                "at": 25.0,
                "until": 35.0,
                "x": 540,
                "y": 1580,
                "size": 44,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "«الجاهل هو من يأتي ويقول عمر بن الخطاب جاهل!»",
                "at": 48.0,
                "until": 58.0,
                "y": 1570,
                "size": 36
            },
            {
                "t": "word",
                "text": "الصحابي يغيب عنه حديث فيبلغه غيره",
                "at": 68.0,
                "until": 78.0,
                "x": 540,
                "y": 1580,
                "size": 38,
                "tone": "cream"
            },
            {
                "t": "torn",
                "text": "«لعن الله اليهود والنصارى اتخذوا قبور أنبيائهم مساجد»",
                "at": 105.0,
                "until": 118.0,
                "y": 1570,
                "size": 36
            },
            {
                "t": "word",
                "text": "أخذتم بسنة اليهود ولعنة النبي ﷺ!",
                "at": 130.0,
                "until": 145.0,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "«وخالفتم كلام النبي وتقللون الأدب مع أصحابه!»",
                "at": 146.0,
                "until": 159.0,
                "y": 1570,
                "size": 36
            }
        ],
        "words": words
    }
    with open("data/specs/s2_quburi_sahaba_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    print("Updated data/specs/s2_quburi_sahaba_reel.json")

def make_spec_shia():
    dur = 152.27
    frames = 4568
    with open(".tmp/s2_shia_istislam_words.json", "r", encoding="utf-8") as f:
        words = json.load(f)
    
    spec = {
        "id": "s2_shia_istislam_reel",
        "title": "متصل شيعي يجادل في صفات الله فيفحمه الشيخ بروايات أئمته حتى أقر قائلا أنا أستسلم",
        "cut": "s2_shia_istislam_cut.mp4",
        "duration": dur,
        "frames": frames,
        "fps": 30,
        "showTitleBar": False,
        "cover": {
            "photo": "sheikh_gallery/black_white/sheikh_cov.png",
            "title": "متصل شيعي يفحمه الشيخ:\nأنا أستسلم يا شيخ!",
            "sub": "متصل شيعي يقر ويعلن استسلامه"
        },
        "cams": [{"from": 0.0, "to": dur, "cx": 934}],
        "zooms": [
            {"from": 10.0, "to": 22.0, "amt": 0.08},
            {"from": 45.0, "to": 65.0, "amt": 0.08},
            {"from": 88.0, "to": 110.0, "amt": 0.08},
            {"from": 125.0, "to": 150.0, "amt": 0.08}
        ],
        "items": [
            {
                "t": "word",
                "text": "روايات أئمة الشيعة في صفة الضحك",
                "at": 0.5,
                "until": 5.0,
                "x": 540,
                "y": 1580,
                "size": 40,
                "tone": "cream"
            },
            {
                "t": "torn",
                "text": "«كتاب الاختصاص: ثلاثة يضحك الله إليهم»",
                "at": 8.0,
                "until": 18.0,
                "y": 1570,
                "size": 38
            },
            {
                "t": "word",
                "text": "أمير المؤمنين علي بن أبي طالب يثبتها!",
                "at": 25.0,
                "until": 35.0,
                "x": 540,
                "y": 1580,
                "size": 40,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "المتصل يحاول الهروب: «هل تسميها حالاً؟»",
                "at": 65.0,
                "until": 75.0,
                "y": 1570,
                "size": 38
            },
            {
                "t": "word",
                "text": "لا أسميها إلا ما سماه الرسول ﷺ",
                "at": 88.0,
                "until": 98.0,
                "x": 540,
                "y": 1580,
                "size": 42,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "«يضحك ربنا ويغضب سبحانه وتعالى»",
                "at": 105.0,
                "until": 115.0,
                "y": 1570,
                "size": 42
            },
            {
                "t": "word",
                "text": "المتصل الشيعي: أنا أستسلم يا شيخ!",
                "at": 122.0,
                "until": 135.0,
                "x": 540,
                "y": 1580,
                "size": 44,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "المتصل: «أنا أستسلم وأشكرك جيداً على وقتك!»",
                "at": 136.0,
                "until": 150.0,
                "y": 1570,
                "size": 38
            }
        ],
        "words": words
    }
    with open("data/specs/s2_shia_istislam_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    print("Updated data/specs/s2_shia_istislam_reel.json")

os.makedirs("data/specs", exist_ok=True)
make_spec_kalb()
make_spec_tifla()
make_spec_quburi()
make_spec_shia()
print("\nAll 4 specs updated with y:1580 / y:1570 safe geometry!")
