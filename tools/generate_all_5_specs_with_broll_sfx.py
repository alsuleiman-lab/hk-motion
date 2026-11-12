import json

def build_all_5():
    # ==========================================================
    # 1. s2_ashari_kalb_reel (177.43s, 5323 frames)
    # ==========================================================
    with open("data/specs/s2_ashari_kalb_reel.json", encoding="utf-8") as f:
        s1 = json.load(f)
    s1["showTitleBar"] = False
    if "cover" in s1: del s1["cover"]
    s1["sfx"] = [
        { "src": "sfx/whoosh.wav", "at": 14.2, "vol": 0.05 },
        { "src": "sfx/pop.wav", "at": 30.8, "vol": 0.05 },
        { "src": "sfx/knock.wav", "at": 85.8, "vol": 0.06 },
        { "src": "sfx/whoosh.wav", "at": 135.2, "vol": 0.05 },
        { "src": "sfx/shutter.wav", "at": 146.0, "vol": 0.06 },
        { "src": "sfx/pop.wav", "at": 156.0, "vol": 0.05 },
        { "src": "sfx/knock.wav", "at": 168.0, "vol": 0.06 }
    ]
    s1["items"] = [
        # B-roll: Night sky & stars (direction & cosmos)
        {
            "t": "full",
            "src": "stock/broll_night_sky.mp4",
            "from": 14.2,
            "to": 21.0,
            "box": { "x": 0, "y": 0, "w": 1080, "h": 960, "plain": True }
        },
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
        # Image: Book of Hadith / Creed
        {
            "t": "tphoto",
            "src": "assets_stream/img_1.png",
            "name": "صحيح البخاري — كتاب التوحيد",
            "at": 85.8,
            "until": 93.0,
            "x": 60,
            "y": 1400,
            "w": 340,
            "h": 420
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
        json.dump(s1, f, ensure_ascii=False, indent=2)
    print("Updated s2_ashari_kalb_reel.json with B-roll & SFX")

    # ==========================================================
    # 2. s2_ashari_tifla_reel (128.93s, 3868 frames)
    # ==========================================================
    with open("data/specs/s2_ashari_tifla_reel.json", encoding="utf-8") as f:
        s2 = json.load(f)
    s2["showTitleBar"] = False
    if "cover" in s2: del s2["cover"]
    s2["sfx"] = [
        { "src": "sfx/whoosh.wav", "at": 3.6, "vol": 0.05 },
        { "src": "sfx/pop.wav", "at": 18.9, "vol": 0.05 },
        { "src": "sfx/whoosh.wav", "at": 58.5, "vol": 0.05 },
        { "src": "sfx/pop.wav", "at": 87.0, "vol": 0.05 },
        { "src": "sfx/knock.wav", "at": 97.8, "vol": 0.06 },
        { "src": "sfx/shutter.wav", "at": 114.0, "vol": 0.06 }
    ]
    s2["items"] = [
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
        # B-roll: Night sky and stars for descent in the last third of the night!
        {
            "t": "full",
            "src": "stock/broll_night_sky.mp4",
            "from": 58.5,
            "to": 66.0,
            "box": { "x": 0, "y": 0, "w": 1080, "h": 960, "plain": True }
        },
        # Image: Sahih Bukhari Hadith of Descent
        {
            "t": "tphoto",
            "src": "assets_stream/img_1.png",
            "name": "صحيح البخاري — حديث النزول",
            "at": 59.0,
            "until": 66.0,
            "x": 60,
            "y": 1400,
            "w": 340,
            "h": 420
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
        # B-roll: Majestic Galaxy / Universe for "والسماوات مطويات بيمينه"
        {
            "t": "full",
            "src": "stock/broll_galaxy.mp4",
            "from": 114.0,
            "to": 122.0,
            "box": { "x": 0, "y": 0, "w": 1080, "h": 960, "plain": True }
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
        json.dump(s2, f, ensure_ascii=False, indent=2)
    print("Updated s2_ashari_tifla_reel.json with B-roll & SFX")

    # ==========================================================
    # 3. s2_quburi_sahaba_reel (161.93s, 4858 frames)
    # ==========================================================
    with open("data/specs/s2_quburi_sahaba_reel.json", encoding="utf-8") as f:
        s3 = json.load(f)
    s3["showTitleBar"] = False
    if "cover" in s3: del s3["cover"]
    s3["sfx"] = [
        { "src": "sfx/whoosh.wav", "at": 5.2, "vol": 0.05 },
        { "src": "sfx/pop.wav", "at": 27.5, "vol": 0.05 },
        { "src": "sfx/pop.wav", "at": 58.0, "vol": 0.05 },
        { "src": "sfx/knock.wav", "at": 103.0, "vol": 0.06 },
        { "src": "sfx/shutter.wav", "at": 126.5, "vol": 0.06 },
        { "src": "sfx/knock.wav", "at": 148.0, "vol": 0.06 }
    ]
    s3["items"] = [
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
        # B-roll: Cemetery tombstones for Hadith cursing shrines over graves
        {
            "t": "full",
            "src": "stock/broll_cemetery.mp4",
            "from": 126.5,
            "to": 136.0,
            "box": { "x": 0, "y": 0, "w": 1080, "h": 960, "plain": True }
        },
        # Image: Sahih Bukhari
        {
            "t": "tphoto",
            "src": "assets_stream/img_1.png",
            "name": "صحيح البخاري — تحريم المساجد على القبور",
            "at": 127.0,
            "until": 135.0,
            "x": 60,
            "y": 1400,
            "w": 340,
            "h": 420
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
        json.dump(s3, f, ensure_ascii=False, indent=2)
    print("Updated s2_quburi_sahaba_reel.json with B-roll & SFX")

    # ==========================================================
    # 4. s2_shia_istislam_reel (152.27s, 4568 frames)
    # ==========================================================
    with open("data/specs/s2_shia_istislam_reel.json", encoding="utf-8") as f:
        s4 = json.load(f)
    s4["showTitleBar"] = False
    if "cover" in s4: del s4["cover"]
    s4["sfx"] = [
        { "src": "sfx/pop.wav", "at": 2.8, "vol": 0.05 },
        { "src": "sfx/whoosh.wav", "at": 26.3, "vol": 0.05 },
        { "src": "sfx/pop.wav", "at": 45.7, "vol": 0.05 },
        { "src": "sfx/whoosh.wav", "at": 84.6, "vol": 0.05 },
        { "src": "sfx/shutter.wav", "at": 138.1, "vol": 0.06 },
        { "src": "sfx/chime.wav", "at": 144.6, "vol": 0.06 }
    ]
    s4["items"] = [
        # Image: Kitab al-Ikhtisas by Sheikh al-Mufid
        {
            "t": "tphoto",
            "src": "assets_stream/img_3.jpg",
            "name": "كتاب الاختصاص — الشيخ المفيد",
            "at": 2.8,
            "until": 12.0,
            "x": 60,
            "y": 1400,
            "w": 340,
            "h": 420
        },
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
        # Image: Bihar al-Anwar by Majlisi
        {
            "t": "tphoto",
            "src": "assets_stream/img_2.jpg",
            "name": "بحار الأنوار — المجلسي",
            "at": 45.7,
            "until": 56.0,
            "x": 60,
            "y": 1400,
            "w": 340,
            "h": 420
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
        json.dump(s4, f, ensure_ascii=False, indent=2)
    print("Updated s2_shia_istislam_reel.json with Images & SFX")

    # ==========================================================
    # 5. s2_ashari_kufr_deen_reel (112.53s, 3376 frames)
    # ==========================================================
    s5 = {
        "id": "s2_ashari_kufr_deen_reel",
        "title": "إحراج متصل أشعري يصف حديث النزول بالكفر والشيخ يقصفه كفرنا بدينكم المؤول",
        "cut": "s2_ashari_kufr_deen_cut.mp4",
        "duration": 112.53,
        "frames": 3376,
        "fps": 30,
        "showTitleBar": False,
        "cams": [
            { "from": 0.0, "to": 112.53, "cx": 934 }
        ],
        "zooms": [
            { "from": 11.0, "to": 20.0, "amt": 0.08 },
            { "from": 53.0, "to": 66.0, "amt": 0.08 },
            { "from": 74.0, "to": 95.0, "amt": 0.08 }
        ],
        "sfx": [
            { "src": "sfx/whoosh.wav", "at": 3.7, "vol": 0.05 },
            { "src": "sfx/pop.wav", "at": 18.2, "vol": 0.05 },
            { "src": "sfx/knock.wav", "at": 63.5, "vol": 0.06 },
            { "src": "sfx/shutter.wav", "at": 76.5, "vol": 0.06 },
            { "src": "sfx/whoosh.wav", "at": 88.9, "vol": 0.05 },
            { "src": "sfx/knock.wav", "at": 100.3, "vol": 0.06 }
        ],
        "items": [
            # B-roll: Night sky & stars for Hadith of descent
            {
                "t": "full",
                "src": "stock/broll_night_sky.mp4",
                "from": 3.7,
                "to": 11.5,
                "box": { "x": 0, "y": 0, "w": 1080, "h": 960, "plain": True }
            },
            # Image: Sahih Bukhari Hadith of Descent
            {
                "t": "tphoto",
                "src": "assets_stream/img_1.png",
                "name": "صحيح البخاري — حديث النزول",
                "at": 4.0,
                "until": 11.0,
                "x": 60,
                "y": 1400,
                "w": 340,
                "h": 420
            },
            {
                "t": "word",
                "text": "الشيخ: «النبي ﷺ قال: ينزل ربنا إلى سماء الدنيا»",
                "at": 3.7,
                "until": 11.0,
                "x": 540,
                "y": 1580,
                "size": 38,
                "tone": "gold"
            },
            {
                "t": "word",
                "text": "«الذي يقول ينزل ربنا إلى سماء الدنيا.. قوله كفري؟!»",
                "at": 15.0,
                "until": 23.0,
                "x": 540,
                "y": 1580,
                "size": 38,
                "tone": "cream"
            },
            {
                "t": "word",
                "text": "«أنا آخذ النص على ظاهره.. ظاهره كفر أم لا؟»",
                "at": 53.5,
                "until": 59.0,
                "x": 540,
                "y": 1580,
                "size": 40,
                "tone": "cream"
            },
            {
                "t": "torn",
                "text": "المتصل الأشعري: «نعم هذا الظاهر ظاهر كفر!»",
                "at": 63.5,
                "until": 73.0,
                "y": 1570,
                "size": 40
            },
            # B-roll: Galaxy & Universe for refutation and defense of God's Highness
            {
                "t": "full",
                "src": "stock/broll_galaxy.mp4",
                "from": 76.5,
                "to": 88.0,
                "box": { "x": 0, "y": 0, "w": 1080, "h": 960, "plain": True }
            },
            {
                "t": "torn",
                "text": "الشيخ: «شكراً لك! كفرنا بدينكم المؤول المعطل لله!»",
                "at": 76.5,
                "until": 85.0,
                "y": 1570,
                "size": 38
            },
            {
                "t": "word",
                "text": "«وأنا بريء من دينكم، مؤمن بدين النبي ﷺ!»",
                "at": 85.0,
                "until": 91.0,
                "x": 540,
                "y": 1580,
                "size": 40,
                "tone": "gold"
            },
            {
                "t": "torn",
                "text": "«اللهم إني كفرت بما يقوله هذا الإنسان، وآمنت بك وبنبيك!»",
                "at": 88.9,
                "until": 98.0,
                "y": 1570,
                "size": 36
            },
            {
                "t": "word",
                "text": "«واتبعت قول النبي ﷺ على ظاهره الذي تزعم أنه كفر!»",
                "at": 100.3,
                "until": 110.0,
                "x": 540,
                "y": 1580,
                "size": 38,
                "tone": "gold"
            }
        ]
    }
    with open("data/specs/s2_ashari_kufr_deen_reel.json", "w", encoding="utf-8") as f:
        json.dump(s5, f, ensure_ascii=False, indent=2)
    print("Created s2_ashari_kufr_deen_reel.json with B-roll, Images & SFX")

if __name__ == "__main__":
    build_all_5()

