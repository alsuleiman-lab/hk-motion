import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const dir='cartoon_projects/aqnd_dialogue18';
const words=JSON.parse(fs.readFileSync('.tmp/aqnd_dialogue18/words_nomusic.json','utf8'));
for(const w of words){if((w.e>6.06&&w.s<6.48)||(w.e>8.34&&w.s<9.58))w.uncertain=true;}
const quranTail=words.find(w=>w.s===24.48&&w.w==='تُرْ');
const quranTailFragment=words.find(w=>w.s===24.68&&w.w==='لا');
if(quranTail&&quranTailFragment){quranTail.e=quranTailFragment.e;quranTail.w='تُرْحَمُونَ،';words.splice(words.indexOf(quranTailFragment),1);}
const sourceMap=JSON.parse(fs.readFileSync('public/aqnd_dialogue18_vadclean_v3_map.json','utf8'));
const toCut=t=>{for(const s of sourceMap.segments){if(t>=s.a-1e-6&&t<=s.b+1e-6)return +(s.n+t-s.a).toFixed(6);if(t<s.a)return s.n;}const last=sourceMap.segments.at(-1);return +(last.n+last.b-last.a).toFixed(6);};
const starts=[0,1.34,2.64,6.06,7.12,10.06,10.68,13.66,18.2,19.54,25.12,26.66,28.36,29.12,30.08,31.68,32.96,33.9,35.7];
const titles=['بداية الاعتراض','طلب الاستماع','السؤال الأساسي','الإجابة المختصرة','إعلان انتهاء النقاش','استئناف الرد','تقديم الدليل الأول','آية آل عمران','الدليل الثاني','آية النور','الاعتراض بالمغفرة','السؤال المقابل','التوبة','الإيمان','العمل الصالح','السؤال عن التوبة','السؤال عن الإيمان','السؤال الأخير والخاتمة'];
const roles=['A','A','A','B','A','B','B','B','B','B','A','B','B','B','B','B','B','B'];
const db=JSON.parse(fs.readFileSync('data/quran/quran-uthmani.json','utf8'));
const verse=(s,a)=>db.data.surahs[s-1].ayahs.find(x=>x.numberInSurah===a).text.trim().split(/\s+/);
const data={fps:30,duration:sourceMap.duration,width:1080,height:1920,sourceMap:sourceMap.segments,words,verses:[verse(3,132),verse(24,56)],scenes:titles.map((title,i)=>({id:i+1,title,from:starts[i],to:starts[i+1],speaker:roles[i]}))};
fs.writeFileSync(dir+'/timing.json',JSON.stringify(data,null,2));
const plan={fps:30,duration:data.duration,characters:['A','B'],castDefinitions:[{id:'A',role:'السؤال والاعتراض',source:'family_stick/uncle',wardrobe:'ثوب أزرق داكن وطاقية بيضاء'},{id:'B',role:'الاستدلال والرد',source:'family_stick/father',wardrobe:'ثوب زيتي داكن بلا طاقية'}],beats:data.scenes.map(s=>({...s,from:toCut(s.from),to:toCut(s.to),actor:s.speaker,environment:'غرفة الحوار',action:s.title,shot:'لقطة متوسطة متصلة',note:'لا حركة للشخص الصامت'})),captions:data.words.filter(w=>!w.uncertain).map(w=>({from:toCut(w.s),to:toCut(w.e),words:[{text:w.w,at:toCut(w.s)}]})).filter(c=>c.to>c.from),entities:[],assets:['aqnd_dialogue18/dialogue_nomusic_cut_v3.wav'],quotations:[{from:toCut(13.66),to:toCut(18.2),text:data.verses[0].join(' '),book:'القرآن 3:132',url:'https://din.hk/tafseer?sura=3&aya=132',byUserRequest:true},{from:toCut(19.54),to:toCut(25.12),text:data.verses[1].join(' '),book:'القرآن 24:56',url:'https://din.hk/tafseer?sura=24&aya=56',byUserRequest:true}]};
fs.writeFileSync(dir+'/storyboard.json',JSON.stringify(plan,null,2));
fs.copyFileSync('C:/Users/mshms/.codex/attachments/d64ea798-278d-410d-b436-540e579b08c3/نص ملصق.txt',dir+'/INSTRUCTIONS.md');
for(const [stage,skill,done] of [['questions','video-montage','المستخدم حدد 18 مشهداً والمقاس والأفراد والصوت'],['cut','video-cutting','قُصرت الوقفات الطويلة إلى نحو 0.25 ثانية مع بقاء الكلمات وتحديث خريطة التوقيت'],['context','video-montage','توزيع 18 عبارة على الشخصيتين مع إبقاء المجهول صوتاً فقط'],['assets','video-montage','نموذجا أبو خط الأصليان والصوت والآيتان من قاعدة القرآن'],['cover','thumbnail-design','افتتاح المشهد الأول مباشرة وفق السكربت بلا غلاف إضافي'],['plan','cartoon-animation','جدول 18 مشهداً ونقاط الحركة والطبقات من تعليمات المستخدم']])execFileSync('node',['tools/montage_guard.mjs','stage','aqnd_dialogue18',stage,'--skill',skill,'--done',done,'--artifact',dir+'/storyboard.json'],{stdio:'inherit'});
execFileSync('node',['tools/montage_guard.mjs','plan-add','aqnd_dialogue18','--id','scenes18','--what','تنفيذ 18 مشهداً متجهاً متصلاً بطبقات مستقلة','--skill','cartoon-animation','--at',`0-${data.duration}`],{stdio:'inherit'});
execFileSync('node',['tools/montage_guard.mjs','ready','aqnd_dialogue18'],{stdio:'inherit'});
