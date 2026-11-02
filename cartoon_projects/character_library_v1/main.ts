import {Paper,drawCharacter,poseFor,characters} from './rig';
import {motions,type Motion} from './catalog';
const params=new URLSearchParams(location.search),capture=params.has('capture');
const grain=document.createElement('canvas');grain.width=300;grain.height=300;{
 const g=grain.getContext('2d')!,im=g.createImageData(300,300);let r=281;for(let i=0;i<90000;i++){r^=r<<13;r^=r>>>17;r^=r<<5;const v=(r>>>0)%256;im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v;im.data[i*4+3]=10}g.putImageData(im,0,0);
}
function backdrop(g:CanvasRenderingContext2D,w:number,h:number){g.fillStyle='#e8ddc5';g.fillRect(0,0,w,h);const pat=g.createPattern(grain,'repeat')!;g.fillStyle=pat;g.fillRect(0,0,w,h);g.strokeStyle='rgba(117,98,76,.12)';g.lineWidth=1;for(let x=-h;x<w+h;x+=85){g.beginPath();g.moveTo(x,0);g.lineTo(x+h,h);g.stroke()}g.strokeStyle='rgba(119,98,72,.25)';g.beginPath();g.moveTo(0,h*.88);g.lineTo(w,h*.88);g.stroke()}
function paperFor(g:CanvasRenderingContext2D){const p=new Paper(g);p.setFrame(0);p.light={x:-.5,y:-.8};p.edgeColor='rgba(229,202,160,.35)';return p}
const cn=document.querySelector<HTMLCanvasElement>('#preview')!,g=cn.getContext('2d')!,paper=paperFor(g);
let selected=characters[0],motion:Motion='wave',flip=false,bones=false,paused=false,clock=0,last=0;
const makeCanvas=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function single(id:string,t:number,m:Motion,transparent=false){
 const c=makeCanvas(640,800),d=c.getContext('2d')!,p=paperFor(d),spec=characters.find(c=>c.id===id)!;
 if(!transparent)backdrop(d,640,800);
 drawCharacter(p,spec,t,m,320,744,{scale:1.6,shadow:!transparent});return c;
}
function board(t:number,animated:boolean){
 const c=makeCanvas(animated?1080:1600,animated?1920:2500),d=c.getContext('2d')!,p=paperFor(d),w=c.width,h=c.height;
 backdrop(d,w,h);d.textAlign='center';d.fillStyle='#34313e';d.font=`700 ${animated?46:57}px "Segoe UI",Tahoma,sans-serif`;d.fillText('شخصيات قصصنا',w/2,animated?68:86);
 const top=animated?100:122,row=(h-top-30)/5,col=w/2;
 for(let i=0;i<10;i++){
  const xx=(i%2)*col,yy=top+Math.floor(i/2)*row;
  d.fillStyle='rgba(255,249,237,.62)';d.beginPath();d.roundRect(xx+15,yy+5,col-30,row-14,14);d.fill();
  const floor=yy+row-54;
  drawCharacter(p,characters[i],animated?t:0,animated?'wave':'idle',xx+col/2,floor,{scale:animated?.70:.96});
  d.fillStyle='#34313e';d.font=`600 ${animated?24:31}px "Segoe UI",Tahoma,sans-serif`;d.fillText(characters[i].name,xx+col/2,yy+row-20);
 }
 return c;
}
Object.assign(globalThis,{
 ready:true,catalog:characters,motionList:motions,
 renderAsset:(id:string,m:Motion='idle',t=2)=>single(id,t,m,true).toDataURL('image/png'),
 renderSingle:(id:string,m:Motion='wave',t=2)=>single(id,t,m).toDataURL('image/png'),
 renderBoard:()=>board(0,false).toDataURL('image/png'),
 frame:(n:number)=>board(n/30,true).toDataURL('image/jpeg',.95),
 probe:(id:string,t:number,m:Motion)=>poseFor(characters.find(c=>c.id===id)!,t,m),
 testRig:()=>{
  let maxBoneError=0,maxGroundError=0,checked=0;const failures:string[]=[];
  const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
  for(const c of characters)for(const m of motions)for(let n=0;n<180;n++){
   const t=n/30,p=poseFor(c,t,m.id),L=(c.kind==='boy'||c.kind==='girl')?59:61;
   for(let j=0;j<2;j++){
    const errs=[Math.abs(dist(p.shoulders[j],p.elbows[j])-L),Math.abs(dist(p.elbows[j],p.wrists[j])-L),Math.abs(dist(p.hips[j],p.knees[j])-76),Math.abs(dist(p.knees[j],p.ankles[j])-76)];
    maxBoneError=Math.max(maxBoneError,...errs);if(errs.some(e=>e>.3))failures.push(`${c.id}/${m.id}/${n}/${j}`);
    if(m.id!=='walk')maxGroundError=Math.max(maxGroundError,Math.abs(p.ankles[j].y+7));
   }checked++;
  }
  // During stance, root travel must cancel the foot's local travel.
  let maxSkate=0;for(let j=0;j<2;j++)for(let n=1;n<179;n++){const t=n/30,q=((t/1.2+j*.5)%1+1)%1,q0=(((t-1/30)/1.2+j*.5)%1+1)%1;if(q<.6&&q0<.6&&q>=q0){const a=poseFor(characters[0],t,'walk'),b=poseFor(characters[0],t-1/30,'walk');maxSkate=Math.max(maxSkate,Math.abs(a.rootX+a.ankles[j].x-b.rootX-b.ankles[j].x));}}
  return {checked,maxBoneError,maxGroundError,maxSkate,failures:failures.slice(0,15),failureCount:failures.length};
 }
});
if(capture){document.body.classList.add('capture');}
else{
 const nav=document.querySelector('#characters')!,controls=document.querySelector('#motions')!;
 function sync(){document.querySelector('#name')!.textContent=selected.name;document.querySelector('#description')!.textContent=selected.description;for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-current',String(b.dataset.id===selected.id));for(const b of controls.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.motion===motion));}
 for(const c of characters){const b=document.createElement('button');b.textContent=c.name;b.dataset.id=c.id;b.type='button';b.onclick=()=>{selected=c;clock=0;sync()};nav.appendChild(b)}
 for(const m of motions){const b=document.createElement('button');b.textContent=m.name;b.dataset.motion=m.id;b.type='button';b.onclick=()=>{motion=m.id;clock=0;sync()};controls.appendChild(b)}
 document.querySelector<HTMLButtonElement>('#pause')!.onclick=e=>{paused=!paused;(e.currentTarget as HTMLButtonElement).textContent=paused?'تشغيل الحركة':'إيقاف الحركة'};
 document.querySelector<HTMLButtonElement>('#flip')!.onclick=e=>{flip=!flip;(e.currentTarget as HTMLButtonElement).setAttribute('aria-pressed',String(flip))};
 document.querySelector<HTMLInputElement>('#bones')!.onchange=e=>{bones=(e.target as HTMLInputElement).checked};
 function draw(now:number){const dt=Math.min(.06,(now-last)/1000);last=now;if(!paused&&document.visibilityState==='visible')clock+=dt;g.reset();backdrop(g,600,740);paper.setFrame(0);drawCharacter(paper,selected,clock%6,motion,300,666,{scale:1.45,flip,bones});if(document.visibilityState==='visible')requestAnimationFrame(draw);else last=0;}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){last=performance.now();requestAnimationFrame(draw)}});
 sync();requestAnimationFrame(draw);
}
