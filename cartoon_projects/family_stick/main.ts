import {cast,motions,characterSvg,lineupSvg,type Motion,type Expression} from './rig';
const $=<T extends HTMLElement>(s:string)=>document.querySelector<T>(s)!;
let actor=cast[0],motion:Motion='wave',expression:Expression|undefined,flip=false,bones=false,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=0;
const view=$('#preview'),range=$<HTMLInputElement>('#time');
function draw(){view.innerHTML=characterSvg(actor,time,motion,{flip,bones,expression});range.value=String(time);$('#clock').textContent=time.toFixed(2)+'s';}
function state(){
 $('#name').textContent=actor.name;$('#description').textContent=actor.description+(motion==='talk'?' · يتكلم مع وقفات قصيرة':motion==='angry'?' · وقفة غضب وقبضتان':'');
 document.querySelectorAll<HTMLButtonElement>('[data-actor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.actor===actor.id)));
 document.querySelectorAll<HTMLButtonElement>('[data-motion]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.motion===motion)));
 document.querySelectorAll<HTMLButtonElement>('[data-expression]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.expression===(expression??'default'))));
 $('#play').textContent=playing?'إيقاف الحركة':'تشغيل الحركة';draw();
}
$('#cast').innerHTML=cast.map(c=>`<button data-actor="${c.id}" aria-label="${c.name}" aria-pressed="false">${characterSvg(c,0,'idle')}<span>${c.name}</span></button>`).join('');
$('#motions').innerHTML=motions.map(m=>`<button data-motion="${m.id}" aria-label="${m.name}" aria-pressed="false">${m.name}</button>`).join('');
$('#expressions').innerHTML=[['default','الأصلي'],['happy','فرح'],['smile','ابتسامة'],['curious','فضول'],['surprised','دهشة'],['angry','غاضب']].map(([id,label])=>`<button data-expression="${id}" aria-label="${label}" aria-pressed="false">${label}</button>`).join('');
$('#lineup').innerHTML=lineupSvg(2,false);
$('#cast').addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('[data-actor]');if(b){actor=cast.find(c=>c.id===b.dataset.actor)!;expression=undefined;time=0;state();}});
$('#motions').addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('[data-motion]');if(b){motion=b.dataset.motion as Motion;if(motion==='angry')expression=undefined;time=0;state();}});
$('#expressions').addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('[data-expression]');if(b){expression=b.dataset.expression==='default'?undefined:b.dataset.expression as Expression;state();}});
$('#play').onclick=()=>{if(time>=6)time=0;playing=!playing;state();};
$('#restart').onclick=()=>{time=0;playing=true;state();};
$('#flip').setAttribute('aria-label','عكس الاتجاه');
$('#flip').onclick=()=>{flip=!flip;$('#flip').setAttribute('aria-pressed',String(flip));draw();};
$<HTMLInputElement>('#bones').onchange=e=>{bones=(e.target as HTMLInputElement).checked;draw();};
range.oninput=()=>{playing=false;time=Number(range.value);state();};
function tick(now:number){if(now-last>=1000/30){const dt=Math.min(.1,(now-last)/1000);last=now;if(playing&&!document.hidden){time+=dt;if(time>=6){if(motion==='walk'){time=6;playing=false;state();}else time%=6;}draw();}}requestAnimationFrame(tick);}
state();requestAnimationFrame(tick);
Object.assign(globalThis,{familyReady:true,familyCast:cast,familyMotions:motions,familySvg:characterSvg,familyLineup:lineupSvg,familyPose:()=>({actor:actor.id,motion,time,playing})});
