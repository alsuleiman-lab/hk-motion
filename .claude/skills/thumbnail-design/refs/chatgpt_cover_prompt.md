# برومبت غلاف ChatGPT (أمر المستخدم 2026-11-09) — الحلقات عرضي وطولي والريلز

**النطاق:** كل مونتاج كلام (حلقات عرضي/طولي كامل/ريلز) غلافه ChatGPT بهذا القالب، ولا يُنسى ولا يُبدَّل بغلاف Remotion. **البثوث والدروس أصمم غلافها أنا (Remotion/`thumbnail-design`) ولا تدخل ChatGPT.**
المرجع البصري: `chatgpt_style_ref_britain.png` («الغربة في بريطانيا / ما قالوليش إنها كده!»).

## وصف المرجع (ما يُكرَّر في كل غلاف)
1. **الشيخ** (من الصورة المرفوعة بلا أي تغيير) نصف جسم كبير في الثلث الأيمن من الإطار (عرضي)، **بوضعيته وتعبيره ونظرته كما في الصورة المرفوعة تماماً** (ممنوع طلب وضعية جديدة كيد على الذقن أو تغيير التعبير: ChatGPT يعيد رسم الوجه فتتغير ملامحه، أمر المستخدم 2026-11-09).
2. **الخلفية = مشهد من الموضوع نفسه** (في المرجع: لندن في الخريف، بيغ بن، حافلة حمراء، شارع مبلل، أوراق شجر برتقالية متساقطة) خلف الشيخ بعمق ميدان بسيط وتدرجات داكنة دافئة، وعلم/رمز الموضوع في زاوية العلوية ممزَّق الورق.
3. **عنوان على لافتة ورق كرافت ممزَّق الحواف** (بيج، ملمس كرتون، شريط لاصق صغير) بخط عربي ثقيل أسود، **ولا شيء غيره: لا سطر إثارة ولا شريط أحمر ولا نص إضافي** (أمر المستخدم 2026-11-09 «العنوان لا تزد عليه»)، **ومعه توقيع «محمد بن شمس الدين» صغيراً أسفل اليسار** (أمر المستخدم 2026-11-18).
4. تفاصيل كولاج ورقي: حواف ممزَّقة، ظلال ناعمة، أوراق/عناصر موسمية تتداخل مع زوايا اللافتة، زوايا الصورة مدوّرة.
5. تباين عالٍ يُقرأ على الهاتف بعرض 120px: كلمتان إلى أربع في العنوان، نص كبير، لا ازدحام.

