const fs = require("fs");
let k = fs.readFileSync("src/EuKit.tsx", "utf8");
if (!k.includes("barkhaneHearing")) {
  k = k.replace("  euIsrael:", `  barkhaneHearing: "https://www.senat.fr/cra/s20210209/s20210209_2.html",
  be24: "https://brusselstimes.com/113800/belgian-defence-minister-expects-decision-on-f-16-deployment",
  be17: "https://airrecognition.com/index.php/news/defense-aviation-news/global-news-2017/june/3543-belgium-approves-6-month-extension-of-operation-desert-falcon.html",
  itCult: "https://documenti.camera.it/leg19/resoconti/commissioni/bollettini/html/2025/04/09/0307/allegato.htm",
  flanders: "https://www.vlaanderen.be/cjm/sites/default/files/2024-06/Field_Drawing_ICP_Flanders_DEF_ENG.pdf",
  itLgbt: "https://unar.it/portale/web/guest/w/avviso-pubblico-proroga-termini-selezione-progetti-2024",
  euIsrael:`);
  fs.writeFileSync("src/EuKit.tsx", k);
}

// ---------- portrait ----------
let p = fs.readFileSync("src/EuPortrait.tsx", "utf8");
p = p.replace(/T_FR = tw\(45\), T_CULT = tw\(55\), T_LGBT = tw\(62\), T_ITNUM = tw\(87\), T_BENUM = tw\(99\), T_END = tw\(116\)/, "T_FR = tw(1001), T_BENUM = tw(1019), T_CULT = tw(1025), T_LGBT = tw(1045), T_ISR = tw(1059), T_END = tw(116)");
const a = p.indexOf("{/* --- France: military operations + culture diplomacy --- */}"), b = p.indexOf("{/* --- conclusion on the full-screen speaker --- */}");
if (a < 0 || b < 0) throw new Error("portrait markers");
const SP = (arr) => `<Sources x={40} bottom={22} w={640} size={20} links={[${arr}]} />`;
const P = `{/* --- the wars: Chammal, Barkhane, Italy (from the correction recording) --- */}
          <Sc a={T_FR} b={T_BENUM - 0.05}>
            ${SP(`{ at: tw(1003, "شمال"), url: SRC.chammal }, { at: tw(1006, "برخان"), url: SRC.barkhaneHearing }, { at: tw(1011, "إيطاليا"), url: SRC.itOps }`)}
            <Banner at={T_FR + 0.1} x={50} y={90} w={980} text="حروب في الشرق الأوسط وإفريقيا" size={52} />
            <StatRow at={tw(1003, "شمال")} countAt={tw(1005, "ثلاثمية")} x={60} y={250} w={960} h={200} icon="Shield" label="فرنسا: عملية «شمال» 2025" sub="سوريا والعراق" flag="fr" to={322} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1006, "برخان")} countAt={tw(1007, "مليار")} x={60} y={480} w={960} h={200} icon="Swords" label="فرنسا: «برخان» (الساحل)" sub="نحو مليونَي يورو يومياً، بحسب متحدثين في الشيوخ" to={1} unit="مليار يورو سنوياً" rot={1} />
            <StatRow at={tw(1011, "إيطاليا")} countAt={tw(1012, "252")} x={60} y={710} w={960} h={200} icon="Globe" label="إيطاليا: العراق والشرق الأوسط" flag="it" to={252} unit="مليون يورو" rot={-1} />
          </Sc>
          <Sc a={T_BENUM} b={T_CULT - 0.05}>
            ${SP(`{ at: T_BENUM + 0.2, url: SRC.be24 }`)}
            <Banner at={T_BENUM + 0.1} x={50} y={90} w={980} text="بلجيكا: ضد داعش" flag="be" size={60} />
            <StatRow at={tw(1020, "أنفقت")} countAt={tw(1021, "24")} x={60} y={270} w={960} h={210} icon="Plane" label="طائرات F-16 (2020–2021)" sub="كلفة صافية" to={24} unit="مليون يورو" rot={-1} />
          </Sc>
          <Sc a={T_CULT} b={T_LGBT - 0.05}>
            ${SP(`{ at: T_CULT + 0.2, url: SRC.cultFr }`)}
            <Banner at={T_CULT + 0.1} x={50} y={90} w={980} text="نشر الثقافة: فرنسا" flag="fr" size={60} />
            <StatRow at={tw(1025, "86")} x={60} y={250} w={960} h={200} icon="Palette" label="التعاون الثقافي والترويج للفرنسية" sub="عام 2024" to={86} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1029, "806")} x={60} y={480} w={960} h={200} icon="Landmark" label="البرنامج الثقافي كله" sub="عام 2024" to={806} unit="مليون يورو" rot={1} />
          </Sc>
          <Sc a={T_LGBT} b={T_ISR - 0.05}>
            ${SP(`{ at: T_LGBT + 0.2, url: SRC.lgbtFr }`)}
            <Banner at={T_LGBT + 0.1} x={50} y={90} w={980} text="فرنسا: دعم المثلية الجنسية" flag="fr" size={56} />
            <StatRow at={tw(1046, "29")} x={60} y={250} w={960} h={200} icon="Calendar" label="بين 2017 و2022" to={29} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1047, "10")} x={60} y={480} w={960} h={200} icon="Calendar" label="السنوات الثلاث التالية" sub="مبلغ إضافي معلن" to={10} unit="ملايين يورو" rot={1} />
          </Sc>
          <Sc a={T_ISR} b={T_END - 0.05}>
            ${SP(`{ at: T_ISR + 0.2, url: SRC.euIsrael }`)}
            <Banner at={T_ISR + 0.1} x={50} y={90} w={980} text="دعم إسرائيل" flag="il" size={60} />
            <StatRow at={tw(1059, "نتنياهو")} x={60} y={250} w={960} h={210} icon="User" label="برنامج لدعم حكومة نتنياهو" sub="الدول الثلاث مجتمعة" photo="eu/people/netanyahu.jpg" rot={-1} />
            <StatRow at={tw(1060, "عشرة")} x={60} y={490} w={960} h={200} icon="Banknote" label="إجمالي أوروبي مشترك (2024)" sub="يُقسَّم على الدول الأوروبية" to={10} unit="ملايين يورو" rot={1} />
          </Sc>
          `;
