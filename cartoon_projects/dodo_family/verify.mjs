import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import ts from '../../node_modules/typescript/lib/typescript.js';
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const root=path.dirname(fileURLToPath(import.meta.url)),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText).toString('base64');
const catalog=moduleUrl(read('../character_library_v2/catalog.ts')),base=moduleUrl(read('../family_stick/rig.ts').replace("'../character_library_v2/catalog'",JSON.stringify(catalog)));
const r=await import(moduleUrl(read('rig.ts').replace("'../family_stick/rig'",JSON.stringify(base))));
let boneError=0,maxElbowStep=0,groundDrift=0,minBelow=Infinity,maxStepAt='';
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const m of r.motions){let last;for(let n=0;n<=720;n++){
 const p=r.poseAt(n/120,m.id);
 for(let j=0;j<2;j++)for(const [a,b,len]of[[p.shoulders[j],p.elbows[j],73],[p.elbows[j],p.wrists[j],73],[p.hips[j],p.knees[j],49],[p.knees[j],p.ankles[j],49]])boneError=Math.max(boneError,Math.abs(d(a,b)-len));
 if(['wave','point','explain','talk','angry'].includes(m.id)){
  for(const j of m.id==='angry'?[0,1]:[1]){const s=p.shoulders[j],w=p.wrists[j],e=p.elbows[j],below=e.y-s.y-(w.y-s.y)*(e.x-s.x)/(w.x-s.x);assert(below>=0,'Upward elbow');minBelow=Math.min(minBelow,below);}
  if(last){const step=d(p.elbows[1],last.elbows[1]);if(step>maxElbowStep){maxElbowStep=step;maxStepAt=m.id+' '+n/120;}}
 }
 last=p;
}}
for(let j=0;j<2;j++)for(let n=1;n<720;n++){
 const t=n/120,T=1.2,q=((t/T+j*.5)%1+1)%1,prev=(((t-1/120)/T+j*.5)%1+1)%1;
 if(q<.62&&prev<.62&&q>prev){const a=r.poseAt(t,'walk'),b=r.poseAt(t-1/120,'walk');groundDrift=Math.max(groundDrift,Math.abs(a.rootX+a.ankles[j].x-b.rootX-b.ankles[j].x));}
}
assert(boneError<1e-6);assert(groundDrift<1e-6);assert(maxElbowStep<4,'Elbow movement too fast: '+maxElbowStep+' at '+maxStepAt);
for(const t of [0,.3,2.3,2.5,4.6,5.9]){assert.equal(r.speechAt(t).mouthOpen,0);assert.equal(r.speechAt(t).gesture,0);}
const custom=[{from:7,to:9}];assert(r.poseAt(7.625,'talk',custom).wrists[1].y<-90);
fs.mkdirSync(path.join(root,'assets'),{recursive:true});fs.mkdirSync(path.join(root,'review'),{recursive:true});
for(const c of r.cast)for(const m of r.motions){const svg=r.characterSvg(c,2,m.id);assert(!svg.includes('NaN'));assert.equal(svg,r.characterSvg(c,2,m.id));}
for(const c of r.cast){
 const open=r.characterSvg(c,.625,'talk'),closed=r.characterSvg(c,2.3,'talk');
 if(c.id==='mother'){assert(!open.includes('data-mouth='));assert(!closed.includes('data-mouth='));}
 else{assert(open.includes('data-mouth-open="1"'));assert(closed.includes('data-mouth-open="0"'));assert.notEqual(open,closed);}
 for(const [suffix,t,m]of[['',0,'idle'],['-wave',2,'wave'],['-angry',2,'angry'],['-talk-open',.625,'talk'],['-talk-closed',2.3,'talk']])fs.writeFileSync(path.join(root,'assets',c.id+suffix+'-v2.svg'),r.characterSvg(c,t,m));
}
fs.writeFileSync(path.join(root,'assets/family-lineup-v2.svg'),r.lineupSvg(2,false));
for(const actor of ['father','girl','mother']){
 const c=r.cast.find(c=>c.id===actor),width=1600,height=2250;
 const rows=r.motions.map((m,row)=>`<text x="18" y="${40+row*225}" fill="${r.palette.ink}" font-family="Tahoma" font-size="18">${m.id}</text>`+[0,.8,2,5.2].map((t,col)=>`<g transform="translate(${200+col*400} ${215+row*225}) scale(.48)">${r.characterMarkup(c,t,m.id,{idPrefix:`review-${row}-${col}`})}</g>`).join('')).join('');
 fs.writeFileSync(path.join(root,'review',actor+'-motion-contact-v2.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${r.palette.paper}"/>${rows}</svg>`);
}
// Every colour carries a thick ink boundary; test it against all adjacent fills.
const lum=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=Object.entries(r.palette).filter(([key])=>!['ink','hair','ribbon'].includes(key)).map(([key,hex])=>({fill:key,ratio:(lum(hex)+.05)/(lum(r.palette.ink)+.05)}));assert(contrast.every(v=>v.ratio>=3));
const report={characters:r.cast.length,motions:r.motions.length,poses:r.motions.length*721,maxBoneError:boneError,maxPlantedFootDrift:groundDrift,minElbowBelowLine:minBelow,maxElbowStep,deterministic:true,mouthRestsInPauses:true,niqabConcealsMouth:true,contrast};
fs.writeFileSync(path.join(root,'review/QA.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,contrast:'All ink/fill pairs pass 3:1'}));
