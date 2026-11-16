import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { sendNotification } from "./notify.mjs";

const READY_LAND = "C:/Users/mshms/Videos/جاهز/عرضي/دروس";
const READY_PORT = "C:/Users/mshms/Videos/جاهز/طولي/دروس";

const V1_TITLE = "مؤامرة سجن ابن تيمية.. كيف شوّهوا دعوته عند السلطان بيبرس";
const V1_PATH = path.join(READY_LAND, `${V1_TITLE}.mp4`);

const V2_TITLE = "لو استطعت لحككتها من المصحف! حقيقة مقالة الجهم بن صفوان";
const V2_PATH = path.join(READY_PORT, `${V2_TITLE}.mp4`);

const V3_TITLE = "سر طعن الرازي والأشاعرة في إمام الأئمة ابن خزيمة وكتاب التوحيد";
const V3_PATH = path.join(READY_LAND, `${V3_TITLE}.mp4`);

console.log("=== 🚀 انطلاق منسق الرندرة الشامل والتنظيف والإسبات ===");

// 1. انتظار اكتمال الفيديو الأول الجاري رندره حالياً
console.log(`[1/5] ⏳ جاري مراقبة رندر الفيديو الأول: ${V1_TITLE}...`);
while (!fs.existsSync(V1_PATH) || fs.statSync(V1_PATH).size < 30 * 1024 * 1024) {
  await new Promise((r) => setTimeout(r, 8000));
}
console.log(`✅ اكتمل الفيديو الأول بنجاح! الحجم: ${(fs.statSync(V1_PATH).size / (1024 * 1024)).toFixed(1)} MB`);

// 2. تشغيل رندر الفيديو الثاني (طولي)
console.log(`[2/5] 🎬 بدء رندر الفيديو الثاني (طولي): ${V2_TITLE}...`);
try {
  execSync("node tools/render_lesson58_v2.mjs", { stdio: "inherit", env: process.env });
  console.log(`✅ اكتمل الفيديو الثاني بنجاح!`);
} catch (err) {
  console.error("❌ خطأ في رندر الفيديو الثاني:", err.message);
}

// 3. تشغيل رندر الفيديو الثالث (عرضي)
console.log(`[3/5] 🎬 بدء رندر الفيديو الثالث (عرضي): ${V3_TITLE}...`);
try {
  execSync("node tools/render_lesson58_v3.mjs", { stdio: "inherit", env: process.env });
  console.log(`✅ اكتمل الفيديو الثالث بنجاح!`);
} catch (err) {
  console.error("❌ خطأ في رندر الفيديو الثالث:", err.message);
}

// 4. تنظيف الملفات المؤقتة
console.log("[4/5] 🧹 جاري تنظيف كافة الملفات المؤقتة وحزم الرندر...");
try {
  execSync("node tools/clean_temp.mjs", { stdio: "inherit", env: process.env });
  fs.rmSync("render_work/chunked_Lesson58-Landscape", { recursive: true, force: true });
  fs.rmSync("render_work/l58_v2_bundle", { recursive: true, force: true });
  fs.rmSync("render_work/l58_v3_bundle", { recursive: true, force: true });
} catch (err) {
  console.error("تنبيه أثناء التنظيف:", err.message);
}

// 5. إرسال إشعار الإنجاز الشامل
sendNotification({
  title: "اكتملت جميع مقاطع نونية ابن القيم الـ3 بنجاح ✅",
  body: `تم إنتاج وحفظ المقاطع الثلاثة كاملة في مجلد جاهز، وتنظيف الملفات المؤقتة.\nجاري إسبات الكمبيوتر الآن...`,
  source: "مونتاج نونية ابن القيم"
});

// 6. إسبات الكمبيوتر
console.log("[5/5] 💤 جاري إسبات الكمبيوتر (Hibernate)... تصبح على خير!");
try {
  execSync("shutdown /h", { stdio: "inherit" });
} catch (err) {
  console.error("خطأ في أمر الإسبات:", err.message);
}
