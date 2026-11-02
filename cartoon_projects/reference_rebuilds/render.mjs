import {createServer} from '../../../Papermotion/node_modules/vite/dist/node/index.js';
import {chromium} from '../../../Papermotion/node_modules/playwright-core/index.mjs';
import {spawn} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const opt=(k,d)=>{const at=process.argv.indexOf('--'+k);return at<0?d:process.argv[at+1]};
const scene=opt('scene','bicycle'),seconds=Number(opt('seconds','2')),scale=Number(opt('scale','1')),from=Number(opt('from','0')),shots=opt('stills','').split(',').filter(Boolean).map(Number);
if(!['bicycle','embers','moth'].includes(scene))throw Error('Unknown authored scene');
const out=path.resolve(opt('out',path.join(root,'preview',scene+'_2s.mp4')));
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const server=await createServer({root,configFile:false,cacheDir:path.join(root,'.cache/vite'),server:{port:0,hmr:false,watch:null,fs:{allow:['S:/AI_Tools']}},logLevel:'error'});await server.listen();
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-networking','--use-angle=d3d11','--renderer-process-limit=2']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 await page.goto(server.resolvedUrls.local[0]+`?scene=${scene}&headless&scale=${scale}`,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>globalThis.ready===true,null,{timeout:120000});if(errors.length)throw Error(errors.join('\n'));
 const meta=await page.evaluate(()=>globalThis.meta);console.log('AUTHORED '+scene+' '+JSON.stringify(meta));
 if(process.argv.includes('--verify')){
  const sha=s=>createHash('sha256').update(s).digest('hex');
  const first=sha(await page.evaluate(()=>globalThis.frame(30)));
  await page.evaluate(()=>globalThis.reset());
  await page.evaluate(()=>{globalThis.frame(0);globalThis.frame(15)});
  const second=sha(await page.evaluate(()=>globalThis.frame(30)));
  if(first!==second)throw Error('Frame replay is not deterministic');
  console.log('REPLAY frame 30: identical after reset / different preceding draws '+first);
  await page.evaluate(()=>globalThis.reset());
 }
 if(shots.length){fs.mkdirSync(out,{recursive:true});for(const t of shots){const n=Math.round(t*meta.fps),url=await page.evaluate(n=>globalThis.frame(n),n);const f=path.join(out,`authored_${scene}_${t}.jpg`);fs.writeFileSync(f,Buffer.from(url.split(',')[1],'base64'));console.log(f);console.log(JSON.stringify(await page.evaluate(n=>globalThis.probe(n),n)));}}
 else{
  fs.mkdirSync(path.dirname(out),{recursive:true});
  const encoder=spawn('ffmpeg',['-hide_banner','-v','error','-n','-threads','4','-f','image2pipe','-framerate',String(meta.fps),'-i','-','-an','-c:v','h264_nvenc','-cq','17','-preset','p4','-pix_fmt','yuv420p','-threads','4','-movflags','+faststart',out],{windowsHide:true,stdio:['pipe','inherit','inherit']});
  try{os.setPriority(encoder.pid,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
  const finished=new Promise(r=>encoder.on('close',r)),start=Math.round(from*meta.fps),count=Math.min(meta.frames-start,Math.round(seconds*meta.fps));
  for(let i=0;i<count;i++){const n=start+i,url=await page.evaluate(n=>globalThis.frame(n),n);if(errors.length)throw Error(errors.join('\n'));if(!encoder.stdin.write(Buffer.from(url.split(',')[1],'base64')))await new Promise(r=>encoder.stdin.once('drain',r));if(i%60===0)console.log(`${i}/${count}`)}
  encoder.stdin.end();if(await finished!==0)throw Error('Encoder failed');console.log('DONE '+out);
 }
}finally{await browser.close();await server.close()}
