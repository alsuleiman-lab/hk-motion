import {createServer} from '../../../Papermotion/node_modules/vite/dist/node/index.js';import {chromium} from '../../../Papermotion/node_modules/playwright-core/index.mjs';
import {spawn} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),out=path.join(root,'assets');fs.mkdirSync(out,{recursive:true});try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const server=await createServer({root,configFile:false,cacheDir:path.join(root,'.cache/vite'),server:{port:0,hmr:false,watch:null,fs:{allow:['S:/AI_Tools']}},logLevel:'error'});await server.listen();const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--renderer-process-limit=2','--num-raster-threads=2']});
try{
 const page=await browser.newPage({viewport:{width:1260,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.resolvedUrls.local[0]+'?capture',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.ready===true);
 const catalog=await page.evaluate(()=>globalThis.catalog),styles=await page.evaluate(()=>globalThis.styleList),checks=await page.evaluate(()=>globalThis.testRig());console.log(JSON.stringify(checks));if(checks.failureCount||checks.maxSkate>.001||checks.maxGroundError>.001)throw Error('Rig constraint failed');
 const save=(f,data)=>fs.writeFileSync(f,Buffer.from(data.split(',')[1],'base64')),hashes={};
 for(const st of styles){const dir=path.join(out,st.id);fs.mkdirSync(dir,{recursive:true});save(path.join(dir,'lineup.png'),await page.evaluate(st=>globalThis.renderBoard(st),st.id));
  const a=await page.evaluate(st=>globalThis.renderAsset('elder','wave',st,2),st.id),b=await page.evaluate(st=>globalThis.renderAsset('elder','wave',st,2),st.id);if(a!==b)throw Error('Replay changed');hashes[st.id]=createHash('sha256').update(a).digest('hex');
  for(const c of catalog)for(const m of ['idle','explain','carry','sit'])save(path.join(dir,c.id+'-'+m+'.png'),await page.evaluate(({id,m,st})=>globalThis.renderAsset(id,m,st,2),{id:c.id,m,st:st.id}));
  for(const [id,m,t]of [['elder','wave',2],['worker','walk',2.4],['niqab-navy','sit',2],['boy','carry',2],['girl','wave',2]])save(path.join(dir,`review-${id}-${m}.png`),await page.evaluate(({id,m,st,t})=>globalThis.renderSingle(id,m,st,t),{id,m,st:st.id,t}));
  console.log('EXPORTED '+st.id+' 10 models');
  if(process.argv.includes('--motion')){
   const filename=path.join(dir,'motion-preview.mp4'),enc=spawn('ffmpeg',['-hide_banner','-v','error','-n','-threads','4','-f','image2pipe','-framerate','30','-i','-','-an','-c:v','h264_nvenc','-cq','18','-preset','p4','-pix_fmt','yuv420p','-threads','4','-movflags','+faststart',filename],{windowsHide:true,stdio:['pipe','inherit','inherit']});try{os.setPriority(enc.pid,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
   const done=new Promise(r=>enc.on('close',r));for(let n=0;n<180;n++){const data=await page.evaluate(({n,st})=>globalThis.frame(n,st),{n,st:st.id});if(!enc.stdin.write(Buffer.from(data.split(',')[1],'base64')))await new Promise(r=>enc.stdin.once('drain',r));if(n%60===0)console.log(st.id+' '+n+'/180')}enc.stdin.end();if(await done!==0)throw Error('Encode failed');
  }
 }
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({version:2,groups:styles,characters:catalog,motions:await page.evaluate(()=>globalThis.motionList),modelCount:20,facialFeatures:false,renderer:'rig.ts',coordinates:'floor origin',assets:['idle','explain','carry','sit']},null,2));fs.writeFileSync(path.join(root,'QA.json'),JSON.stringify({rig:checks,replayHashes:hashes,errors},null,2));console.log('DONE '+out);
}finally{await browser.close();await server.close()}