p = p.slice(0, a) + P + p.slice(b);
fs.writeFileSync("src/EuPortrait.tsx", p);

// ---------- landscape ----------
let l = fs.readFileSync("src/EuLandscape.tsx", "utf8");
l = l.replace(/T_FR = tw\(44\), T_EDU = tw\(59\), T_LG = tw\(62\), T_IT = tw\(87\), T_BE = tw\(99\), T_WHY/, "T_FR = tw(1001), T_BE = tw(1019), T_CU = tw(1023), T_LG = tw(1045), T_IS = tw(1059), T_WHY");
const la = l.indexOf("{/* France */}"), lb = l.indexOf("{/* why pump this money abroad */}");
if (la < 0 || lb < 0) throw new Error("landscape markers");
const SL = (arr) => `<Sources x={60} bottom={14} size={26} w={1000} links={[${arr}]} />`;
const L = `{/* the wars (correction recording): Chammal, Barkhane, Italy */}
          <Sc a={T_FR} b={T_BE - 0.05}>
            ${SL(`{ at: tw(1003, "شمال"), url: SRC.chammal }, { at: tw(1006, "برخان"), url: SRC.barkhaneHearing }, { at: tw(1011, "إيطاليا"), url: SRC.itOps }`)}
            <Banner at={T_FR + 0.1} x={rowX} y={70} w={rowW} text="حروب في الشرق الأوسط وإفريقيا" size={54} />
            <StatRow at={tw(1003, "شمال")} countAt={tw(1005, "ثلاثمية")} x={rowX} y={230} w={rowW} h={190} icon="Shield" label="فرنسا: عملية «شمال» 2025" sub="سوريا والعراق" flag="fr" to={322} unit="مليون يورو" rot={-1} big={84} />
            <StatRow at={tw(1006, "برخان")} countAt={tw(1007, "مليار")} x={rowX} y={450} w={rowW} h={190} icon="Swords" label="فرنسا: «برخان» (الساحل)" sub="نحو مليونَي يورو يومياً، بحسب متحدثين في الشيوخ" to={1} unit="مليار يورو سنوياً" rot={1} big={84} />
            <StatRow at={tw(1011, "إيطاليا")} countAt={tw(1012, "252")} x={rowX} y={670} w={rowW} h={190} icon="Globe" label="إيطاليا: العراق والشرق الأوسط" flag="it" to={252} unit="مليون يورو" rot={-1} big={84} />
            <Stamp at={tw(1018, "وشعبها")} x={330} y={900} text="وشعبها يتظاهر" size={54} />
          </Sc>
          <Sc a={T_BE} b={T_CU - 0.05}>
            ${SL(`{ at: T_BE + 0.2, url: SRC.be24 }, { at: tw(1022, "17"), url: SRC.be17 }`)}
            <Banner at={T_BE + 0.1} x={rowX} y={70} w={rowW} text="بلجيكا: ضد داعش" flag="be" size={58} />
            <StatRow at={tw(1020, "أنفقت")} countAt={tw(1021, "24")} x={rowX} y={250} w={rowW} h={200} icon="Plane" label="طائرات F-16 (2020–2021)" sub="كلفة صافية" to={24} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1022, "17")} x={rowX} y={480} w={rowW} h={200} icon="Plane" label="تمديد المهمة (2017)" to={17} unit="مليون يورو" rot={1} />
          </Sc>
          {/* culture */}
          <Sc a={T_CU} b={T_LG - 0.05}>
            ${SL(`{ at: tw(1025, "86"), url: SRC.cultFr }, { at: tw(1037, "تسعين"), url: SRC.itCult }, { at: tw(1040, 0), url: SRC.flanders }`)}
            <Banner at={T_CU + 0.1} x={rowX} y={50} w={rowW} text="نشر الثقافة خارج الدول" size={54} />
            <StatRow at={tw(1025, "86")} x={rowX} y={185} w={rowW} h={140} icon="Palette" label="فرنسا: التعاون الثقافي (2024)" flag="fr" to={86} unit="مليون يورو" rot={-1} big={70} />
            <StatRow at={tw(1029, "806")} x={rowX} y={340} w={rowW} h={140} icon="Landmark" label="فرنسا: البرنامج الثقافي كله" flag="fr" to={806} unit="مليون يورو" rot={1} big={70} />
            <StatRow at={tw(1037, "تسعين")} x={rowX} y={495} w={rowW} h={140} icon="Languages" label="إيطاليا: الترويج اللغوي والثقافي" flag="it" to={90} unit="مليون يورو" rot={-1} big={70} />
            <StatRow at={tw(1038, "سبعين")} x={rowX} y={650} w={rowW} h={140} icon="GraduationCap" label="إيطاليا: رواتب مدارسها بالخارج" flag="it" to={70} unit="مليون يورو" rot={1} big={70} />
            <StatRow at={tw(1041, "657")} x={rowX} y={805} w={rowW} h={140} icon="Palette" label="بلجيكا (فلاندرز): منح ثقافية سنوياً" flag="be" sub="بين 657 ألفاً ومليون يورو" rot={-1} big={70} />
          </Sc>
          {/* LGBT */}
          <Sc a={T_LG} b={T_IS - 0.05}>
            ${SL(`{ at: T_LG + 0.2, url: SRC.lgbtFr }, { at: tw(1049, "6"), url: SRC.itLgbt }`)}
            <Banner at={T_LG + 0.1} x={rowX} y={70} w={rowW} text="دعم المثلية الجنسية" size={58} />
            <StatRow at={tw(1046, "29")} x={rowX} y={230} w={rowW} h={170} icon="Calendar" label="فرنسا: بين 2017 و2022" flag="fr" to={29} unit="مليون يورو" rot={-1} />
            <StatRow at={tw(1047, "10")} x={rowX} y={420} w={rowW} h={170} icon="Calendar" label="فرنسا: السنوات الثلاث التالية" flag="fr" to={10} unit="ملايين يورو" rot={1} />
            <StatRow at={tw(1049, "6")} x={rowX} y={610} w={rowW} h={170} icon="Home" label="إيطاليا: مراكز داخل إيطاليا" flag="it" to={6} unit="ملايين يورو" rot={-1} />
            <StatRow at={tw(1051, "أرقام")} x={rowX} y={800} w={rowW} h={150} icon="SearchX" label="بلجيكا: لا أرقام تضاهيها" flag="be" rot={1} />
          </Sc>
          {/* Israel */}
          <Sc a={T_IS} b={T_WHY - 0.05}>
            ${SL(`{ at: T_IS + 0.2, url: SRC.euIsrael }`)}
            <Banner at={T_IS + 0.1} x={rowX} y={70} w={rowW} text="دعم إسرائيل" flag="il" size={58} />
            <StatRow at={tw(1059, "نتنياهو")} x={rowX} y={240} w={rowW} h={190} icon="Flag" label="برنامج دعم الحكومة الإسرائيلية" sub="الدول الثلاث مجتمعة" flag="il" rot={-1} />
            <StatRow at={tw(1060, "عشرة")} x={rowX} y={460} w={rowW} h={200} icon="Banknote" label="إجمالي أوروبي مشترك (2024)" sub="يُقسَّم على الدول الأوروبية" to={10} unit="ملايين يورو" rot={1} />
            <StatRow at={tw(1062, "الدعم")} x={rowX} y={690} w={rowW} h={170} icon="HelpCircle" label="والدعم غير المباشر؟" sub="لا ندري كم يُقدَّر" rot={-1} />
          </Sc>
          `;
l = l.slice(0, la) + L + l.slice(lb);
fs.writeFileSync("src/EuLandscape.tsx", l);
console.log("patched");
