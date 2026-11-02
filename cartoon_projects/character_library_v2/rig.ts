import {ik,type V} from '../../../Papermotion/src/index';
import {characters,type CharacterSpec,type Motion} from './catalog';
export {characters};export type Style='rounded'|'line';
export const styles=[{id:'rounded' as Style,name:'المجموعة الأولى · الرأس الكبير'},{id:'line' as Style,name:'المجموعة الثانية · الرسم الخطي'}];
const INK='#242326',pt=(x:number,y:number):V=>({x,y});
const mix=(a:number,b:number,u:number)=>a+(b-a)*u,smooth=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u)};
const kid=(c:CharacterSpec)=>c.kind==='boy'||c.kind==='girl';
const pale=(hex:string,n=.77)=>{const v=hex.replace('#','').match(/../g)!.map(x=>parseInt(x,16));return '#'+v.map(x=>Math.round(mix(x,255,n)).toString(16).padStart(2,'0')).join('')};
export interface Pose{shoulders:[V,V];elbows:[V,V];wrists:[V,V];hips:[V,V];knees:[V,V];ankles:[V,V];rootX:number;dy:number;headAngle:number;armL:number;legL:number;motion:Motion;}
export function poseFor(c:CharacterSpec,t:number,m:Motion,style:Style):Pose{
 const big=style==='rounded',dy=m==='sit'?(big?38:48):0,shoulderY=(big?-204:-194)+dy,span=big?34:27,rest=big?-95:-91;
 const shoulders:[V,V]=[pt(-span,shoulderY),pt(span,shoulderY)],wrists:[V,V]=[pt(big?-47:-42,rest+dy),pt(big?49:44,rest+dy)];
 const hipY=(m==='walk'?(big?-78:-95):(big?-87.2:-104))+dy;
 const hips:[V,V]=[pt(-12,hipY),pt(12,hipY)],ankles:[V,V]=[pt(-18,big?-8:-6),pt(21,big?-8:-6)];
 const armL=big?56:54,legL=big?40:50;
 const u=t%6,e=smooth((u-.45)/.7)*(1-smooth((u-4.65)/.8));let headAngle=0,rootX=0;
 if(m==='wave')wrists[1]=pt(mix(wrists[1].x,big?106:75,e),mix(rest,big?-280:-277,e)+4*e*Math.sin(t*4));
 if(m==='point'){wrists[1]=pt(mix(wrists[1].x,big?140:130,e),mix(rest,big?-194:-194,e));headAngle=-.03*e;}
 if(m==='explain'){wrists[1]=pt(mix(wrists[1].x,big?125:112,e),mix(rest,(big?-145:-151)-5*Math.sin(t*1.4),e));headAngle=-.025*e;}
 if(m==='listen')headAngle=-.07*smooth((u-.8)/.8)*(1-smooth((u-4.2)/.8));
 if(m==='carry'){wrists[0]=pt(big?-48:-40,big?-140:-126);wrists[1]=pt(big?48:40,big?-140:-126);}
 if(m==='sit'){wrists[0]=pt(big?28:31,big?-89:-99);wrists[1]=pt(big?58:65,big?-92:-101);ankles[0]=pt(big?38:49,big?-8:-6);ankles[1]=pt(big?66:74,big?-8:-6);}
 if(m==='walk'){
  const T=1.2,speed=big?35:50,D=speed*T*.6;rootX=speed*(t-3);
  for(let j=0;j<2;j++){const q=((t/T+j*.5)%1+1)%1,ground=q<.6,v=(q-.6)/.4;ankles[j]=pt(ground?D/2-speed*q*T:mix(-D/2,D/2,smooth(v)),(big?-8:-6)-(ground?0:(big?11:15)*Math.sin(Math.PI*v)));wrists[j]=pt((j?45:-43)+9*Math.cos(t/T*Math.PI*2+j*Math.PI),rest-8+3*Math.sin(t/T*Math.PI*2+j*Math.PI));}
 }
 const rb=['wave','point','explain','sit'].includes(m)?1:-1;
 const elbows:[V,V]=[ik(shoulders[0],wrists[0],armL,armL,1,1),ik(shoulders[1],wrists[1],armL,armL,rb,1)];
 const knees:[V,V]=[ik(hips[0],ankles[0],legL,legL,-1,1),ik(hips[1],ankles[1],legL,legL,-1,1)];
 return {shoulders,elbows,wrists,hips,knees,ankles,rootX,dy,headAngle,armL,legL,motion:m};
}
function path(g:CanvasRenderingContext2D,d:string,color:string,sw:number,stroke=INK){const p=new Path2D(d);if(color){g.fillStyle=color;g.fill(p)}if(stroke){g.strokeStyle=stroke;g.lineWidth=sw;g.lineJoin='round';g.lineCap='round';g.stroke(p)}}
function line(g:CanvasRenderingContext2D,vs:V[],color=INK,w=2.5){g.beginPath();vs.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.strokeStyle=color;g.lineWidth=w;g.lineJoin='round';g.lineCap='round';g.stroke()}
function oval(g:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string,sw:number){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();g.lineWidth=sw;g.strokeStyle=INK;g.stroke()}
function limb(g:CanvasRenderingContext2D,vs:V[],color:string,width:number,sw:number){line(g,vs,INK,width+sw*2);line(g,vs,color,width)}
function head(g:CanvasRenderingContext2D,c:CharacterSpec,p:Pose,style:Style){
 const big=style==='rounded',cy=(big?-310:-270)+p.dy,rx=big?(kid(c)?85:80):(kid(c)?43:39),ry=big?80:66,sw=big?3.6:2.3;
 const skin=big?c.skin:'#fffdf7',scarf=big?c.scarf!:pale(c.scarf??c.cloth,.78);
 g.save();g.translate(0,cy+ry+9);g.rotate(p.headAngle);g.translate(0,-cy-ry-9);
 path(g,`M-14 ${cy+ry-8} L-12 ${cy+ry+23} L14 ${cy+ry+23} L17 ${cy+ry-9}Z`,skin,sw);
 if(c.cover==='hijab'||c.cover==='niqab'){
  path(g,`M${-rx-8} ${cy+3} Q${-rx-12} ${cy-ry-16} -5 ${cy-ry-13} Q${rx+10} ${cy-ry-18} ${rx+10} ${cy+11} L${rx+10} ${cy+ry+10} Q12 ${cy+ry+37} ${-rx-9} ${cy+ry+11}Z`,scarf,sw);
  if(c.cover==='hijab')oval(g,2,cy+3,rx*.70,ry*.79,skin,sw*.85);
  else path(g,`M${-rx*.66} ${cy-ry*.64} Q1 ${cy-ry*.77} ${rx*.68} ${cy-ry*.61} L${rx*.7} ${cy+ry*.71} Q1 ${cy+ry*.88} ${-rx*.66} ${cy+ry*.72}Z`,big?c.cloth:pale(c.cloth,.66),sw*.8);
  path(g,`M${-rx-1} ${cy+ry*.2} Q${-rx+8} ${cy+ry*.82} ${rx*.4} ${cy+ry+20}`,'',sw*.65);
 }else{
  if(big){oval(g,-rx+2,cy+19,13,18,skin,sw);oval(g,rx-2,cy+19,10,17,skin,sw);oval(g,0,cy,rx,ry,skin,sw)}
  else path(g,`M-36 ${cy+15} Q-50 ${cy-36} 7 ${cy-66} Q43 ${cy-44} 38 ${cy+8} Q33 ${cy+55} 6 ${cy+66} Q-24 ${cy+57} -36 ${cy+15}Z`,skin,sw);
  if(c.hair){
   if(big)path(g,`M${-rx+4} ${cy-16} Q${-rx-4} ${cy-ry+13} -12 ${cy-ry+2} Q${rx-12} ${cy-ry-9} ${rx-2} ${cy-18} L${rx-16} ${cy-29} L${rx-39} ${cy-48} Q-20 ${cy-26} ${-rx+17} ${cy-25}Z`,c.hair,sw*.8);
   else{line(g,[pt(-3,cy-68),pt(9,cy-78),pt(1,cy-65)],INK,1.7);line(g,[pt(7,cy-69),pt(16,cy-74)],INK,1.7)}
  }
  if(c.beard){
   const top=cy+(big?31:24),bottom=cy+ry+(c.beard.length-45)*(big?.65:.48),bw=rx*(big?.78:.72);
   path(g,`M${-bw} ${top} Q-7 ${top+28} ${bw} ${top} L${bw-3} ${cy+ry-5} Q${bw-5} ${bottom-13} 9 ${bottom-2} L2 ${bottom+4} L-6 ${bottom} Q${-bw+3} ${bottom-12} ${-bw} ${cy+ry-7}Z`,big?c.beard.color:'#fffdf7',sw*.9);
   if(big&&c.beard.length>60){for(let i=0;i<4;i++)path(g,`M${-31+i*20} ${cy+ry-12} L${-25+i*16} ${bottom-12}`,'',1.2,pale(c.beard.color,.35));}
   if(!big)for(let i=0;i<3;i++)line(g,[pt(-15+i*14,cy+ry-5),pt(-11+i*11,bottom-9)],INK,1.2);
  }
  if(c.cover==='cap'){
   const cw=rx*.86;
   path(g,`M${-cw} ${cy-ry+20} L${-cw} ${cy-ry-2} Q-3 ${cy-ry-28} ${cw} ${cy-ry-3} L${cw} ${cy-ry+20}Z`,big?c.scarf!:pale(c.scarf??'#ffffff'),sw*.9);
   line(g,[pt(-cw+3,cy-ry+10),pt(cw-3,cy-ry+10)],INK,big?1.6:1.1);
  }
  if(c.cover==='turban'){
   path(g,`M${-rx*.92} ${cy-ry+24} Q${-rx-12} ${cy-ry-19} -4 ${cy-ry-27} Q${rx+15} ${cy-ry-19} ${rx*.92} ${cy-ry+23}Z`,big?c.scarf!:pale(c.scarf??'#ffffff'),sw);
   path(g,`M${-rx*.74} ${cy-ry+1} Q0 ${cy-ry+13} ${rx*.75} ${cy-ry+9}`,'',sw*.65);
   path(g,`M${-rx*.5} ${cy-ry-16} Q-10 ${cy-ry+8} ${rx*.7} ${cy-ry+15}`,'',sw*.65);
  }
 }
 g.restore();
}
function palm(g:CanvasRenderingContext2D,c:CharacterSpec,p:Pose,j:number,style:Style){
 const big=style==='rounded',w=p.wrists[j],e=p.elbows[j],sw=big?3:2.1;
 g.save();g.translate(w.x,w.y);g.rotate(Math.atan2(w.y-e.y,w.x-e.x));
 const open=(p.motion==='wave'||p.motion==='explain')&&j===1,point=p.motion==='point'&&j===1;
 const d=point?'M-3 -7 Q5 -10 11 -6 L25 -6 Q29 -4 25 -2 L13 -1 Q24 3 19 8 Q21 13 10 13 L-3 7Z':open?'M-3 -6 L6 -8 L11 -17 Q14 -19 15 -15 L13 -6 L18 -17 Q22 -16 20 -12 L18 -3 L25 -11 Q28 -9 24 -5 L20 3 L27 1 Q29 4 24 7 L15 14 Q5 17 -3 7Z':'M-3 -7 Q7 -11 14 -6 Q22 -4 18 3 Q25 9 13 13 Q3 14 -3 7Z';
 g.scale(big?.85:.55,big?.85:.55);path(g,d,big?(c.gloves?c.cloth:c.skin):'#fffdf7',sw/(big?.85:.55));g.restore();
}
export function drawCharacter(g:CanvasRenderingContext2D,c:CharacterSpec,t:number,m:Motion,x:number,y:number,style:Style,o:{scale?:number;flip?:boolean;bones?:boolean;shadow?:boolean}={}){
 const p=poseFor(c,t,m,style),big=style==='rounded',s=(o.scale??1)*c.height,sw=big?3.5:2.3,w=big?c.width*.92:c.width*.88;
 const cloth=big?c.cloth:pale(c.cloth,.73),pant=big?c.pants:'#fffdf7',hipBase=big?-77:-96,sy=(big?-204:-194)+p.dy;
 g.save();g.translate(x+p.rootX*s*(o.flip?-1:1),y);g.scale(s*(o.flip?-1:1),s);
 if(o.shadow!==false){g.fillStyle='rgba(72,60,50,.1)';g.beginPath();g.ellipse(3,4,big?56:42,6,0,0,Math.PI*2);g.fill()}
 if(m==='sit'){path(g,big?'M-37 -46 L44 -46 L48 -36 L-39 -36Z':'M-30 -51 L45 -51 L45 -46 L-30 -46Z',big?'#bd946a':'#fffdf7',sw);line(g,[pt(-29,big?-36:-46),pt(-33,0)],INK,big?4:2.3);line(g,[pt(38,big?-36:-46),pt(41,0)],INK,big?4:2.3)}
 g.save();if(c.robe){g.beginPath();g.rect(-200,big?-24:-19,400,60);g.clip()}
 for(let j=0;j<2;j++){
  if(big)limb(g,[p.hips[j],p.knees[j],p.ankles[j]],pant,20,sw*.8);else line(g,[p.hips[j],p.knees[j],p.ankles[j]],INK,2.6);
  const a=p.ankles[j];if(big){g.save();g.translate(a.x,a.y);path(g,'M-17 -7 Q-4 -11 7 -5 Q25 -5 30 3 Q32 8 22 8 L-22 8 Q-25 2 -17 -7Z',c.shoe,sw*.9);g.restore()}else line(g,[p.ankles[j],pt(a.x+15,a.y),pt(a.x+17,a.y+6)],INK,2.6);
 }
 g.restore();
 function arm(j:number){
  if(big)limb(g,[p.shoulders[j],p.elbows[j],p.wrists[j]],cloth,22,sw*.9);
  else line(g,[p.shoulders[j],p.elbows[j],p.wrists[j]],INK,2.6);
 }
 arm(0);
 let d:string;
 if(c.robe&&m==='sit')d=`M${-w} ${sy+4} Q0 ${sy-10} ${w} ${sy+4} L${w} ${big?-86:-103} Q${big?57:66} ${big?-91:-103} ${big?87:96} ${big?-58:-67} L${big?95:103} -17 L5 -18 L${-w} ${big?-41:-49}Z`;
 else if(c.robe)d=`M${-w} ${sy+4} Q-4 ${sy-13} ${w} ${sy+4} L${w+13} ${big?-22:-18} Q0 ${big?-14:-12} ${-w-13} ${big?-22:-18}Z`;
 else d=`M${-w} ${sy+3} Q-2 ${sy-10} ${w} ${sy+4} L${w+7} ${hipBase+p.dy} Q0 ${hipBase+p.dy+7} ${-w-6} ${hipBase+p.dy}Z`;
 path(g,d,cloth,sw);
 if(c.vest){const v=big?c.vest:pale(c.vest,.76);path(g,`M${-w+4} ${sy+6} L-11 ${sy-3} L-6 ${hipBase+p.dy+4} L${-w-1} ${hipBase+p.dy}Z`,v,sw*.7);path(g,`M11 ${sy-3} L${w-4} ${sy+7} L${w+1} ${hipBase+p.dy} L6 ${hipBase+p.dy+4}Z`,v,sw*.7);}
 else if(c.kind==='man'||c.kind==='boy')path(g,`M-16 ${sy-2} L-5 ${sy+13} L2 ${sy+2} L11 ${sy+13} L19 ${sy}Z`,big?c.trim:pale(c.trim,.6),sw*.7);
 if(big&&c.id==='boy'){
  g.save();g.clip(new Path2D(d));line(g,[pt(-w,hipBase-17),pt(-w/2,hipBase-27),pt(0,hipBase-17),pt(w/2,hipBase-27),pt(w+4,hipBase-17)],'#6d4c3b',4);g.restore();
 }
 if(c.robe)path(g,`M${-w*.4} ${big?-75:-91} L${-w*.44} ${big?-31:-25}`,'',big?1.5:1.1);
 arm(1);
 if(m==='carry')path(g,big?'M-47 -182 L47 -182 L47 -132 L-47 -132Z':'M-39 -163 L39 -163 L39 -120 L-39 -120Z',big?'#d1ac72':'#f0e6d0',sw);
 palm(g,c,p,0,style);palm(g,c,p,1,style);head(g,c,p,style);
 if(o.bones){for(let j=0;j<2;j++){line(g,[p.shoulders[j],p.elbows[j],p.wrists[j]],'#b65338',1);line(g,[p.hips[j],p.knees[j],p.ankles[j]],'#b65338',1);for(const v of [p.shoulders[j],p.elbows[j],p.wrists[j],p.hips[j],p.knees[j],p.ankles[j]])oval(g,v.x,v.y,2.5,2.5,'#fffdf7',1)}}
 g.restore();return p;
}
