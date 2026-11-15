import {cast as baseCast,speechAt,demoSpeech,ease,type Motion,type Expression,type SpeechInterval,type V} from '../family_stick/rig';
export {speechAt,demoSpeech,ease};export type {Motion,Expression,SpeechInterval,V};
export const palette={ink:'#141414',paper:'#faf6ed',skin:'#ffcfb1',skinShade:'#f3ac85',blue:'#bad5e4',blueShade:'#99bcd0',gold:'#efd28a',denim:'#7fa4c4',peach:'#efad79',rose:'#d8afd2',veil:'#7a94a5',ribbon:'#a33962',hair:'#332820',sage:'#a9c5a0',cap:'#c9594b',chain:'#e3b94d'};
export const cast=baseCast.map((c,i)=>({...c,height:[1,1.02,.81,.69,.77,.99,.88][i],cloth:[palette.blue,palette.gold,palette.denim,palette.peach,palette.rose,palette.veil,palette.sage][i],description:['رأس دودو كبير · لحية سوداء وقميص سماوي','لحية بنية · قميص أصفر دافئ','الطفل الأكبر · خصلة شعر وقميص أزرق','الطفل الأصغر · شعر منفوش وقميص خوخي','ضفيرة وربطة شعر · فستان وردي','الأم · نقاب وعباءة زرقاء هادئة','ولد صايع · كاب مائل وهودي أخضر وسلسلة · ابتسامة جانبية وعود أسنان'][i],beard:c.beard?{...c.beard,color:i===0?palette.ink:palette.hair}:undefined}));
export type Actor=typeof cast[number];
export const motions:{id:Motion;name:string}[]=[{id:'talk',name:'كلام'},{id:'angry',name:'غضب'},{id:'wave',name:'تحية'},{id:'explain',name:'شرح'},{id:'point',name:'إشارة'},{id:'listen',name:'إنصات'},{id:'walk',name:'مشي'},{id:'carry',name:'حمل'},{id:'sit',name:'جلوس'},{id:'idle',name:'وقوف'}];
const pt=(x:number,y:number):V=>({x,y}),mix=(a:number,b:number,u:number)=>a+(b-a)*u,blend=(a:V,b:V,u:number)=>pt(mix(a.x,b.x,u),mix(a.y,b.y,u));
export function chain(a:V,target:V,l:number,bend:number){
 const raw=Math.hypot(target.x-a.x,target.y-a.y),d=Math.min(l*2-.04,Math.max(.2,raw)),ux=(target.x-a.x)/(raw||1),uy=(target.y-a.y)/(raw||1),h=Math.sqrt(Math.max(0,l*l-d*d/4));
 return {joint:pt(a.x+ux*d/2-uy*h*bend,a.y+uy*d/2+ux*h*bend),end:pt(a.x+ux*d,a.y+uy*d)};
}
export function poseAt(t:number,m:Motion,intervals:readonly SpeechInterval[]=demoSpeech){
 const u=m==='talk'?Math.max(0,t):Math.max(0,Math.min(6,t)),envelope=m==='sit'?1:ease((u-.25)/1.4)*(1-ease((u-4.35)/1.4)),dy=m==='sit'?18:0;
 const shoulders:[V,V]=[pt(-56,-185+dy),pt(56,-185+dy)],hips:[V,V]=[pt(-23,-96+dy),pt(23,-96+dy)];
 const wrists:[V,V]=[pt(-100,-50+dy),pt(100,-50+dy)],ankles:[V,V]=[pt(-32,-8),pt(32,-8)];
 let rootX=0,angle=0;
 if(m==='wave'){wrists[1]=blend(wrists[1],pt(137+6*Math.sin((u-1)*4.3),-280+3*Math.cos(u*4.3)),envelope);angle=-3*envelope;}
 if(m==='explain'){wrists[1]=blend(wrists[1],pt(177,-145-4*Math.sin(u*1.3)),envelope);angle=-3*envelope;}
 if(m==='point'){wrists[1]=blend(wrists[1],pt(194,-183),envelope);angle=-4*envelope;}
 if(m==='listen')angle=7*envelope;
 if(m==='angry'){wrists[0]=blend(wrists[0],pt(-156,-157),envelope);wrists[1]=blend(wrists[1],pt(156,-157),envelope);angle=-5*envelope;}
 if(m==='talk'){const s=speechAt(u,intervals);wrists[1]=blend(wrists[1],pt(163,-142),s.gesture);angle=-2.5*s.gesture;}
 if(m==='carry'){wrists[0]=blend(wrists[0],pt(-42,-159),envelope);wrists[1]=blend(wrists[1],pt(42,-159),envelope);}
 if(m==='sit'){wrists[0]=blend(wrists[0],pt(-25,-55+dy),envelope);wrists[1]=blend(wrists[1],pt(25,-55+dy),envelope);ankles[0]=pt(-62,14);ankles[1]=pt(62,14);}
 if(m==='walk'){
  const T=1.2,speed=24,stance=.62,D=speed*T*stance;rootX=speed*(t-3);
  for(let j=0;j<2;j++){const phase=((t/T+j*.5)%1+1)%1,planted=phase<stance,s=(phase-stance)/(1-stance);ankles[j]=pt(planted?D/2-speed*phase*T:mix(-D/2,D/2,ease(s)),-8-(planted?0:14*Math.sin(Math.PI*s)**2));wrists[j]=pt((j?100:-100)+8*Math.sin(t/T*Math.PI*2+j*Math.PI),-52);}
 }
 const elbows:V[]=[],knees:V[]=[];
 for(let j=0;j<2;j++){
  const inward=m==='carry'||m==='sit',bend=j===0?(inward?1:-1):(inward?-1:1),arm=chain(shoulders[j],wrists[j],73,bend),leg=chain(hips[j],ankles[j],49,j===0?1:-1);
  elbows.push(arm.joint);wrists[j]=arm.end;knees.push(leg.joint);ankles[j]=leg.end;
 }
 return {shoulders,hips,wrists,elbows,knees,ankles,rootX,angle,dy,envelope};
}
const f=(n:number)=>Math.round(n*1000)/1000;
const path=(d:string,fill='none',w=7,stroke=palette.ink)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const oval=(x:number,y:number,rx:number,ry:number,fill:string,w=0)=>`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${palette.ink}" stroke-width="${w}"/>`;
function limb(a:V,b:V,c:V,w=7){const before=blend(b,a,.32),after=blend(b,c,.32);return path(`M${f(a.x)} ${f(a.y)} L${f(before.x)} ${f(before.y)} Q${f(b.x)} ${f(b.y)} ${f(after.x)} ${f(after.y)} L${f(c.x)} ${f(c.y)}`,'none',w);}
const headShape='M-79 -227 C-112 -276 -70 -326 -15 -354 Q-3 -359 9 -365 Q-2 -350 -17 -337 Q12 -345 27 -350 Q5 -337 31 -333 C89 -318 108 -268 80 -220 C47 -169 -48 -169 -79 -227Z';
const coveredHeadShape='M-82 -224 C-112 -272 -75 -331 -11 -348 C46 -361 100 -311 93 -257 C92 -238 89 -216 86 -196 L-80 -196 C-81 -205 -82 -214 -82 -224Z';
function face(expression:Expression,mouthOpen:number|undefined,mom:boolean,look:V={x:0,y:0}){
 const dx=Math.max(-5,Math.min(5,look.x)),dy=Math.max(-3,Math.min(3,look.y)),gaze=`<g transform="translate(${f(dx)} ${f(dy)})">`;
 const eyes=oval(-17,-287,5.2,6.3,palette.ink)+oval(2,-293,5.2,6.3,palette.ink);
 const lids=expression==='smirk'?path('M-26 -294 L-8 -294 L-8 -288 L-26 -288Z M-7 -300 L11 -300 L11 -293 L-7 -293Z',palette.skin,0)+path('M-26 -288 L-8 -288 M-7 -293 L11 -293','none',3.6)+path('M-30 -301 L-9 -297 M-5 -310 Q6 -316 19 -308','none',4):'';
 const angry=expression==='angry'?path('M-27 -302 L-11 -296 M-1 -302 L14 -310','none',4):'';
 if(mom)return `<g data-face="">${gaze}${eyes}${angry}</g></g>`;
 let mouth='';
 if(mouthOpen!==undefined){const open=Math.max(0,Math.min(1,Number.isFinite(mouthOpen)?mouthOpen:0)),ry=1.2+15*open,rx=7+4*open;mouth=oval(1,-239,rx,ry,palette.ink);}
 else if(expression==='smirk')mouth=path('M-15 -242 Q4 -231 24 -253','none',6);
 else if(expression==='angry')mouth=path('M-9 -228 Q-1 -254 12 -231','none',6);
 else if(expression==='happy')mouth=path('M-18 -247 Q-14 -209 1 -208 Q17 -210 20 -247 Q1 -227 -18 -247Z',palette.ink,3);
 else if(expression==='surprised')mouth=oval(1,-239,8,15,palette.ink);
 else if(expression==='curious')mouth=path('M-7 -246 Q-12 -211 5 -221 Q14 -227 10 -248','none',6);
 else mouth=path('M-8 -247 Q-10 -216 1 -219 Q12 -224 10 -250','none',6);
 return `<g data-face="">${gaze}${eyes}${lids}${angry}<g data-mouth="" data-mouth-open="${f(mouthOpen??-1)}">${mouth}</g></g></g>`;
}
export function characterMarkup(c:Actor&{grandRobe?:boolean;turban?:boolean},t:number,m:Motion='wave',o:{flip?:boolean;bones?:boolean;expression?:Expression;mouthOpen?:number;speech?:readonly SpeechInterval[];pose?:ReturnType<typeof poseAt>;look?:V;openHands?:boolean;pointHand?:number;showSeat?:boolean;idPrefix?:string}={}){
 const p=o.pose??poseAt(t,m,o.speech),mom=c.id==='mother',girl=c.id==='girl',id=(o.idPrefix??'dodo')+'-'+c.id,expression=o.expression??(m==='angry'?'angry':c.expression),mouth=o.mouthOpen??(m==='talk'?speechAt(t,o.speech).mouthOpen:undefined);
 let s=`<defs><linearGradient id="${id}-skin" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${palette.skin}"/><stop offset="1" stop-color="${palette.skinShade}"/></linearGradient><linearGradient id="${id}-shirt" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${c.cloth}"/><stop offset="1" stop-color="${c.id==='father'?palette.blueShade:c.cloth}"/></linearGradient></defs>`;
 if(m==='sit'&&o.showSeat!==false)s+=path('M-57 -48 L64 -48 L64 -40 L-57 -40Z','#c9aa81',4)+path('M-46 -40 L-46 1 M52 -40 L52 1','none',4);
 for(let j=0;j<2;j++)s+=limb(p.hips[j],p.knees[j],p.ankles[j],7)+oval(p.ankles[j].x+(j?8:-8),p.ankles[j].y+3,23,9,palette.ink);
 for(let j=0;j<2;j++)s+=limb(p.shoulders[j],p.elbows[j],p.wrists[j],mom?12:7);
 if(mom)s+=path(`M-55 ${-204+p.dy} Q0 ${-213+p.dy} 55 ${-204+p.dy} L69 ${-26+p.dy*.15} Q0 ${-14+p.dy*.15} -69 ${-26+p.dy*.15}Z`,`url(#${id}-shirt)`)+path(`M-28 ${-117+p.dy} L-37 -39 M30 ${-110+p.dy} L39 -39`,'none',2.5,'#d8e5eb');
 else if(girl)s+=path(`M-53 ${-203+p.dy} Q0 ${-217+p.dy} 53 ${-203+p.dy} L67 ${-63+p.dy} Q0 ${-51+p.dy} -67 ${-63+p.dy}Z`,`url(#${id}-shirt)`);
 else if(c.grandRobe){const y=p.dy;s+=path(`M-55 ${-205+y} Q0 ${-218+y} 55 ${-205+y} L68 -14 Q0 -2 -68 -14Z`,`url(#${id}-shirt)`)+path(`M-6 ${-200+y} L-4 -10`,'none',2.5,'#d9d2bf')+path(`M-57 ${-203+y} L-72 -14 L-36 -10 L-30 ${-196+y}Z`,'#7a5a3a',5)+path(`M57 ${-203+y} L72 -14 L36 -10 L30 ${-196+y}Z`,'#7a5a3a',5)+path(`M-30 ${-196+y} L-36 -10 M30 ${-196+y} L36 -10`,'none',4,palette.gold)+path(`M-55 ${-205+y} Q0 ${-218+y} 55 ${-205+y}`,'none',5,palette.gold);}
 else s+=path(`M-55 ${-205+p.dy} Q0 ${-218+p.dy} 55 ${-205+p.dy} L58 ${-62+p.dy} L-58 ${-62+p.dy}Z`,`url(#${id}-shirt)`);
 if(c.id==='boy-street'){const y=p.dy;s+=path(`M-34 ${-209+y} Q0 ${-170+y} 34 ${-209+y}`,'none',5)+path(`M-10 ${-190+y} L-13 ${-140+y} M10 ${-190+y} L13 ${-142+y}`,'none',4)+path(`M-40 ${-118+y} L-30 ${-84+y} L30 ${-84+y} L40 ${-118+y}`,'none',4)+path(`M-30 ${-210+y} Q0 ${-146+y} 30 ${-210+y}`,'none',4,palette.chain)+oval(0,-152+y,7,9,palette.chain,3);}
 if(m==='carry'&&p.envelope>.001)s+=`<g opacity="${f(p.envelope)}">${path('M-42 -192 L42 -192 L42 -148 L-42 -148Z','#ddbf8e',4)+path('M-4 -192 L-4 -148 M4 -192 L4 -148','none',2)}</g>`;
 for(let j=0;j<2;j++){
  const w=p.wrists[j],e=p.elbows[j],a=Math.atan2(w.y-e.y,w.x-e.x)*180/Math.PI,point=o.pointHand===j||m==='point'&&j===1,open=o.openHands===true||['wave','talk','explain'].includes(m)&&j===1;
  const palm=point?'M-5 -6 Q4 -10 10 -6 L26 -6 Q31 -3 25 -1 L13 0 Q18 9 9 11 Q-1 12 -5 5Z':open?'M-5 -5 L4 -8 L6 -18 Q9 -21 11 -17 L10 -5 L15 -19 Q19 -20 19 -16 L17 -3 L24 -13 Q28 -13 27 -9 L21 1 L27 -3 Q31 -2 28 3 L18 13 Q4 17 -5 6Z':'M-5 -7 Q8 -13 16 -4 Q22 5 12 11 Q1 15 -5 5Z';
  s+=`<g transform="translate(${f(w.x)} ${f(w.y)}) rotate(${f(a)}) scale(.75)">${path(palm,palette.ink,1)}</g>`;
 }
 let h='';
 if(girl){const swing=3.5*p.envelope*Math.sin(t*1.7-.8);h+=`<g transform="translate(76 -232) rotate(${f(swing)})">`;for(let k=0;k<4;k++)h+=oval(k%2?2:-2,k*15,12-k,12,palette.hair,3);h+=path('M-2 54 Q-25 39 -19 58 Q-12 67 -2 54 M1 54 Q24 39 20 59 Q12 67 1 54Z',palette.ribbon,3)+path('M-3 60 L-9 76 M3 60 L9 76','none',4,palette.ribbon)+'</g>';}
 h+=path(mom?coveredHeadShape:headShape,mom?`url(#${id}-shirt)`:`url(#${id}-skin)`,8.5);
 if(mom){h+=path('M-39 -309 Q-8 -325 30 -308 L30 -278 Q-5 -267 -38 -281Z',palette.skin,4)+path('M-62 -246 L66 -246','none',3,'#d8e5eb');}
 else{
  if(c.beard)h+=path('M-65 -230 Q-57 -215 -38 -206 Q-15 -200 1 -202 Q29 -202 60 -231 L56 -197 Q26 -165 1 -170 Q-36 -171 -57 -197Z',c.beard.color,5);
  if(girl)h+=path('M-87 -249 Q-105 -300 -46 -338 Q-8 -360 12 -361 Q62 -346 82 -302 L83 -265 Q58 -294 41 -324 Q4 -291 -32 -309 Q-62 -280 -87 -249Z',palette.hair,5);
  else if(c.id==='boy-street')h+=path('M-86 -308 C-90 -350 -42 -368 8 -368 C62 -368 102 -346 95 -308 Q4 -334 -86 -308Z',palette.cap,6)+path('M-84 -312 Q-136 -314 -144 -293 Q-108 -283 -79 -299Z',palette.cap,6)+oval(8,-368,5.5,5.5,palette.cap,4)+path('M-2 -338 L9 -360 L20 -338 L-4 -352 L22 -352Z',palette.chain,3)+path('M92 -304 Q112 -296 104 -270 M84 -312 Q102 -300 94 -282','none',6,palette.hair);
  else if(c.turban)h+=path('M-92 -292 C-108 -352 -56 -392 8 -392 C70 -392 114 -356 98 -292 Q4 -318 -92 -292Z','#fffdf5',7)+path('M-70 -322 Q8 -350 86 -322 M-76 -306 Q8 -334 92 -306','none',3.5,'#d9d2bf')+path('M-88 -298 Q-110 -270 -100 -236 Q-90 -262 -76 -282Z','#fffdf5',6);
  else if(c.id==='boy-small')h+=path('M-53 -327 L-34 -349 L-23 -339 L-2 -359 L4 -343 L28 -348 L22 -334','none',6);
  else h+=path('M-17 -338 Q5 -355 11 -366 M-2 -338 Q23 -347 32 -350','none',6);
 }
 h+=face(expression,mouth,mom,o.look);
 if(c.id==='boy-street')h+=path('M14 -246 L58 -262','none',4,'#c99a5b')+oval(60,-262.5,4,3.2,palette.peach,3);
 s+=`<g transform="translate(0 ${p.dy}) rotate(${f(p.angle)} 0 -190)">${h}</g>`;
 if(o.bones)for(let j=0;j<2;j++)for(const v of [p.shoulders[j],p.elbows[j],p.wrists[j],p.hips[j],p.knees[j],p.ankles[j]])s+=oval(v.x,v.y,4,4,palette.paper,2);
 return `<g transform="scale(${(o.flip?-1:1)*c.height} ${c.height}) translate(${f(p.rootX)} 0)">${s}</g>`;
}
export function characterSvg(c:Actor,t=2,m:Motion='wave',o:Parameters<typeof characterMarkup>[3]={}){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-245 -410 490 460" role="img" aria-label="${c.name}">${characterMarkup(c,t,m,o)}</svg>`;}
export function lineupSvg(t=2,animated=true){
 const moves:Motion[]=['wave','explain','point','wave','wave','listen','idle'];
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1060" viewBox="0 0 1500 1060"><defs><pattern id="dodo-dots" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#ded5c5"/></pattern></defs><rect width="1500" height="1060" fill="${palette.paper}"/><rect width="1500" height="1060" fill="url(#dodo-dots)"/>${cast.map((c,i)=>`<g transform="translate(${190+(i%4)*375} ${470+Math.floor(i/4)*510})">${oval(0,7,84,7,'#d5dedc')}${characterMarkup(c,animated?t:2,moves[i])}</g>`).join('')}</svg>`;
}