## القالب (املأ الأقواس؛ العنوان الحرفي بنصه)
```
Create a YouTube thumbnail, {ASPECT}, in the style of a torn-paper collage.
SUBJECT: the man must be the attached photo itself, cut out and pasted as a photo, NOT redrawn or regenerated. Keep his face pixel-faithful: same features, SAME EXPRESSION, same gaze, same head angle, same full long beard (length, shape, density), glasses, skin, robe and head covering. Do NOT make him frown or look down, do NOT add a hand or any new pose, do NOT beautify, slim or age him. {POSITION}.
BACKGROUND: {TOPIC_SCENE}; calm, dark-warm, softly blurred depth, no plain black, no olive green. {TOPIC_SYMBOL} as a small torn-paper element in the {CORNER} corner.
TEXT: ONLY ONE text element - a large ragged-edged kraft cardboard paper banner with a small piece of tape, containing exactly this Arabic title and nothing else, bold black Arabic font: {TITLE_AR} (write the title WITHOUT any quotation marks or guillemets; ChatGPT otherwise renders a stray » after it). Do NOT add any other text: no subtitle, no hook, no red strip, no signature, no name.
STYLE: paper-collage torn edges, soft drop shadows, a few {SEASONAL_OR_TOPIC_BITS} overlapping the banner corners, rounded image corners, high contrast, readable at phone size.
STRICT: no women and no invented people (no crowds, no pedestrians); the real people in the attached photo board (if any) are REQUIRED; no names under pictures; keep all Arabic spelling exact.
{EXTRA_IMAGE_CLAUSE}
{PEOPLE_CLAUSE}
```
- **`{ASPECT}`:** عرضي `16:9 landscape (1920x1080)`؛ طولي كامل وريلز `9:16 portrait (1080x1920)`.
- **`{POSITION}`:** عرضي: «Only scale him and place him chest-up, large, on the left third of the frame with a thin white torn-paper outline»؛ طولي/ريلز: «lower half of the frame, chest-up, large; the banner in the upper half; keep the top 15% and bottom 20% free of key text (platform UI)». **لا وضعية ولا تعبير.**
- **الصورة المرفوعة (أمر المستخدم 2026-11-09 «الصور حصراً من مجلد الصور»):** حصراً من مجلد صوره الخاص `S:\AI_Tools\covers\sheikh_poses` (عشر وضعيات)، أنسبها لنبرة الموضوع (جدّي ← `07_sheikh_brown_hands_clasped.png`)، تُنسخ أولاً إلى مجلد الجلسة المؤقت قبل `file_upload`؛ لا صورة من `sheikh_gallery` ولا من الفيديو. ويُكتب في البرومبت: ملامحه ووضعية جسده ويداه كما في الصورة تماماً، لا تعبير ولا وضعية جديدة.
- **`{EXTRA_IMAGE_CLAUSE}`:** إن رُفعت لقطة من المردود عليه: «The second attached image is a frame from the video being answered: place it on a tilted cream paper card with its face exactly as is; keep any blur as is; do not reveal or redraw it.»
- **`{PEOPLE_CLAUSE}` (إلزامي متى دارت الحلقة على أشخاص — أمر المستخدم 2026-11-17):** تُرفع لوحة واحدة فيها صورهم الحقيقية (أصنعها من صور عناصر الحلقة)، ويُكتب: «The attached photo board shows the real people this episode is about: paste ALL of them into the thumbnail as real photo cards, faces exactly as in the board (cut out, not redrawn), none missing.» وبعد التوليد أعدّ الوجوه، وأي وجه تغيّر ألصق فوقه صورته الأصلية. كان سطر «STRICT: no other people» يحذفهم ثلاث مرات.
- **الخلفية والعلم يتغيران كل غلاف** ولا يُنسخان من غلاف سابق؛ لا أسماء بلا ذكر في المقطع.

**محادثة جديدة (أمر المستخدم 2026-11-18):** كل غلاف يُرسل في محادثة ChatGPT جديدة دائماً.

## بعد التوليد
نفس إجراءات `SKILL.md` (فحص الوجه بالحجم الكامل، تنزيل إلى `public/<المشروع>/cover_gpt.png`، `thumb_mobile.mjs`، إغلاق التبويب).
- **علم سوريا (أمر المستخدم 2026-11-16، وهو خطأ متكرر من ChatGPT فيُنبَّه عليه دائماً):** كل غلاف أو صورة أو عنصر يظهر فيه علم سوريا يكون **العلم الجديد** (أخضر وأبيض وأسود أفقياً بثلاث نجوم حمراء)، لا القديم (أحمر وأبيض وأسود بنجمتين خضراوين)؛ يُكتب في برومبت ChatGPT نصاً: «the NEW Syrian flag: horizontal green, white and black stripes with three red stars, NOT the old red-white-black flag with two green stars»، ويُنظر الناتج قبل اعتماده ويُعاد توليده إن جاء القديم؛ والقديم لا يظهر إلا بتعليمة صريحة.
- **غلاف الرد على شخص (أمر المستخدم 2026-11-16):** صورة المردود عليه (وجهه كما هو) على بطاقة ورق مائلة في الغلاف دائماً، ولو كان مقطعه صوتياً فقط (تُجلب صورته الحقيقية وتُرفع ثانيةً في ChatGPT بـ`EXTRA_IMAGE_CLAUSE`)؛ ولا يُعتمد غلاف رد بلا صورته.
