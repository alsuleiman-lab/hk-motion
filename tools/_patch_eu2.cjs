const fs = require("fs");
const blockRe = (open) => new RegExp("[ \\t]*<Sc a=\\{" + open + "\\}[^>]*>[\\s\\S]*?</Sc>\\n");

// ---------------- portrait ----------------
let p = fs.readFileSync("src/EuPortrait.tsx", "utf8");
p = p.replace("<Card a={T_ITA2} b={T_BEL - 0.05} y={80} phase={2} />", "<Card a={T_ITA2} b={T_BEL - 0.05} phase={2} />");
p = p.replace(blockRe("T_ITA2"), `          <Sc a={T_ITA2} b={T_BEL - 0.05}>
            <Banner at={tw(5, 0)} x={50} y={90} w={980} text="إيطاليا: ضيق المعيشة" flag="it" size={56} />
            <StatRow at={tw(5, "ضيق")} x={60} y={250} w={960} h={200} icon="Wallet" label="ضيق في المعيشة" rot={-1} />
            <StatRow at={tw(5, "الأسعار")} x={60} y={480} w={960} h={200} icon="TrendingUp" label="الأسعار غالية" rot={1} />
            <StatRow at={tw(5, "الرواتب")} x={60} y={710} w={960} h={200} icon="Banknote" label="والرواتب لا تكفي" rot={-1} />
          </Sc>
`);
p = p.replace(blockRe("T_BEL"), `          <Sc a={T_BEL} b={T_LYON - 0.05}>
            <BClip n={3} at={T_BEL} dur={tw(11, "والشرطة") - 0.3 - T_BEL} x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} contain />
            <BClip n={5} at={tw(11, "والشرطة") - 0.3} dur={T_LYON - tw(11, "والشرطة") + 0.3} from={12} x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} fy={0.55} />
            <Banner at={T_BEL + 0.2} x={70} y={110} w={600} text="بلجيكا" flag="be" />
            <ChipG x={540} y={1000} size={50} phrases={[{ text: "التكاليف عالية", at: tw(11, "تكاليفها") }, { text: "مظاهرات في بلجيكا", at: tw(11, "بلجيكا") }, { text: "والشرطة تتدخل", at: tw(11, "والشرطة") }]} />
          </Sc>
`);
fs.writeFileSync("src/EuPortrait.tsx", p);

// ---------------- landscape ----------------
let l = fs.readFileSync("src/EuLandscape.tsx", "utf8");
l = l.replace(blockRe("T_C3"), `          <Sc a={T_C3} b={T_WAR - 0.05}>
            <Banner at={T_C3 + 0.2} x={rowX} y={90} w={rowW} text="إيطاليا: ضيق المعيشة" flag="it" size={56} />
            <StatRow at={tw(5, "ضيق")} x={rowX} y={270} w={rowW} h={200} icon="Wallet" label="ضيق في المعيشة" rot={-1} />
            <StatRow at={tw(5, "الأسعار")} x={rowX} y={500} w={rowW} h={200} icon="TrendingUp" label="الأسعار غالية" rot={1} />
            <StatRow at={tw(5, "الرواتب")} x={rowX} y={730} w={rowW} h={200} icon="Banknote" label="والرواتب لا تكفي" rot={-1} />
          </Sc>
`);
l = l.replace(blockRe("T_BEL"), `          <Sc a={T_BEL} b={T_3 - 0.05}>
            <BClip n={3} at={T_BEL} dur={tw(11, "والشرطة") - 0.3 - T_BEL} x={LP.x} y={LP.y} w={LP.w} h={LP.h} contain />
            <BClip n={5} at={tw(11, "والشرطة") - 0.3} dur={T_3 - tw(11, "والشرطة") + 0.3} from={12} x={LP.x} y={LP.y} w={LP.w} h={LP.h} fy={0.55} />
            <Banner at={T_BEL + 0.2} x={90} y={90} w={460} text="بلجيكا" flag="be" />
            <ChipG x={560} y={960} size={50} phrases={[{ text: "الجامعات: دخولها صعب", at: tw(9, "الجامعات") }, { text: "تكاليفها عالية", at: tw(11, "تكاليفها") }, { text: "مظاهرات في بلجيكا", at: tw(11, "بلجيكا") }]} />
          </Sc>
`);
fs.writeFileSync("src/EuLandscape.tsx", l);
console.log("ok", p.includes("إيطاليا: ضيق المعيشة"), l.includes("إيطاليا: ضيق المعيشة"));
