import {chromium} from '../../../Papermotion/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const root=path.dirname(fileURLToPath(import.meta.url));for(const dir of ['assets','review'])fs.mkdirSync(path.join(root,dir),{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--renderer-process-limit=2','--num-raster-threads=2','--disable-gpu']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3310',{waitUntil:'networkidle'});await page.waitForFunction(()=>globalThis.familyReady);
 const math=await page.evaluate(async()=>{
  const {cast,motions,poseAt,characterSvg}=await import('/rig.ts');let maxError=0,maxGroundDrift=0;
  for(const m of motions)for(let n=0;n<=360;n++){
   const p=poseAt(n/60,m.id);
   for(let j=0;j<2;j++)for(const [a,b,length] of [[p.shoulders[j],p.elbows[j],56],[p.elbows[j],p.wrists[j],57],[p.hips[j],p.knees[j],60],[p.knees[j],p.ankles[j],60]]){
    const error=Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-length);maxError=Math.max(maxError,error);if(!Number.isFinite(error))throw Error('Nonfinite skeleton');
   }
  }
  for(let j=0;j<2;j++)for(let n=1;n<350;n++){
   const t=n/60,T=1.2,q=((t/T+j*.5)%1+1)%1,prev=(((t-1/60)/T+j*.5)%1+1)%1;
   if(q<.62&&prev<.62&&q>prev){const a=poseAt(t,'walk'),b=poseAt(t-1/60,'walk');maxGroundDrift=Math.max(maxGroundDrift,Math.abs(a.ankles[j].x+a.rootX-b.ankles[j].x-b.rootX));}
  }
  if(maxError>1e-6||maxGroundDrift>1e-6)throw Error(JSON.stringify({maxError,maxGroundDrift}));
  for(const c of cast)for(const m of motions){const a=characterSvg(c,2,m.id);characterSvg(c,5,m.id);if(a!==characterSvg(c,2,m.id))throw Error('Nondeterministic');}
  let minElbowBelowLine=Infinity,maxElbowStep=0;
  for(const motion of ['wave','point','explain']){
   let previous;
   for(let frame=0;frame<=720;frame++){
    const p=poseAt(frame/120,motion),s=p.shoulders[1],w=p.wrists[1],e=p.elbows[1];
    const below=e.y-s.y-(w.y-s.y)*(e.x-s.x)/(w.x-s.x);
    minElbowBelowLine=Math.min(minElbowBelowLine,below);
    if(below<-.000001)throw Error('Elbow bends upward: '+motion+' at '+frame);
    if(previous)maxElbowStep=Math.max(maxElbowStep,Math.hypot(e.x-previous.x,e.y-previous.y));
    previous=e;
   }
  }
  if(maxElbowStep>3)throw Error('Elbow pops: '+maxElbowStep);
  return {poses:motions.length*361,boneLengthError:maxError,plantedFootDrift:maxGroundDrift,deterministic:true,lowerElbowBranch:true,minElbowBelowLine,maxElbowStep};
 });
 const catalog=await page.evaluate(()=>globalThis.familyCast),motions=await page.evaluate(()=>globalThis.familyMotions);
 for(const c of catalog){await page.getByRole('button',{name:c.name,exact:true}).click();if(await page.locator('#name').textContent()!==c.name)throw Error('Actor selection');}
 for(const m of motions){const b=page.getByRole('button',{name:m.name,exact:true});await b.click();if(await b.getAttribute('aria-pressed')!=='true')throw Error('Motion selection');}
 await page.getByRole('button',{name:catalog[0].name,exact:true}).click();await page.getByRole('button',{name:'تحية',exact:true}).click();
 await page.waitForTimeout(1400);const a=await page.locator('#preview').innerHTML();await page.waitForTimeout(150);if(a===await page.locator('#preview').innerHTML())throw Error('Animation stalled');
 await page.getByRole('button',{name:'إيقاف الحركة',exact:true}).click();const stopped=await page.locator('#preview').innerHTML();await page.waitForTimeout(150);if(stopped!==await page.locator('#preview').innerHTML())throw Error('Pause failed');
 await page.getByRole('button',{name:'عكس الاتجاه',exact:true}).click();if(await page.locator('#flip').getAttribute('aria-pressed')!=='true')throw Error('Flip');await page.getByRole('button',{name:'عكس الاتجاه',exact:true}).click();
 await page.locator('#bones').check();await page.locator('#bones').uncheck();
 const contrast=[];
 for(const mode of ['light','dark','forced']){
  await page.emulateMedia(mode==='forced'?{colorScheme:'light',forcedColors:'active'}:{colorScheme:mode,forcedColors:'none'});
  const ratios=await page.evaluate(()=>{
   const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),lum=s=>rgb(s).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
   const results=[];
   for(const selector of ['body','p','a','button','button[aria-pressed=true]','.stage-meta','#name']){
    const el=document.querySelector(selector);if(!el)continue;const style=getComputedStyle(el);let parent=el,bg=style.backgroundColor;
    while(bg==='rgba(0, 0, 0, 0)'&&parent.parentElement){parent=parent.parentElement;bg=getComputedStyle(parent).backgroundColor;}
    const r=ratio(style.color,bg);if(r<4.5)throw Error('Text contrast '+selector+' '+r);results.push({selector,ratio:r});
   }
   return results;
  });contrast.push({mode,ratios});await page.screenshot({path:path.join(root,'review',`ui-${mode}.png`),fullPage:true});
 }
 await page.emulateMedia({colorScheme:'light',forcedColors:'none'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(root,'review/ui-mobile.png'),fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 // Static transparent source assets; no final video render.
 const assets=await page.evaluate(async()=>{const r=await import('/rig.ts');return {lineup:r.lineupSvg(2),actors:r.cast.map(c=>({id:c.id,svg:r.characterSvg(c,0,'idle'),wave:r.characterSvg(c,2,'wave')}))};});
 fs.writeFileSync(path.join(root,'assets/family-lineup.svg'),assets.lineup);
 const imagePage=await browser.newPage();
 async function png(svg,file,width,height){await imagePage.setViewportSize({width,height});await imagePage.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>${svg}`);await imagePage.screenshot({path:path.join(root,'assets',file),omitBackground:true});}
 await png(assets.lineup,'family-lineup.png',1440,1040);
 for(const c of assets.actors){fs.writeFileSync(path.join(root,'assets',c.id+'.svg'),c.svg);await png(c.svg,c.id+'.png',800,800);await png(c.wave,c.id+'-wave.png',800,800);}
 // Contact sheets sample the beginning, middle and end of all actions.
 for(const id of ['father','girl','mother']){
  const sheet=await page.evaluate(async(id)=>{const r=await import('/rig.ts'),c=r.cast.find(c=>c.id===id);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1800"><rect width="1600" height="1800" fill="#faf6ed"/>${r.motions.map((m,row)=>[0,.7,2,4.9].map((t,col)=>`<g transform="translate(${200+col*400} ${205+row*220}) scale(.48)">${r.characterMarkup(c,t,m.id)}</g>`).join('')).join('')}</svg>`;},id);await png(sheet,id+'-contact.png',1600,1800);
 }
 if(errors.length)throw Error(errors.join('\n'));
 const report={cast:catalog.length,motions:motions.length,...math,liveAnimation:true,pause:true,flip:true,mobile:true,contrast,errors};fs.writeFileSync(path.join(root,'review/QA.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,contrast:'light/dark/forced passed'}));
}finally{await browser.close();}
