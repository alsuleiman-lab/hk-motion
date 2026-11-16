import fs from "node:fs";
import path from "node:path";

const root = "s:/AI_Tools/Remotion_Workspace";

// 1. Clip 1
function updateClip1() {
  const p = path.join(root, "src/Clip1SunPortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  if (!code.includes('import { StatRow } from "./EuKit";')) {
    code = 'import { StatRow } from "./EuKit";\n' + code;
  }

  // Replace lower section
  const lowerStart = code.indexOf("{/* LOWER SECTION: KINETIC CARDS");
  const footerIdx = code.indexOf("<StreamFooter />");
  if (lowerStart !== -1 && footerIdx !== -1) {
    const newLower = `{/* LOWER SECTION: Official StatRow Paper Cards (≤ 6 words) */}
      <div style={{ position: "absolute", top: 1610, left: 50, width: 980, height: 180, zIndex: 30 }}>
        {t < 53 && (
          <StatRow
            at={0.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="help-circle"
            label="سراج: هل تتوقف الشمس عن الجريان؟"
            sub="طرح الشبهة في المناظرة وتحدي المحاور"
            rot={-1}
          />
        )}
        {t >= 53 && t < 63 && (
          <StatRow
            at={53.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="message-circle"
            label="الشيخ: اسمعوا رده لما كان مسلماً!"
            sub="كان يرد بنفسه على نفس هذه الشبهة"
            rot={1}
          />
        )}
        {t >= 63 && t < 109 && (
          <StatRow
            at={63.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="book-open"
            label="سراج القديم: سجودها لا يقتضي توقفها!"
            sub="ادعاء سقيم.. ليس في الحديث أنها تتوقف الآن"
            rot={-1}
          />
        )}
        {t >= 109 && (
          <StatRow
            at={109.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="alert-triangle"
            label="الشيخ: شكل العقل راح لما ألحدت!"
            sub="سراج بعد الإفحام: هذا خارج محل النزاع!"
            rot={1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, lowerStart) + newLower + code.slice(footerIdx);
  }

  fs.writeFileSync(p, code, "utf8");
  console.log("Updated Clip 1 with StatRow cards");
}

// 2. Clip 2
function updateClip2() {
  const p = path.join(root, "src/Clip2TaaddudPortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  if (!code.includes('import { StatRow } from "./EuKit";')) {
    code = 'import { StatRow } from "./EuKit";\n' + code;
  }

  const lowerStart = code.indexOf("{/* LOWER SECTION");
  const footerIdx = code.indexOf("<StreamFooter />");
  if (lowerStart !== -1 && footerIdx !== -1) {
    const newLower = `{/* LOWER SECTION: Official StatRow Paper Cards (≤ 6 words) */}
      <div style={{ position: "absolute", top: 1040, left: 50, width: 980, height: 740, zIndex: 30 }}>
        <StatRow
          at={0.5}
          x={0}
          y={40}
          w={980}
          h={165}
          icon="help-circle"
          label="سؤال متابع: مو ناوي تعدد؟"
          sub="طرفة عفوية من أسئلة المتابعين في البث"
          rot={-1}
        />
        {t >= 14 && (
          <StatRow
            at={14.0}
            x={0}
            y={240}
            w={980}
            h={165}
            icon="shield"
            label="ليش تنامون برة؟ الأمر عادي!"
            sub="الرد العفوي على تعليقات المتابعين"
            rot={1}
          />
        )}
        {t >= 32 && (
          <StatRow
            at={32.0}
            x={0}
            y={440}
            w={980}
            h={175}
            icon="coins"
            label="تعدد مصادر دخلك.. التعدد زين!"
            sub="اللي ما يعدد مصادر دخله غلطان"
            rot={-1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, lowerStart) + newLower + code.slice(footerIdx);
  }

  fs.writeFileSync(p, code, "utf8");
  console.log("Updated Clip 2 with StatRow cards");
}

// 3. Clip 3
function updateClip3() {
  const p = path.join(root, "src/Clip3SunrisePortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  if (!code.includes('import { StatRow } from "./EuKit";')) {
    code = 'import { StatRow } from "./EuKit";\n' + code;
  }

  const lowerStart = code.indexOf("{/* LOWER SECTION");
  const footerIdx = code.indexOf("<StreamFooter />");
  if (lowerStart !== -1 && footerIdx !== -1) {
    const newLower = `{/* LOWER SECTION: Official StatRow Paper Cards (≤ 6 words) */}
      <div style={{ position: "absolute", top: 1040, left: 50, width: 980, height: 740, zIndex: 30 }}>
        <StatRow
          at={0.5}
          x={0}
          y={40}
          w={980}
          h={165}
          icon="sun"
          label="«طلعت الشمس وغربت» دلالة لغوية"
          sub="نسبة الفعل للشمس في عين الناظر"
          rot={-1}
        />
        {t >= 28 && (
          <StatRow
            at={28.0}
            x={0}
            y={240}
            w={980}
            h={165}
            icon="globe"
            label="كل لغات العالم تقول: Sunrise"
            sub="الإنجليزية والفرنسية تنسب الشروق للشمس"
            rot={1}
          />
        )}
        {t >= 58 && (
          <StatRow
            at={58.0}
            x={0}
            y={440}
            w={980}
            h={175}
            icon="book-open"
            label="القرآن يعبر بلغة البشر الحقيقية"
            sub="فكيف يريد للقرآن أن يتكلم بغير لغة البشر؟!"
            rot={-1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, lowerStart) + newLower + code.slice(footerIdx);
  }

  fs.writeFileSync(p, code, "utf8");
  console.log("Updated Clip 3 with StatRow cards");
}

// 4. Clip 4
function updateClip4() {
  const p = path.join(root, "src/Clip4ThronePortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  if (!code.includes('import { StatRow } from "./EuKit";')) {
    code = 'import { StatRow } from "./EuKit";\n' + code;
  }

  const lowerStart = code.indexOf("{/* LOWER SECTION");
  const footerIdx = code.indexOf("<StreamFooter />");
  if (lowerStart !== -1 && footerIdx !== -1) {
    const newLower = `{/* LOWER SECTION: Official StatRow Paper Cards (≤ 6 words) */}
      <div style={{ position: "absolute", top: 1040, left: 50, width: 980, height: 740, zIndex: 30 }}>
        <StatRow
          at={0.5}
          x={0}
          y={40}
          w={980}
          h={165}
          icon="help-circle"
          label="هل الشمس فوق العرش؟"
          sub="بيان عقدي دقيق من نصوص السنة الصحيحة"
          rot={-1}
        />
        {t >= 20 && (
          <StatRow
            at={20.0}
            x={0}
            y={240}
            w={980}
            h={175}
            icon="book-open"
            label="كتاب «إن رحمتي سبقت غضبي»"
            sub="المخلوق الوحيد الموضوع فوق العرش"
            rot={1}
          />
        )}
        {t >= 45 && (
          <StatRow
            at={45.0}
            x={0}
            y={440}
            w={980}
            h={165}
            icon="shield"
            label="سائر المخلوقات كلها تحت العرش"
            sub="الشمس وسائر الكون تحت عرش الرحمن"
            rot={-1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, lowerStart) + newLower + code.slice(footerIdx);
  }

  fs.writeFileSync(p, code, "utf8");
  console.log("Updated Clip 4 with StatRow cards");
}

// 5. Clip 5
function updateClip5() {
  const p = path.join(root, "src/Clip5TaslamPortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  if (!code.includes('import { StatRow } from "./EuKit";')) {
    code = 'import { StatRow } from "./EuKit";\n' + code;
  }

  const lowerStart = code.indexOf("{/* LOWER SECTION: KINETIC CARDS");
  const footerIdx = code.indexOf("<StreamFooter />");
  if (lowerStart !== -1 && footerIdx !== -1) {
    const newLower = `{/* LOWER SECTION: Official StatRow Paper Cards (≤ 6 words) */}
      <div style={{ position: "absolute", top: 1610, left: 50, width: 980, height: 180, zIndex: 30 }}>
        {t < 17.5 && (
          <StatRow
            at={0.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="help-circle"
            label="سراج: أظهر لي دراسة وسأسلم!"
            sub="تحدي في المناظرة ورد بكلمة خطيرة"
            rot={-1}
          />
        )}
        {t >= 17.5 && t < 45 && (
          <StatRow
            at={18.0}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="alert-triangle"
            label="المحاور: «لا نريدك أن تسلم!»"
            sub="الشيخ: فليتب لله.. هذا كلام خطير جداً!"
            rot={1}
          />
        )}
        {t >= 45 && t < 72 && (
          <StatRow
            at={45.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="shield-alert"
            label="لا تريده أن يسلم؟! رضا بالكفر!"
            sub="كونك لا تريد إنساناً أن يسلم خطيرة على دينك"
            rot={-1}
          />
        )}
        {t >= 72 && (
          <StatRow
            at={72.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="scale"
            label="لسنا في مناكفات.. هذا دين!"
            sub="فإن قلتها حقاً فهذا خطر عظيم.. فاحذر!"
            rot={1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, lowerStart) + newLower + code.slice(footerIdx);
  }

  fs.writeFileSync(p, code, "utf8");
  console.log("Updated Clip 5 with StatRow cards");
}

updateClip1();
updateClip2();
updateClip3();
updateClip4();
updateClip5();
console.log("All 5 clips updated to official StatRow paper cards!");
