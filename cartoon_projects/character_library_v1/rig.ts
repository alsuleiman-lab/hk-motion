import {Paper,ik,hash,type V} from '../../../Papermotion/src/index';
import {characters,type CharacterSpec,type Motion} from './catalog';
const pt=(x:number,y:number):V=>({x,y}),mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u)};
const INK='rgba(65,53,53,.56)',RIM='rgba(238,217,174,.55)';
export interface RigPose {
 shoulders:[V,V];elbows:[V,V];wrists:[V,V];hips:[V,V];knees:[V,V];ankles:[V,V];
 dy:number;rootX:number;headAngle:number;motion:Motion;handOpen:boolean;pointing:boolean;
}
const child=(c:CharacterSpec)=>c.kind==='boy'||c.kind==='girl';
/** All ten share this coordinate system. No independent hand/head translation. */
export function poseFor(c:CharacterSpec,t:number,motion:Motion):RigPose{
 const dy=motion==='sit'?58:0,span=child(c)?25:30;
 const shoulders:[V,V]=[pt(-span,-252+dy),pt(span,-252+dy)];
 const hipY=(motion==='walk'?-149:-158)+dy;
 const hips:[V,V]=[pt(-15,hipY),pt(15,hipY)];
 const rest=child(c)?-139:-134;
 const wrists:[V,V]=[pt(-53,rest-1+dy),pt(55,rest+dy)];
 let rootX=0,headAngle=0;
 const u=t%6,enter=smooth((u-.45)/.65),leave=1-smooth((u-4.65)/.8),envelope=enter*leave;
 if(motion==='wave'){
  wrists[1]=pt(mix(55,91,envelope),mix(rest,-324,envelope)+envelope*5*Math.sin(t*4));
 }else if(motion==='point'){
  wrists[1]=pt(mix(55,133,envelope),mix(rest,-249,envelope));
  headAngle=-.035*envelope;
 }else if(motion==='explain'){
  const accent=.5-.5*Math.cos(Math.PI*smooth((u-1)/2));
  wrists[1]=pt(mix(55,114,envelope),mix(rest,-211-14*accent,envelope));
  headAngle=-.025*envelope;
 }else if(motion==='carry'){
  wrists[0]=pt(-49,-187);wrists[1]=pt(49,-187);
 }else if(motion==='sit'){
  wrists[0]=pt(36,-105);wrists[1]=pt(78,-108);
 }else if(motion==='listen'){
  headAngle=-.055*smooth((u-.8)/.8)*(1-smooth((u-4.2)/.8));
 }
 const ankles:[V,V]=[pt(-23,-7),pt(27,-7)];
 if(motion==='walk'){
  const period=1.2,speed=70,stance=.6,D=speed*period*stance;
  rootX=speed*(t-3);
  for(let j=0;j<2;j++){
   const q=((t/period+j*.5)%1+1)%1,ground=q<stance;
   const v=ground?0:(q-stance)/(1-stance);
   ankles[j]=pt(ground?D/2-speed*q*period:mix(-D/2,D/2,smooth(v)), -7-(ground?0:22*Math.sin(Math.PI*v)));
   wrists[j]=pt((j?51:-49)+17*Math.cos(t/period*Math.PI*2+j*Math.PI),-148+5*Math.sin(t/period*Math.PI*2+j*Math.PI));
  }
 }else if(motion==='sit'){
  ankles[0]=pt(65,-7);ankles[1]=pt(98,-7);
 }
 const armL=child(c)?59:61,legL=76;
 const rightBend=['wave','point','explain','sit'].includes(motion)?1:-1;
 const elbows:[V,V]=[ik(shoulders[0],wrists[0],armL,armL,1,1),ik(shoulders[1],wrists[1],armL,armL,rightBend,1)];
 const knees:[V,V]=[ik(hips[0],ankles[0],legL,legL,-1,1),ik(hips[1],ankles[1],legL,legL,-1,1)];
 return {shoulders,elbows,wrists,hips,knees,ankles,dy,rootX,headAngle,motion,handOpen:['wave','explain'].includes(motion),pointing:motion==='point'};
}
function fill(p:Paper,d:string,color:string,b:[number,number,number,number],stroke=INK,sw=.9){
 const path=new Path2D(d),[x,y,w,h]=b;p.fill(path,color,[pt(x,y),pt(x+w,y+h)]);
 if(stroke){const g=p.context;g.strokeStyle=stroke;g.lineWidth=sw;g.lineJoin='round';g.stroke(path)}
}
function line(g:CanvasRenderingContext2D,vs:V[],color:string,w=1){g.beginPath();vs.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke()}
function ellipse(p:Paper,x:number,y:number,rx:number,ry:number,color:string){fill(p,`M${x-rx} ${y} a${rx} ${ry} 0 1 0 ${rx*2} 0 a${rx} ${ry} 0 1 0 ${-rx*2} 0`,color,[x-rx,y-ry,rx*2,ry*2])}
function shoe(p:Paper,a:V,c:CharacterSpec,far:boolean){const g=p.context;g.save();g.translate(a.x,a.y);fill(p,'M-13 -7 Q-6 -10 4 -7 L11 -4 Q22 -3 24 5 L21 7 L-15 7Z',c.shoe,[-17,-12,44,22]);line(g,[pt(-13,5),pt(22,5)],far?'#927c68':'#bba78b',.9);g.restore()}
function hand(p:Paper,w:V,e:V,c:CharacterSpec,pose:RigPose,j:number){
 const g=p.context;g.save();g.translate(w.x,w.y);let a=Math.atan2(w.y-e.y,w.x-e.x);
 if(pose.motion==='wave'&&j===1)a+=.10*Math.sin(w.y*.02);
 g.rotate(a);g.scale(child(c)?.83:1,child(c)?.83:1);
 const color=c.gloves?c.cloth:c.skin;
 const open=pose.handOpen&&j===1,pointing=pose.pointing&&j===1;
 const d=pointing?'M-3 -7 Q4 -10 10 -7 L29 -7 Q33 -6 30 -3 L15 -2 Q25 0 23 5 Q27 10 20 13 L8 13 L-2 7Z':open?'M-3 -7 Q4 -11 10 -7 L17 -19 Q20 -20 21 -16 L17 -6 L24 -17 Q27 -17 26 -13 L22 -3 L30 -11 Q33 -10 31 -7 L25 3 L31 0 Q34 2 30 5 L20 14 Q8 17 -2 8Z':'M-3 -7 Q4 -11 12 -6 Q22 -5 23 0 Q22 4 18 5 Q26 9 18 13 Q9 15 -2 8Z';
 fill(p,d,color,[-5,-23,41,42]);
 if(!c.gloves)line(g,[pt(8,7),pt(13,5)],'rgba(110,69,53,.32)',.6);
 g.restore();
}
function head(p:Paper,c:CharacterSpec,pose:RigPose){
 const g=p.context,y=-333+pose.dy,r=child(c)?39:34;
 g.save();g.translate(0,-275+pose.dy);g.rotate(pose.headAngle);g.translate(0,275-pose.dy);
 fill(p,`M-13 ${y+29} L-14 ${y+67} Q0 ${y+78} 18 ${y+67} L17 ${y+29}Z`,c.skin,[-18,y+23,42,60]);
 if(c.cover==='hijab'||c.cover==='niqab'){
  const sh=c.scarf!;
  fill(p,`M-44 ${y+4} Q-52 ${y-53} -10 ${y-58} Q35 ${y-62} 45 ${y-20} L49 ${y+40} Q60 ${y+65} 47 ${y+89} Q14 ${y+109} -46 ${y+85} L-38 ${y+49}Z`,sh,[-55,y-63,122,177]);
  if(c.cover==='hijab')ellipse(p,5,y+2,r*.76,39,c.skin);
  else{
   fill(p,`M-24 ${y-30} Q4 ${y-37} 30 ${y-24} L32 ${y+47} Q6 ${y+61} -26 ${y+44}Z`,c.cloth,[-30,y-40,68,105],'rgba(218,211,194,.16)',.7);
   line(g,[pt(-23,y+47),pt(7,y+58),pt(33,y+44)],'rgba(218,211,194,.2)',.8);
  }
  line(g,[pt(-36,y+18),pt(-27,y+59),pt(19,y+85)],'rgba(235,219,189,.27)',1.2);
  line(g,[pt(39,y+27),pt(31,y+63),pt(43,y+83)],'rgba(49,47,57,.25)',1.2);
 }else{
  ellipse(p,-29,y+2,7,12,c.skin);ellipse(p,33,y+1,6,12,c.skin);
  ellipse(p,2,y,r,44,c.skin);
  if(c.hair){fill(p,`M-32 ${y+4} Q-43 ${y-40} -17 ${y-47} Q16 ${y-59} 34 ${y-28} L35 ${y-12} L18 ${y-17} L8 ${y-29} Q-11 ${y-13} -26 ${y-13} L-27 ${y+6}Z`,c.hair,[-44,y-60,88,83]);}
  if(c.beard){const L=c.beard.length;
   fill(p,`M-29 ${y+12} Q-17 ${y+31} 2 ${y+31} Q24 ${y+28} 33 ${y+11} L31 ${y+49} Q30 ${y+L-15} 7 ${y+L} L0 ${y+L-4} L-7 ${y+L-2} Q-28 ${y+L-22} -30 ${y+46}Z`,c.beard.color,[-36,y+8,80,L+5]);
   for(let i=0;i<7;i++){const x=-21+i*7;line(g,[pt(x,y+44),pt(x*.65+3,y+L-17+hash(i)*8)],'rgba(239,220,182,.24)',.7)}
  }
  if(c.cover==='cap'){
   fill(p,`M-35 ${y-22} L-35 ${y-42} Q-22 ${y-61} 9 ${y-59} Q32 ${y-57} 36 ${y-39} L36 ${y-24} Q0 ${y-14} -35 ${y-22}Z`,c.scarf!,[-40,y-64,82,54]);
   for(let i=0;i<9;i++)line(g,[pt(-31+i*8,y-30),pt(-30+i*8,y-42)],'rgba(130,117,94,.35)',.7);
  }else if(c.cover==='turban'){
   fill(p,`M-39 ${y-18} Q-54 ${y-47} -23 ${y-63} Q6 ${y-77} 35 ${y-52} Q53 ${y-38} 38 ${y-18}Z`,c.scarf!,[-55,y-80,115,70]);
   line(g,[pt(-35,y-29),pt(1,y-42),pt(37,y-43)],'rgba(139,124,94,.45)',1.8);
   line(g,[pt(-26,y-53),pt(5,y-28),pt(32,y-23)],'rgba(139,124,94,.4)',1.5);
   fill(p,`M-34 ${y-20} L-37 ${y+60} L-26 ${y+70} L-21 ${y-21}Z`,c.scarf!,[-42,y-26,28,102]);
  }
 }
 g.restore();
}
export interface DrawOptions{scale?:number;flip?:boolean;bones?:boolean;shadow?:boolean}
/** Root is at the floor. Props and all distal parts use the same pose anchors. */
export function drawCharacter(p:Paper,c:CharacterSpec,t:number,motion:Motion,x:number,y:number,o:DrawOptions={}){
 const pose=poseFor(c,t,motion),g=p.context,s=(o.scale??1)*c.height,flip=o.flip?-1:1;
 g.save();g.translate(x+pose.rootX*s*flip,y);g.scale(s*flip,s);
 if(o.shadow!==false){g.save();g.fillStyle='rgba(54,49,56,.13)';g.beginPath();g.ellipse(1,4,c.width*1.4,8,0,0,Math.PI*2);g.fill();g.restore()}
 if(motion==='sit'){
  fill(p,'M-48 -83 L53 -83 L61 -72 L-51 -72Z','#9c7959',[-54,-88,119,20]);
  line(g,[pt(-38,-74),pt(-43,0)],'#6a5141',7);line(g,[pt(41,-74),pt(45,0)],'#6a5141',7);
 }
 p.sheet({shadow:1.7,rim:{color:RIM,width:.8},texture:.17,shade:{color:'rgba(49,38,51,.18)',width:2.4},edge:false},()=>{
  const g=p.context,w=c.width,dy=pose.dy;
  g.save();if(c.robe){g.beginPath();g.rect(-200,-23,400,80);g.clip()}
  for(let j=0;j<2;j++){
   p.tube([pose.hips[j],pose.knees[j],pose.ankles[j]],child(c)?28:34,child(c)?19:23,c.pants,{seed:100+j,tear:.12,edge:false,shadow:0,texture:.12});
   shoe(p,pose.ankles[j],c,j===0);
  }
  g.restore();
  const arm=(j:number)=>{
   p.tube([pose.shoulders[j],pose.elbows[j],pose.wrists[j]],child(c)?29:34,child(c)?16:19,c.cloth,{seed:115+j,tear:.15,edge:false,shadow:0,texture:.12});
   const a=pose.wrists[j],b=pose.elbows[j],dx=a.x-b.x,dyy=a.y-b.y,len=Math.hypot(dx,dyy),nx=-dyy/len,ny=dx/len;
   line(g,[pt(a.x+nx*8-dx/len*5,a.y+ny*8-dyy/len*5),pt(a.x-nx*8-dx/len*5,a.y-ny*8-dyy/len*5)],c.trim,2.2);
  };
  arm(0);
  let d:string;
  if(c.robe&&motion==='sit')d=`M${-w} ${-258+dy} Q-20 ${-278+dy} 4 ${-272+dy} Q${w-4} ${-274+dy} ${w} ${-245+dy} L${w} -113 Q77 -111 99 -83 L109 -18 Q51 -4 6 -22 L-41 -61Z`;
  else if(c.robe)d=`M${-w} ${-256+dy} Q-20 ${-278+dy} 5 ${-272+dy} Q${w-3} ${-277+dy} ${w} ${-249+dy} Q${w+5} -159 ${w+15} -21 Q7 -10 ${-w-15} -22 Q${-w-7} -146 ${-w} ${-256+dy}Z`;
  else d=`M${-w} ${-256+dy} Q-15 ${-279+dy} 4 ${-271+dy} Q${w} ${-274+dy} ${w} ${-243+dy} L${w+2} ${-142+dy} Q3 ${-128+dy} ${-w-3} ${-141+dy}Z`;
  fill(p,d,c.cloth,[-w-20,-285+dy,w*2+140,290]);
  p.inside(()=>{
   const g=p.context;
   for(let j=0;j<5;j++)line(g,[pt(-w+7,-219+dy+j*27),pt(-w+16,-228+dy+j*27)],'rgba(245,222,179,.22)',1.1);
   line(g,[pt(w-12,-230+dy),pt(w-19,-180+dy),pt(w-12,-155+dy)],'rgba(50,41,49,.22)',1.2);
   if(c.robe&&motion!=='sit'){line(g,[pt(-14,-111),pt(-17,-47)],'rgba(51,45,53,.19)',1.3);line(g,[pt(w-7,-108),pt(w+3,-31)],'rgba(245,222,179,.2)',1.1)}
  });
  if(c.vest){
   fill(p,`M${-w+2} ${-253+dy} L-13 ${-269+dy} L-7 ${-152+dy} L${-w-2} ${-147+dy}Z`,c.vest,[-w-5,-275+dy,w+10,138]);
   fill(p,`M17 ${-270+dy} L${w-1} ${-255+dy} L${w+3} ${-149+dy} L10 ${-152+dy}Z`,c.vest,[6,-276+dy,w+5,138]);
   line(g,[pt(-13,-256+dy),pt(-10,-163+dy)],c.trim,1);line(g,[pt(16,-256+dy),pt(13,-163+dy)],c.trim,1);
  }else if(c.kind==='man'||c.kind==='boy'){
   fill(p,`M-17 ${-268+dy} L-4 ${-253+dy} L4 ${-267+dy} L16 ${-251+dy} L22 ${-268+dy}Z`,c.trim,[-19,-274+dy,45,27]);
   line(g,[pt(5,-248+dy),pt(5,-218+dy)],c.trim,1.5);
   if(c.id==='worker')fill(p,`M13 ${-220+dy} L33 ${-219+dy} L32 ${-200+dy} L14 ${-199+dy}Z`,c.cloth,[10,-223+dy,28,30],c.trim,.7);
  }
  arm(1);
  if(motion==='carry'){
   fill(p,'M-48 -234 L48 -234 L48 -180 L-48 -180Z','#b79162',[-52,-238,104,62]);
   line(g,[pt(-46,-222),pt(47,-222)],'#73573f',1);fill(p,'M-5 -234 L6 -234 L6 -180 L-5 -180Z','#d6b783',[-8,-238,18,65],'',0);
  }
  hand(p,pose.wrists[0],pose.elbows[0],c,pose,0);hand(p,pose.wrists[1],pose.elbows[1],c,pose,1);
  head(p,c,pose);
 });
 if(o.bones){for(let j=0;j<2;j++){line(g,[pose.shoulders[j],pose.elbows[j],pose.wrists[j]],'#d36d45',1);line(g,[pose.hips[j],pose.knees[j],pose.ankles[j]],'#d36d45',1);for(const v of [pose.shoulders[j],pose.elbows[j],pose.wrists[j],pose.hips[j],pose.knees[j],pose.ankles[j]]){g.fillStyle='#fff5df';g.strokeStyle='#89452c';g.lineWidth=1;g.beginPath();g.arc(v.x,v.y,3,0,Math.PI*2);g.fill();g.stroke()}}}
 g.restore();return pose;
}
export {Paper,characters};
