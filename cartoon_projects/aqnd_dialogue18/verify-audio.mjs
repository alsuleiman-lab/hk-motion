import {execFileSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const src='C:/Users/mshms/Downloads/38833FF26BA1D.UnigramPreview_g9c9v27vpyspw!App/AQNdFh3QHGaDKZjPyxlS5USR_a_wy8DZZP59da0OcbyZUKmWO3vEH9NmAX9EEs3_بدون_موسيقى.mp4';
const hash=p=>execFileSync('ffmpeg',['-v','error','-threads','4','-i',p,'-map','0:a:0','-vn','-c:a','pcm_s16le','-threads','4','-f','hash','-hash','sha256','-'],{encoding:'utf8',windowsHide:true}).trim();
const sourcePCM=hash(src),previewPCM=hash('public/aqnd_dialogue18/dialogue_nomusic_v1.wav');
if(sourcePCM!==previewPCM)throw Error('Decoded original audio differs');
fs.writeFileSync('cartoon_projects/aqnd_dialogue18/audio-check.json',JSON.stringify({source:src,asset:'public/aqnd_dialogue18/dialogue_nomusic_v1.wav',sourcePCM,previewPCM,sameSamples:true},null,2));console.log('PASS: no-music source and preview audio have identical decoded PCM samples.');
