import fs from "node:fs";
import path from "node:path";

const root = "s:/AI_Tools/Remotion_Workspace";

// 1. Clip 1
function updateClip1() {
  const p = path.join(root, "src/Clip1SunPortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  const startIdx = code.indexOf("{/* LOWER SECTION");
  const endIdx = code.indexOf("<StreamFooter />");
  if (startIdx !== -1 && endIdx !== -1) {
    const newSection = `{/* LOWER SECTION: Synchronized StatRow Cards (Exact Spoken Timings) */}
      <div style={{ position: "absolute", top: 1610, left: 50, width: 980, height: 180, zIndex: 30 }}>
        {t >= 0.5 && t < 53.6 && (
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
        {t >= 53.6 && t < 63.0 && (
          <StatRow
            at={53.6}
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
        {t >= 63.0 && t < 109.1 && (
          <StatRow
            at={63.0}
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
        {t >= 109.1 && (
          <StatRow
            at={109.1}
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
    code = code.slice(0, startIdx) + newSection + code.slice(endIdx);
    fs.writeFileSync(p, code, "utf8");
    console.log("Updated Clip 1 with exact spoken timings");
  }
}

// 2. Clip 2
function updateClip2() {
  const p = path.join(root, "src/Clip2TaaddudPortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  const startIdx = code.indexOf("{/* LOWER SECTION");
  const endIdx = code.indexOf("<StreamFooter />");
  if (startIdx !== -1 && endIdx !== -1) {
    const newSection = `{/* LOWER SECTION: Synchronized StatRow Cards (Exact Spoken Timings) */}
      <div style={{ position: "absolute", top: 1040, left: 50, width: 980, height: 740, zIndex: 30 }}>
        {t >= 0.5 && t < 9.7 && (
          <StatRow
            at={0.5}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="help-circle"
            label="سؤال متابع: مو ناوي تعدد؟"
            sub="طرفة عفوية من أسئلة المتابعين في البث"
            rot={-1}
          />
        )}
        {t >= 9.7 && t < 41.5 && (
          <StatRow
            at={9.7}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="shield"
            label="ليش تنامون برة؟ الأمر عادي!"
            sub="الشيخ: اللي ما يعدد غلطان.. وأحب التعدد!"
            rot={1}
          />
        )}
        {t >= 41.5 && t < 64.9 && (
          <StatRow
            at={41.5}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="coins"
            label="تعدد مصادر دخلك.. التعدد زين!"
            sub="لابد بالضرورة أن تعدد مصادر دخلك.. فاحذر البقاء على مصدر واحد!"
            rot={-1}
          />
        )}
        {t >= 64.9 && (
          <StatRow
            at={64.9}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="smile"
            label="طلعتونا عن الموضوع.. خلونا نرجع!"
            sub="الشيخ يضحك ويعيد البث إلى موضوعه الأساسي"
            rot={1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, startIdx) + newSection + code.slice(endIdx);
    fs.writeFileSync(p, code, "utf8");
    console.log("Updated Clip 2 with exact spoken timings");
  }
}

// 3. Clip 3
function updateClip3() {
  const p = path.join(root, "src/Clip3SunrisePortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  const startIdx = code.indexOf("{/* LOWER SECTION");
  const endIdx = code.indexOf("<StreamFooter />");
  if (startIdx !== -1 && endIdx !== -1) {
    const newSection = `{/* LOWER SECTION: Synchronized StatRow Cards (Exact Spoken Timings) */}
      <div style={{ position: "absolute", top: 1040, left: 50, width: 980, height: 740, zIndex: 30 }}>
        {t >= 0.5 && t < 43.5 && (
          <StatRow
            at={0.5}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="sun"
            label="«طلعت الشمس وغربت» دلالة لغوية"
            sub="نسبة الفعل للشمس في عين الناظر المشاهد"
            rot={-1}
          />
        )}
        {t >= 43.5 && t < 71.7 && (
          <StatRow
            at={43.5}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="help-circle"
            label="ماذا تسمي الشروق والغروب؟"
            sub="هل تقول فتلنا على الشمس أم طلعت الشمس؟"
            rot={1}
          />
        )}
        {t >= 71.7 && t < 83.1 && (
          <StatRow
            at={71.7}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="globe"
            label="كل لغات العالم تقول: Sunrise"
            sub="الإنجليزية والفرنسية تنسب الشروق للشمس"
            rot={-1}
          />
        )}
        {t >= 83.1 && (
          <StatRow
            at={83.1}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="book-open"
            label="القرآن يعبر بلغة البشر الحقيقية"
            sub="فكيف يريد للقرآن أن يتكلم بغير لغة البشر؟!"
            rot={1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, startIdx) + newSection + code.slice(endIdx);
    fs.writeFileSync(p, code, "utf8");
    console.log("Updated Clip 3 with exact spoken timings");
  }
}

// 4. Clip 4
function updateClip4() {
  const p = path.join(root, "src/Clip4ThronePortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  const startIdx = code.indexOf("{/* LOWER SECTION");
  const endIdx = code.indexOf("<StreamFooter />");
  if (startIdx !== -1 && endIdx !== -1) {
    const newSection = `{/* LOWER SECTION: Synchronized StatRow Cards (Exact Spoken Timings) */}
      <div style={{ position: "absolute", top: 1040, left: 50, width: 980, height: 740, zIndex: 30 }}>
        {t >= 0.5 && t < 17.6 && (
          <StatRow
            at={0.5}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="help-circle"
            label="مخلوق واحد فقط فوق العرش"
            sub="من يعرف هذا المخلوق الذي فوق العرش؟"
            rot={-1}
          />
        )}
        {t >= 17.6 && t < 46.0 && (
          <StatRow
            at={17.6}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="book-open"
            label="كتاب: «إن رحمتي سبقت غضبي»"
            sub="كتب الله كتاباً فهو عنده موضوع فوق العرش"
            rot={1}
          />
        )}
        {t >= 46.0 && t < 60.1 && (
          <StatRow
            at={46.0}
            x={0}
            y={20}
            w={980}
            h={175}
            icon="award"
            label="مقام النبي ﷺ يوم القيامة"
            sub="يجلسه الله سبحانه وتعالى معه تكريماً له"
            rot={-1}
          />
        )}
        {t >= 60.1 && (
          <StatRow
            at={60.1}
            x={0}
            y={20}
            w={980}
            h={165}
            icon="shield"
            label="سائر المخلوقات كلها تحت العرش"
            sub="الشمس وسائر الأجرام والكون تحت العرش"
            rot={1}
          />
        )}
      </div>\n\n      `;
    code = code.slice(0, startIdx) + newSection + code.slice(endIdx);
    fs.writeFileSync(p, code, "utf8");
    console.log("Updated Clip 4 with exact spoken timings");
  }
}

// 5. Clip 5
function updateClip5() {
  const p = path.join(root, "src/Clip5TaslamPortrait.tsx");
  let code = fs.readFileSync(p, "utf8");

  const startIdx = code.indexOf("{/* LOWER SECTION");
  const endIdx = code.indexOf("<StreamFooter />");
  if (startIdx !== -1 && endIdx !== -1) {
    const newSection = `{/* LOWER SECTION: Synchronized StatRow Cards (Exact Spoken Timings) */}
      <div style={{ position: "absolute", top: 1610, left: 50, width: 980, height: 180, zIndex: 30 }}>
        {t >= 0.5 && t < 16.0 && (
          <StatRow
            at={0.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="help-circle"
            label="سراج: أظهر لي دراسة وسأسلم!"
            sub="تحدي في المناظرة والمحاور يرد بكلمة خطيرة"
            rot={-1}
          />
        )}
        {t >= 16.0 && t < 36.5 && (
          <StatRow
            at={16.0}
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
        {t >= 36.5 && t < 85.8 && (
          <StatRow
            at={36.5}
            x={0}
            y={0}
            w={980}
            h={165}
            icon="shield-alert"
            label="لا تريده أن يسلم؟! رضا بالكفر!"
            sub="أنت تريده أن يكفر بالله؟ هذا أمر عظيم فاحذر!"
            rot={-1}
          />
        )}
        {t >= 85.8 && (
          <StatRow
            at={85.8}
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
    code = code.slice(0, startIdx) + newSection + code.slice(endIdx);
    fs.writeFileSync(p, code, "utf8");
    console.log("Updated Clip 5 with exact spoken timings");
  }
}

updateClip1();
updateClip2();
updateClip3();
updateClip4();
updateClip5();
console.log("All 5 clips updated to frame-accurate spoken timings!");
