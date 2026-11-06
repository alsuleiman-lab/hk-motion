import json

def update_specs():
    # 1. s2_ashari_kalb_reel
    with open("data/specs/s2_ashari_kalb_reel.json", encoding="utf-8") as f:
        spec1 = json.load(f)
    if "cover" in spec1:
        del spec1["cover"]
    spec1["showTitleBar"] = False
    spec1["items"] = [
        {
            "t": "torn",
            "text": "الشيخ: «هل والدك كالكلب لأنهما في جهة؟!»",
            "at": 14.2,
            "until": 21.0,
            "y": 1570,
            "size": 38
        },
        {
            "t": "word",
            "text": "«إذا أثبت لوالدك الجهة سيكون كمثل الكلب؟!»",
            "at": 30.8,
            "until": 37.5,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "cream"
        },
        {
            "t": "torn",
            "text": "المتصل الأشعري: «والدي كالكلب في كونه في جهة!»",
            "at": 85.8,
            "until": 93.0,
            "y": 1570,
            "size": 38
        },
        {
            "t": "torn",
            "text": "المتصل: «يد الخنزير ويد معبودك هل بينهما قدر مشترك؟!»",
            "at": 135.2,
            "until": 143.0,
            "y": 1570,
            "size": 36
        },
        {
            "t": "word",
            "text": "الشيخ: «نعوذ بالله منك ومن عقيدتك.. كافر زنديق!»",
            "at": 146.0,
            "until": 153.0,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "gold"
        },
        {
            "t": "word",
            "text": "«علم الكلام شتم لرب العالمين تبارك وتعالى!»",
            "at": 156.0,
            "until": 164.0,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "cream"
        },
        {
            "t": "torn",
            "text": "«شتم والده وجعله كالكلب ليلتزم كلاماً فاسداً!»",
            "at": 168.0,
            "until": 176.0,
            "y": 1570,
            "size": 38
        }
    ]
    with open("data/specs/s2_ashari_kalb_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec1, f, ensure_ascii=False, indent=2)
    print("Updated s2_ashari_kalb_reel.json")

    # 2. s2_ashari_tifla_reel
    with open("data/specs/s2_ashari_tifla_reel.json", encoding="utf-8") as f:
        spec2 = json.load(f)
    if "cover" in spec2:
        del spec2["cover"]
    spec2["showTitleBar"] = False
    spec2["items"] = [
        {
            "t": "word",
            "text": "«الرَّحْمَٰنُ عَلَى الْعَرْشِ اسْتَوَىٰ»",
            "at": 3.6,
            "until": 7.5,
            "x": 540,
            "y": 1580,
            "size": 44,
            "tone": "gold"
        },
        {
            "t": "torn",
            "text": "المتصل الأشعري: «سألت بنتي أين الله فقالت بلا مكان!»",
            "at": 18.9,
            "until": 25.5,
            "y": 1570,
            "size": 38
        },
        {
            "t": "word",
            "text": "«يَنْزِلُ رَبُّنَا إِلَى السَّمَاءِ الدُّنْيَا»",
            "at": 58.5,
            "until": 66.0,
            "x": 540,
            "y": 1580,
            "size": 42,
            "tone": "cream"
        },
        {
            "t": "word",
            "text": "«هل الله قادر عندك على أن يشق السماء وينزل؟»",
            "at": 87.0,
            "until": 93.5,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "cream"
        },
        {
            "t": "torn",
            "text": "الشيخ: «إذا ربك عاجز فهذا إله لا نعبده!»",
            "at": 97.8,
            "until": 106.0,
            "y": 1570,
            "size": 40
        },
        {
            "t": "torn",
            "text": "«وَالسَّمَاوَاتُ مَطْوِيَّاتٌ بِيَمِينِهِ» فالله قادر على طيها!",
            "at": 114.0,
            "until": 122.0,
            "y": 1570,
            "size": 38
        },
        {
            "t": "word",
            "text": "«قادر على أن ينزل ولا يكون محدوداً بها سبحانه»",
            "at": 123.5,
            "until": 128.5,
            "x": 540,
            "y": 1580,
            "size": 38,
            "tone": "gold"
        }
    ]
    with open("data/specs/s2_ashari_tifla_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec2, f, ensure_ascii=False, indent=2)
    print("Updated s2_ashari_tifla_reel.json")

    # 3. s2_quburi_sahaba_reel
    with open("data/specs/s2_quburi_sahaba_reel.json", encoding="utf-8") as f:
        spec3 = json.load(f)
    if "cover" in spec3:
        del spec3["cover"]
    spec3["showTitleBar"] = False
    spec3["items"] = [
        {
            "t": "torn",
            "text": "المتصل القبوري: «الصحابة كانوا جاهلين بهذا الأمر!»",
            "at": 5.2,
            "until": 12.0,
            "y": 1570,
            "size": 38
        },
        {
            "t": "word",
            "text": "«لا يجيء واحد تافه يقول شهدتم أن الصحابة جهال!»",
            "at": 27.5,
            "until": 35.0,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "cream"
        },
        {
            "t": "word",
            "text": "«الصحابي يغيب عنه الحديث فيسأل عنه أصحابه»",
            "at": 58.0,
            "until": 66.0,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "cream"
        },
        {
            "t": "torn",
            "text": "الشيخ: «قبحك الله يا قليل الأدب! تأدب مع أصحاب النبي ﷺ!»",
            "at": 103.0,
            "until": 112.0,
            "y": 1570,
            "size": 38
        },
        {
            "t": "word",
            "text": "«لَعَنَ اللَّهُ الْيَهُودَ وَالنَّصَارَى اتَّخَذُوا قُبُورَ أَنْبِيَائِهِمْ مَسَاجِدَ»",
            "at": 126.5,
            "until": 136.0,
            "x": 540,
            "y": 1580,
            "size": 38,
            "tone": "gold"
        },
        {
            "t": "torn",
            "text": "«أخذتم بسنة اليهود ولعنة النبي وتقللون الأدب مع أصحابه!»",
            "at": 148.0,
            "until": 160.0,
            "y": 1570,
            "size": 38
        }
    ]
    with open("data/specs/s2_quburi_sahaba_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec3, f, ensure_ascii=False, indent=2)
    print("Updated s2_quburi_sahaba_reel.json")

    # 4. s2_shia_istislam_reel
    with open("data/specs/s2_shia_istislam_reel.json", encoding="utf-8") as f:
        spec4 = json.load(f)
    if "cover" in spec4:
        del spec4["cover"]
    spec4["showTitleBar"] = False
    spec4["items"] = [
        {
            "t": "torn",
            "text": "«كتاب الاختصاص: قال أمير المؤمنين: ثلاثة يضحك الله إليهم»",
            "at": 2.8,
            "until": 12.0,
            "y": 1570,
            "size": 38
        },
        {
            "t": "word",
            "text": "«أمير المؤمنين علي رضي الله عنه أثبت لله صفة الضحك»",
            "at": 26.3,
            "until": 34.0,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "cream"
        },
        {
            "t": "word",
            "text": "المتصل الشيعي: «في بحار الأنوار غضب الله عقابه وفرحه رحمته»",
            "at": 45.7,
            "until": 56.0,
            "x": 540,
            "y": 1580,
            "size": 38,
            "tone": "cream"
        },
        {
            "t": "torn",
            "text": "الشيخ: «قال علي هذا الكلام ولم يقل إنه على سبيل المجاز!»",
            "at": 84.6,
            "until": 93.0,
            "y": 1570,
            "size": 38
        },
        {
            "t": "word",
            "text": "«لا أسميها إلا ما سماه الرسول ﷺ: يضحك ربنا ويغضب!»",
            "at": 138.1,
            "until": 144.5,
            "x": 540,
            "y": 1580,
            "size": 40,
            "tone": "gold"
        },
        {
            "t": "torn",
            "text": "المتصل الشيعي: «أنا أستسلم يا شيخ وأشكرك جيداً على وقتك!»",
            "at": 144.6,
            "until": 152.0,
            "y": 1570,
            "size": 38
        }
    ]
    with open("data/specs/s2_shia_istislam_reel.json", "w", encoding="utf-8") as f:
        json.dump(spec4, f, ensure_ascii=False, indent=2)
    print("Updated s2_shia_istislam_reel.json")

if __name__ == "__main__":
    update_specs()
