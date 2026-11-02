import {characters as library, type Motion as LibraryMotion} from '../character_library_v2/catalog';
export type Motion=LibraryMotion|'angry'|'talk'|'sitTalk'|'wash';
export type Expression='happy'|'smile'|'curious'|'surprised'|'angry'|'neutral';
export type V={x:number;y:number};
export const palette={ink:'#242326',paper:'#faf6ed',skin:'#fff3df',coral:'#f49a71',teal:'#8faeb1',gold:'#ebc469',blue:'#9ab7d7',rose:'#e7a4b6',veil:'#445c69',hair:'#49352d',ribbon:'#b74365'};
export const cast=[
 {...library.find(c=>c.id==='worker')!,id:'father',name:'الرجل الأول',description:'لحية داكنة · قميص مشمشي',height:1,cloth:palette.coral,beard:{color:palette.ink,length:30},expression:'happy' as Expression},
 {...library.find(c=>c.id==='elder')!,id:'uncle',name:'الرجل الثاني',description:'لحية بنية · قميص أزرق هادئ',height:1.04,cloth:palette.teal,beard:{color:palette.hair,length:38},expression:'curious' as Expression},
 {...library.find(c=>c.id==='boy')!,id:'boy-big',name:'الطفل الأكبر',description:'خصلة شعر · قميص أزرق',height:.77,cloth:palette.blue,beard:undefined,expression:'smile' as Expression},
 {...library.find(c=>c.id==='boy')!,id:'boy-small',name:'الطفل الأصغر',description:'شعر منفوش · قميص أصفر',height:.65,cloth:palette.gold,beard:undefined,expression:'happy' as Expression},
 {...library.find(c=>c.id==='girl')!,id:'girl',name:'البنت',description:'ضفيرة وربطة وردية · فستان وردي',height:.73,cloth:palette.rose,beard:undefined,expression:'happy' as Expression},
 {...library.find(c=>c.id==='niqab-navy')!,id:'mother',name:'الأم',description:'نقاب وعباءة كحلية · قفازان',height:.98,cloth:palette.veil,beard:undefined,expression:'smile' as Expression},
];
export type Actor=typeof cast[number];
export const motions:{id:Motion;name:string}[]=[{id:'talk',name:'كلام'},{id:'angry',name:'غضب'},{id:'wave',name:'تحية'},{id:'explain',name:'شرح'},{id:'point',name:'إشارة'},{id:'listen',name:'إنصات'},{id:'walk',name:'مشي'},{id:'carry',name:'حمل'},{id:'sit',name:'جلوس'},{id:'idle',name:'وقوف'}];
const pt=(x:number,y:number):V=>({x,y});
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;
export const ease=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*u*(u*(u*6-15)+10)};
const blend=(a:V,b:V,u:number)=>pt(mix(a.x,b.x,u),mix(a.y,b.y,u));
const distance=(a:V,b:V)=>Math.hypot(b.x-a.x,b.y-a.y);
export type SpeechInterval={from:number;to:number};
// Silent preview timing only. Pass real voiced intervals when using narration.
export const demoSpeech:SpeechInterval[]=[{from:.5,to:2.1},{from:2.65,to:4.45}];
export function speechAt(t:number,intervals:readonly SpeechInterval[]=demoSpeech){
 const phrase=intervals.find(p=>t>=p.from&&t<p.to);
 if(!phrase)return {active:false,mouthOpen:0,gesture:0};
 const gate=ease((t-phrase.from)/.1)*(1-ease((t-(phrase.to-.12))/.12));
 const syllable=.18+.82*(.5-.5*Math.cos((t-phrase.from)*Math.PI*8));
 const gesture=ease((t-phrase.from)/.42)*(1-ease((t-(phrase.to-.45))/.45));
 return {active:true,mouthOpen:gate*syllable,gesture};
}
// Fixed-length two-bone solver: clamp the target before drawing the wrist.
function chain(a:V,target:V,l1:number,l2:number,bend:number){
 const raw=distance(a,target),d=Math.max(.5,Math.min(l1+l2-.02,raw));
 const ux=raw?((target.x-a.x)/raw):0,uy=raw?((target.y-a.y)/raw):1;
 const b=pt(a.x+ux*d,a.y+uy*d),along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));
 return {joint:pt(a.x+along*ux-h*uy*bend,a.y+along*uy+h*ux*bend),end:b};
}
export function poseAt(t:number,m:Motion,intervals:readonly SpeechInterval[]=demoSpeech){
 const raisedGesture=m==='wave'||m==='explain'||m==='point'||m==='talk'||m==='angry';
 const u=m==='talk'?Math.max(0,t):Math.max(0,Math.min(6,t)),envelope=ease((u-.25)/(raisedGesture?1.2:.9))*(1-ease((u-(raisedGesture?4.65:4.8))/(raisedGesture?1.1:.95)));
 const dy=m==='sit'||m==='sitTalk'?52*envelope:0;
 const shoulders:[V,V]=[pt(-24,-226+dy),pt(24,-226+dy)];
 const hips:[V,V]=[pt(-13,-125+dy),pt(13,-125+dy)];
 const wrists:[V,V]=[pt(-48,-130+dy),pt(48,-130+dy)];
 // A nearly straight resting arm joins the lower IK branch without crossing
 // the torso. Keep this branch throughout the lift, hold and return.
 if(raisedGesture)wrists[1]=pt(61,-120+dy);
 if(m==='angry')wrists[0]=pt(-61,-120+dy);
 const ankles:[V,V]=[pt(-29,-8),pt(31,-8)];
 let rootX=0,angle=0;
 if(m==='wave'){wrists[1]=blend(wrists[1],pt(78+7*Math.sin((u-1)*5),-279+3*Math.cos(u*5)),envelope);angle=-4*envelope;}
 if(m==='explain'){wrists[1]=blend(wrists[1],pt(111,-204-8*Math.sin(u*1.6)),envelope);angle=-4*envelope;}
 if(m==='point'){wrists[1]=blend(wrists[1],pt(128,-232),envelope);angle=-6*envelope;}
 if(m==='talk'){const speech=speechAt(u,intervals);wrists[1]=blend(wrists[1],pt(103,-190),speech.gesture);angle=-3*speech.gesture;}
 if(m==='angry'){wrists[0]=blend(wrists[0],pt(-96,-190),envelope);wrists[1]=blend(wrists[1],pt(96,-190),envelope);angle=-7*envelope;}
 if(m==='listen')angle=9*envelope;
 if(m==='carry'){wrists[0]=blend(wrists[0],pt(-42,-169),envelope);wrists[1]=blend(wrists[1],pt(42,-169),envelope);}
 if(m==='sit'||m==='sitTalk'){wrists[0]=blend(wrists[0],pt(-27,-82),envelope);wrists[1]=blend(wrists[1],pt(45,-82),envelope);ankles[0]=pt(-29+35*envelope,-8);ankles[1]=pt(31+35*envelope,-8);}
 if(m==='sitTalk'){const speaking=speechAt(u,intervals);wrists[1]=blend(wrists[1],pt(88,-175+dy),speaking.gesture);angle=-3*speaking.gesture;}
 if(m==='wash'){
  const cycle=((u%2.4)+2.4)%2.4;
  for(let j=0;j<2;j++){
   const side=j===0?-1:1,handCycle=((cycle+j*1.2)%2.4)/2.4;
   const raise=.5-.5*Math.cos(handCycle*Math.PI*2);
   const tap=pt(side*52,-205),face=pt(side*37,-278+3*Math.sin(u*12+j));
   wrists[j]=blend(tap,face,raise);
  }
  angle=2.5*Math.sin(u*2.4);
 }
 if(m==='walk'){
  // One finite travelling take, no reset or teleport in the motion function.
  const T=1.2,speed=34,stance=.62,D=speed*T*stance;rootX=speed*(t-3);
  for(let j=0;j<2;j++){
   const phase=((t/T+j*.5)%1+1)%1,planted=phase<stance,s=(phase-stance)/(1-stance);
   ankles[j]=pt(planted?D/2-speed*phase*T:mix(-D/2,D/2,ease(s)),-8-(planted?0:19*Math.sin(Math.PI*s)**2));
   wrists[j]=pt((j?48:-48)+13*Math.sin(t/T*Math.PI*2+j*Math.PI),-135);
  }
 }
 const elbows:V[]=[],knees:V[]=[];
 for(let j=0;j<2;j++){
  const bend=j===0?(m==='angry'?-1:1):(raisedGesture?1:-1);
  const arm=chain(shoulders[j],wrists[j],56,57,bend);elbows.push(arm.joint);wrists[j]=arm.end;
  const leg=chain(hips[j],ankles[j],60,60,j===0?1:-1);knees.push(leg.joint);ankles[j]=leg.end;
 }
 return {shoulders,hips,wrists,ankles,elbows,knees,rootX,dy,angle,envelope};
}
const f=(n:number)=>Math.round(n*1000)/1000;
const path=(d:string,fill='none',w=3.4,stroke=palette.ink)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ellipse=(x:number,y:number,rx:number,ry:number,fill:string,w=3.4)=>`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${palette.ink}" stroke-width="${w}"/>`;
function limb(a:V,b:V,c:V,w=3.5){
 const before=blend(b,a,.26),after=blend(b,c,.26);
 return path(`M${f(a.x)} ${f(a.y)} L${f(before.x)} ${f(before.y)} Q${f(b.x)} ${f(b.y)} ${f(after.x)} ${f(after.y)} L${f(c.x)} ${f(c.y)}`,'none',w);
}
function face(expression:Expression,niqab=false,mouthOpen?:number,look?:V){
 const gaze=(markup:string)=>look?`<g data-gaze="" transform="translate(${f(Math.max(-5,Math.min(5,look.x)))} ${f(Math.max(-3,Math.min(3,look.y)))})">${markup}</g>`:markup;
 let eyes='';
 if(expression==='happy'&&!niqab){eyes=path('M-23 -296 Q-17 -305 -11 -296 M11 -296 Q17 -305 23 -296');}
 else eyes=ellipse(-17,-296,3.8,5,palette.ink,0)+ellipse(17,-296,3.8,5,palette.ink,0);
 const brows=path(expression==='angry'?'M-27 -312 L-10 -304 M10 -304 L27 -312':expression==='curious'?'M-24 -312 Q-17 -317 -9 -314 M10 -317 Q20 -323 26 -315':expression==='neutral'?'M-25 -309 L-10 -309 M10 -309 L25 -309':'M-25 -308 Q-17 -313 -10 -309 M10 -309 Q18 -313 25 -308','none',2.4);
 if(niqab)return gaze(eyes+(expression==='angry'?path('M-25 -302 L-10 -297 M10 -297 L25 -302','none',2.3):''));
 let mouth='';
 if(mouthOpen!==undefined){
  const open=Math.max(0,Math.min(1,Number.isFinite(mouthOpen)?mouthOpen:0)),gap=17*open;
  mouth=expression==='angry'
   ?open<.035?path('M-19 -263 Q0 -279 19 -263','none',3.2):path(`M-18 -268 Q0 -282 18 -268 Q16 ${f(-267+gap)} 0 ${f(-269+gap)} Q-16 ${f(-267+gap)} -18 -268Z`,palette.ink,2)
   :open<.035?path('M-18 -275 Q0 -269 18 -275','none',2.8):path(`M-18 -275 Q0 -272 18 -275 Q17 ${f(-274+gap)} 0 ${f(-273+gap)} Q-17 ${f(-274+gap)} -18 -275Z`,palette.ink,2)+ (open>.55?path(`M-9 ${f(-277+gap)} Q0 ${f(-282+gap)} 9 ${f(-277+gap)} Q0 ${f(-272+gap)} -9 ${f(-277+gap)}Z`,palette.coral,0):'');
 }else mouth=expression==='angry'?path('M-19 -263 Q0 -279 19 -263','none',3.2):expression==='happy'?path('M-23 -280 Q0 -270 23 -280 Q19 -254 0 -254 Q-19 -254 -23 -280Z',palette.ink,2.1)+path('M-12 -260 Q0 -266 12 -260 Q0 -253 -12 -260Z',palette.coral,0):expression==='surprised'?ellipse(0,-271,7,10,palette.ink,1):expression==='neutral'?path('M-17 -264 L17 -264','none',2.8):path('M-23 -277 Q0 -251 23 -277','none',3.4);
 return gaze(eyes+brows+`<g data-mouth="" data-mouth-open="${f(mouthOpen??-1)}">${mouth}</g>`);
}
export function characterMarkup(c:Actor,t:number,m:Motion='wave',o:{flip?:boolean;bones?:boolean;expression?:Expression;mouthOpen?:number;speech?:readonly SpeechInterval[];pose?:ReturnType<typeof poseAt>;hands?:readonly ('rest'|'open'|'point')[];look?:V}={}){
 const p=o.pose??poseAt(t,m,o.speech),mom=c.id==='mother',girl=c.id==='girl',child=c.kind==='boy'||girl,cy=-290,skin=palette.skin;
 const expression=o.expression??(m==='angry'?'angry':c.expression),mouthOpen=o.mouthOpen??(m==='talk'?speechAt(t,o.speech).mouthOpen:undefined);
 let s='';
 if(m==='sit'||m==='sitTalk')s+=path(`M-47 -57 L59 -57 L59 -49 L-47 -49Z`,'#b89979')+path('M-37 -49 L-37 0 M49 -49 L49 0');
 for(let j=0;j<2;j++)s+=limb(p.hips[j],p.knees[j],p.ankles[j])+`<g transform="translate(${f(p.ankles[j].x)} ${f(p.ankles[j].y)})">${ellipse(j?8:-8,3,21,8,palette.ink,0)}</g>`;
 for(let j=0;j<2;j++)s+=limb(p.shoulders[j],p.elbows[j],p.wrists[j],mom?12:3.5);
 if(mom)s+=path(`M-26 ${-228+p.dy} Q0 ${-244+p.dy} 26 ${-228+p.dy} L53 ${-29+p.dy*.2} Q0 ${-16+p.dy*.2} -53 ${-29+p.dy*.2}Z`,c.cloth)+path(`M-21 ${-158+p.dy} Q-27 -94 -30 -44 M24 ${-136+p.dy} L32 -43`,'none',2,'#adc4cc');
 else if(girl)s+=path(`M-23 ${-229+p.dy} Q0 ${-241+p.dy} 23 ${-229+p.dy} L46 ${-109+p.dy} Q0 ${-91+p.dy} -46 ${-109+p.dy}Z`,c.cloth);
 else s+=ellipse(0,-178+p.dy,child?32:35,58,c.cloth)+path(`M-26 ${-211+p.dy} Q-39 ${-179+p.dy} -25 ${-149+p.dy}`,'none',4,'#ffe2bc');
 const boxY=-194+18*(1-p.envelope);
 if(m==='carry'&&p.envelope>.001)s+=`<g opacity="${p.envelope}">${path(`M-42 ${boxY} L42 ${boxY} L42 -156 L-42 -156Z`,'#d8b783')+path(`M-4 ${boxY} L-4 -156 M4 ${boxY} L4 -156`,'none',2)}</g>`;
 for(let j=0;j<2;j++){
  const w=p.wrists[j],e=p.elbows[j],a=Math.atan2(w.y-e.y,w.x-e.x)*180/Math.PI;
  const open=o.hands?o.hands[j]==='open':j===1&&['wave','explain','talk'].includes(m),point=o.hands?o.hands[j]==='point':j===1&&m==='point';
  const palm=point?'M-4 -6 Q4 -10 10 -6 L25 -6 Q30 -3 25 -2 L12 -1 Q20 7 10 11 Q1 12 -4 5Z':open?'M-4 -5 L5 -8 L7 -19 Q10 -22 12 -18 L11 -6 L16 -20 Q20 -21 20 -17 L18 -4 L25 -14 Q29 -14 28 -10 L22 0 L30 -4 Q34 -3 30 2 L19 13 Q6 19 -4 6Z':'M-4 -7 Q7 -14 15 -6 Q23 2 15 9 Q4 15 -4 6Z';
  s+=`<g transform="translate(${f(w.x)} ${f(w.y)}) rotate(${f(a)}) scale(.66)">${path(palm,palette.ink,1.5)}</g>`;
 }
 let h='';
 if(mom){
  h+=path('M-48 -282 Q-52 -343 0 -344 Q52 -343 48 -282 L47 -228 Q0 -208 -47 -228Z',c.cloth);
  h+=path('M-34 -306 Q0 -316 34 -306 L33 -285 Q0 -279 -33 -285Z',skin,2);
  h+=face(expression,true,mouthOpen,o.look)+path('M-35 -281 Q0 -275 35 -281 M-31 -259 Q-20 -234 6 -230','none',2,'#adc4cc');
 }else{
  if(girl){
   const swing=4*p.envelope*Math.sin(t*2-1);
   h+=`<g transform="translate(35 -289) rotate(${f(swing)})">`;
   for(let k=0;k<5;k++)h+=ellipse((k%2?3:0),k*12+4,9-k*.65,9,palette.hair,2.4);
   h+=path('M-2 57 Q-20 43 -12 63 Q-4 68 -2 57 M0 57 Q17 44 13 63 Q5 69 0 57Z',palette.ribbon,1.7)+path('M-3 63 L-7 75 M2 63 L7 74','none',3,palette.ribbon)+'</g>';
  }
  h+=ellipse(0,cy,44,44,skin);
  if(c.id==='father')h+=path('M-40 -307 Q-36 -337 -11 -333 Q14 -340 34 -320 L40 -307 Q18 -319 6 -321 Q-17 -313 -40 -307Z',palette.ink,2.3);
  if(c.id==='uncle')h+=path('M-43 -307 A44.2 44.2 0 0 1 43 -307 Q0 -343 -43 -307Z','#ffffff',2.6)+path('M-43 -307 Q0 -343 43 -307','none',2.2,'#d6cdb8');
  if(c.kind==='boy')h+=path(c.id==='boy-small'?'M-29 -323 L-22 -336 L-13 -331 L-7 -343 L4 -334 L18 -340 L24 -327 Q0 -333 -29 -323Z':'M-35 -316 Q-32 -340 -4 -336 L16 -344 L10 -334 Q29 -334 34 -318 Q5 -330 -7 -321Z',palette.hair,2.4);
  if(girl)h+=path('M-43 -294 Q-50 -332 -17 -336 Q23 -348 43 -312 L44 -292 Q28 -300 20 -322 Q-1 -307 -27 -312 L-40 -292Z',palette.hair,2.4);
  if(c.beard)h+=path(`M-37 -275 Q-26 -264 -23 -257 Q0 -248 23 -257 Q26 -264 37 -275 L33 -246 Q20 ${-239+c.beard.length*.25} 0 ${-239+c.beard.length*.55} Q-26 -226 -33 -246Z`,c.beard.color,2.5);
  h+=face(expression,false,mouthOpen,o.look);
 }
 s+=`<g transform="translate(0 ${p.dy}) rotate(${f(p.angle)} 0 -239)">${h}</g>`;
 if(o.bones)for(let j=0;j<2;j++)for(const v of [p.shoulders[j],p.elbows[j],p.wrists[j],p.hips[j],p.knees[j],p.ankles[j]])s+=ellipse(v.x,v.y,4,4,'#ffffff',1.5);
 return `<g transform="scale(${(o.flip?-1:1)*c.height} ${c.height}) translate(${f(p.rootX)} 0)">${s}</g>`;
}
export function characterSvg(c:Actor,t=2,m:Motion='wave',o:Parameters<typeof characterMarkup>[3]={}){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-220 -390 440 440" role="img" aria-label="${c.name}">${characterMarkup(c,t,m,o)}</svg>`;}
export function lineupSvg(t=2,animated=true){
 const moves:Motion[]=['wave','explain','point','wave','wave','listen'];
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1040" viewBox="0 0 1440 1040"><defs><pattern id="paper-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#ded5c5"/></pattern></defs><rect width="1440" height="1040" fill="${palette.paper}"/><rect width="1440" height="1040" fill="url(#paper-dots)"/>${cast.map((c,i)=>`<g transform="translate(${240+(i%3)*480} ${470+Math.floor(i/3)*490})">${ellipse(0,8,74,7,'#d7dfdc',0)}${characterMarkup(c,animated?t:2,moves[i])}</g>`).join('')}</svg>`;
}
