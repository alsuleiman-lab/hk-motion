import {drawCharacter,poseFor,characters,styles,type Style} from './rig';
import {motions,type Motion} from './catalog';
const params=new URLSearchParams(location.search),capture=params.has('capture');
function backdrop(g:CanvasRenderingContext2D,w:number,h:number){g.fillStyle='#fbf7ed';g.fillRect(0,0,w,h);g.fillStyle='rgba(120,104,80,.07)';for(let y=10;y<h;y+=26)for(let x=10;x<w;x+=26)g.fillRect(x,y,1,1);g.strokeStyle='rgba(120,104,80,.15)';g.lineWidth=1;g.beginPath();g.moveTo(0,h*.89);g.lineTo(w,h*.89);g.stroke()}
const cn=document.querySelector<HTMLCanvasElement>('#preview')!,g=cn.getContext('2d')!;
let selected=characters[0],motion:Motion='wave',style:Style='rounded',flip=false,bones=false,paused=false,clock=0,last=0;
const makeCanvas=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function single(id:string,t:number,m:Motion,st:Style,transparent=false){const c=makeCanvas(640,800),d=c.getContext('2d')!,spec=characters.find(c=>c.id===id)!;if(!transparent)backdrop(d,640,800);drawCharacter(d,spec,t,m,320,742,st,{scale:st==='rounded'?1.6:1.85,shadow:!transparent});return c;}
function board(st:Style,t=0,animated=false){
 const c=makeCanvas(animated?1080:1600,animated?1920:2500),d=c.getContext('2d')!,w=c.width,h=c.height;backdrop(d,w,h);d.textAlign='center';d.fillStyle='#34313e';d.font=`700 ${animated?40:50}px "Segoe UI",Tahoma,sans-serif`;d.fillText(st==='rounded'?'المجموعة الأولى · الرأس الكبير':'المجموعة الثانية · الرسم الخطي',w/2,animated?65:84);
 const top=animated?100:122,row=(h-top-30)/5,col=w/2;
 for(let i=0;i<10;i++){
  const xx=(i%2)*col,yy=top+Math.floor(i/2)*row;d.fillStyle='#fffdf7';d.strokeStyle='#c2b7a4';d.lineWidth=1;d.beginPath();d.roundRect(xx+15,yy+5,col-30,row-14,14);d.fill();d.stroke();
  drawCharacter(d,characters[i],animated?t:0,animated?'wave':'idle',xx+col/2,yy+row-55,st,{scale:(animated?.68:.94)*(st==='line'?1.18:1)});
  d.fillStyle='#34313e';d.font=`600 ${animated?24:31}px "Segoe UI",Tahoma,sans-serif`;d.fillText(characters[i].name,xx+col/2,yy+row-20);
 }return c;
}
Object.assign(globalThis,{
 ready:true,catalog:characters,motionList:motions,styleList:styles,
 renderAsset:(id:string,m:Motion='idle',st:Style='rounded',t=2)=>single(id,t,m,st,true).toDataURL('image/png'),
 renderSingle:(id:string,m:Motion='wave',st:Style='rounded',t=2)=>single(id,t,m,st).toDataURL('image/png'),
 renderBoard:(st:Style)=>board(st).toDataURL('image/png'),
 frame:(n:number,st:Style)=>board(st,n/30,true).toDataURL('image/jpeg',.95),
 probe:(id:string,t:number,m:Motion,st:Style)=>poseFor(characters.find(c=>c.id===id)!,t,m,st),
 testRig:()=>{
  let checked=0,maxBoneError=0,maxGroundError=0,maxSkate=0;const failures:string[]=[];
  const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
  for(const st of styles)for(const c of characters)for(const m of motions)for(let n=0;n<180;n++){
   const t=n/30,p=poseFor(c,t,m.id,st.id);
   for(let j=0;j<2;j++){
    const e=[Math.abs(dist(p.shoulders[j],p.elbows[j])-p.armL),Math.abs(dist(p.elbows[j],p.wrists[j])-p.armL),Math.abs(dist(p.hips[j],p.knees[j])-p.legL),Math.abs(dist(p.knees[j],p.ankles[j])-p.legL)];
    maxBoneError=Math.max(maxBoneError,...e);if(e.some(v=>v>.3))failures.push(`${st.id}/${c.id}/${m.id}/${n}/${j}`);
    if(m.id!=='walk')maxGroundError=Math.max(maxGroundError,Math.abs(p.ankles[j].y+(st.id==='rounded'?8:6)));
    if(m.id==='walk'&&n>0){const q=((t/1.2+j*.5)%1+1)%1,q0=(((t-1/30)/1.2+j*.5)%1+1)%1;if(q<.6&&q0<.6&&q>=q0){const b=poseFor(c,t-1/30,m.id,st.id);maxSkate=Math.max(maxSkate,Math.abs(p.rootX+p.ankles[j].x-b.rootX-b.ankles[j].x))}}
   }checked++;
  }return {checked,maxBoneError,maxGroundError,maxSkate,failureCount:failures.length,failures:failures.slice(0,20)};
 }
});
if(capture)document.body.classList.add('capture');
else{
 const nav=document.querySelector('#characters')!,controls=document.querySelector('#motions')!,groups=document.querySelector('#styles')!;
 function sync(){document.querySelector('#name')!.textContent=selected.name;document.querySelector('#description')!.textContent=selected.description;document.querySelector('#style-name')!.textContent=style==='rounded'?'رأس كبير':'رسم خطي';for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-current',String(b.dataset.id===selected.id));for(const b of controls.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.motion===motion));for(const b of groups.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.style===style));}
 for(const c of characters){const b=document.createElement('button');b.textContent=c.name;b.dataset.id=c.id;b.type='button';b.onclick=()=>{selected=c;clock=0;sync()};nav.appendChild(b)}
 for(const m of motions){const b=document.createElement('button');b.textContent=m.name;b.dataset.motion=m.id;b.type='button';b.onclick=()=>{motion=m.id;clock=0;sync()};controls.appendChild(b)}
 for(const st of styles){const b=document.createElement('button');b.textContent=st.name;b.dataset.style=st.id;b.type='button';b.onclick=()=>{style=st.id;clock=0;sync()};groups.appendChild(b)}
 document.querySelector<HTMLButtonElement>('#pause')!.onclick=e=>{paused=!paused;(e.currentTarget as HTMLButtonElement).textContent=paused?'تشغيل الحركة':'إيقاف الحركة'};
 document.querySelector<HTMLButtonElement>('#flip')!.onclick=e=>{flip=!flip;(e.currentTarget as HTMLButtonElement).setAttribute('aria-pressed',String(flip))};document.querySelector<HTMLInputElement>('#bones')!.onchange=e=>{bones=(e.target as HTMLInputElement).checked};
 function draw(now:number){if(now-last<1000/30){requestAnimationFrame(draw);return}const dt=Math.min(.07,(now-last)/1000);last=now;if(!paused&&document.visibilityState==='visible')clock+=dt;g.reset();backdrop(g,600,740);drawCharacter(g,selected,clock%6,motion,300,670,style,{scale:style==='rounded'?1.4:1.62,flip,bones});if(document.visibilityState==='visible')requestAnimationFrame(draw);else last=0;}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){last=performance.now();requestAnimationFrame(draw)}});sync();requestAnimationFrame(draw);
}
