import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import ts from '../../node_modules/typescript/lib/typescript.js';
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const root=path.dirname(fileURLToPath(import.meta.url));
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText).toString('base64');
const catalog=moduleUrl(fs.readFileSync(path.join(root,'../character_library_v2/catalog.ts'),'utf8'));
const source=fs.readFileSync(path.join(root,'rig.ts'),'utf8').replace("'../character_library_v2/catalog'",JSON.stringify(catalog));
const r=await import(moduleUrl(source));let maxError=0,maxStep=0,minBelow=Infinity;
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const motion of r.motions){let last;for(let n=0;n<=720;n++){
 const p=r.poseAt(n/120,motion.id);
 for(let j=0;j<2;j++)for(const [a,b,l]of[[p.shoulders[j],p.elbows[j],56],[p.elbows[j],p.wrists[j],57],[p.hips[j],p.knees[j],60],[p.knees[j],p.ankles[j],60]])maxError=Math.max(maxError,Math.abs(d(a,b)-l));
 if(['wave','point','explain','talk','angry'].includes(motion.id)){
  for(const j of motion.id==='angry'?[0,1]:[1]){const s=p.shoulders[j],w=p.wrists[j],e=p.elbows[j],below=e.y-s.y-(w.y-s.y)*(e.x-s.x)/(w.x-s.x);minBelow=Math.min(minBelow,below);assert(below>0,'Elbow inverted: '+motion.id);}
  if(last)maxStep=Math.max(maxStep,d(p.elbows[1],last.elbows[1]));
 }
 last=p;
}}
assert(maxError<1e-6);assert(maxStep<4,'Fast or discontinuous elbow movement: '+maxStep);
for(const t of [0,.3,2.2,2.5,4.6,5.9]){const s=r.speechAt(t);assert.equal(s.mouthOpen,0);assert.equal(s.gesture,0);}
assert(r.speechAt(.625).mouthOpen>.9);assert(r.speechAt(.75).mouthOpen<.3);
const late=[{from:7,to:9}];assert(r.speechAt(7.625,late).mouthOpen>.9);assert(r.poseAt(7.625,'talk',late).wrists[1].y<-150);
assert.equal(r.speechAt(7.625,[]).mouthOpen,0);
for(const c of r.cast){
 assert.equal(r.characterSvg(c,.625,'talk'),r.characterSvg(c,.625,'talk'),'Determinism');
 const open=r.characterSvg(c,.625,'talk'),closed=r.characterSvg(c,2.3,'talk');
 if(c.id==='mother'){assert(!open.includes('data-mouth='));assert(!closed.includes('data-mouth='));}
 else{assert(open.includes('data-mouth-open="1"'));assert(closed.includes('data-mouth-open="0"'));assert.notEqual(open,closed);}
 const angry=r.characterSvg(c,2,'angry');assert.notEqual(angry,r.characterSvg(c,2,'idle'));
 fs.writeFileSync(path.join(root,'assets',c.id+'-angry.svg'),angry);
 fs.writeFileSync(path.join(root,'assets',c.id+'-talk-open.svg'),open);
 fs.writeFileSync(path.join(root,'assets',c.id+'-talk-closed.svg'),closed);
}
const report={characters:r.cast.length,motions:r.motions.length,poses:r.motions.length*721,maxBoneError:maxError,minElbowBelowLine:minBelow,maxElbowStep:maxStep,mouthOpensAndCloses:true,mouthAndGesturesRestInPauses:true,customSpeechAfterSixSeconds:true,niqabKeepsMouthCovered:true};
fs.writeFileSync(path.join(root,'review/QA-actions.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
