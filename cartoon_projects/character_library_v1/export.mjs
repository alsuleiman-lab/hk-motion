import {createServer} from '../../../Papermotion/node_modules/vite/dist/node/index.js';
import {chromium} from '../../../Papermotion/node_modules/playwright-core/index.mjs';
import {spawn} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),out=path.join(root,'assets');fs.mkdirSync(out,{recursive:true});
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const server=await createServer({root,configFile:false,cacheDir:path.join(root,'.cache/vite'),server:{port:0,hmr:false,watch:null,fs:{allow:['S:/AI_Tools']}},logLevel:'error'});await server.listen();
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-networking','--use-angle=d3d11','--renderer-process-limit=2','--num-raster-threads=2']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]+'?capture',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>globalThis.ready===true);
 const catalog=await page.evaluate(()=>globalThis.catalog),checks=await page.evaluate(()=>globalThis.testRig());console.log(JSON.stringify(checks));
 if(checks.failureCount||checks.maxSkate>.001||checks.maxGroundError>.001)throw Error('Rig constraints failed');
 const a=await page.evaluate(()=>globalThis.renderAsset('elder','wave',2)),b=await page.evaluate(()=>globalThis.renderAsset('elder','wave',2));if(a!==b)throw Error('Non-deterministic artwork');
 const sha=createHash('sha256').update(a).digest('hex');
 const save=(f,data)=>fs.writeFileSync(f,Buffer.from(data.split(',')[1],'base64'));
 save(path.join(out,'character-lineup.png'),await page.evaluate(()=>globalThis.renderBoard()));
 const variants=['idle','explain','carry','sit'];
 for(const c of catalog){for(const m of variants){save(path.join(out,c.id+'-'+m+'.png'),await page.evaluate(({id,m})=>globalThis.renderAsset(id,m,2),{id:c.id,m}));}console.log('EXPORTED '+c.id)}
 for(const [id,m,t]of [['elder','wave',2],['worker','walk',2.4],['niqab-navy','sit',2],['boy','carry',2],['girl','wave',2]])save(path.join(out,`review-${id}-${m}.png`),await page.evaluate(({id,m,t})=>globalThis.renderSingle(id,m,t),{id,m,t}));
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({version:1,style:'native-paper-cutout',facialFeatures:false,characters:catalog,motions:await page.evaluate(()=>globalThis.motionList),assets:variants,rig:'rig.ts',coordinateOrigin:'floor',runtime:'Papermotion Paper + analytical IK',audio:'none'},null,2));
 fs.writeFileSync(path.join(root,'QA.json'),JSON.stringify({rig:checks,replay:{identical:true,sha256:sha},browserErrors:errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));
 if(process.argv.includes('--motion')){
  const filename=path.join(out,'character-motion-preview.mp4');
  const enc=spawn('ffmpeg',['-hide_banner','-v','error','-n','-threads','4','-f','image2pipe','-framerate','30','-i','-','-an','-c:v','h264_nvenc','-cq','19','-preset','p4','-pix_fmt','yuv420p','-threads','4','-movflags','+faststart',filename],{windowsHide:true,stdio:['pipe','inherit','inherit']});try{os.setPriority(enc.pid,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
  const done=new Promise(r=>enc.on('close',r));for(let n=0;n<180;n++){const data=await page.evaluate(n=>globalThis.frame(n),n);if(!enc.stdin.write(Buffer.from(data.split(',')[1],'base64')))await new Promise(r=>enc.stdin.once('drain',r));if(n%30===0)console.log(`PREVIEW ${n}/180`)}enc.stdin.end();if(await done!==0)throw Error('Preview encode failed');
 }
 console.log('DONE '+out);
}finally{await browser.close();await server.close()}
