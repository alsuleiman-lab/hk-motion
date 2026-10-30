import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,getInputProps} from 'remotion';
import story from '../data/cartoon/abukhatt_eid1030.json';
import envelope from '../data/cartoon/abukhatt_eid1030_envelope.json';
import sourceMap from '../public/abukhatt_eid1030_map_v2.json';
import {cast,characterMarkup,poseAt,ease,type V,type Expression,type SpeechInterval} from '../cartoon_projects/family_stick/rig';
import {CARTOON_PALETTE as C} from './cartoon/palette';
import {FONT_TITLE} from './localFonts';

export const EID_FRAMES=story.frames;
type Role='father'|'uncle'|'girl'|'boy-big'|'boy-small';
type Beat=typeof story.beats[number];type Pose=ReturnType<typeof poseAt>;
type State={role:Role;x:number;y:number;scale:number;flip?:boolean;pose:Pose;expression:Expression;look?:V};
type Cash={x:number;y:number;amount:number;angle?:number;grip?:boolean};
const P=(x:number,y:number):V=>({x,y}),mix=(a:number,b:number,u:number)=>a+(b-a)*u;
const lerp=(a:V,b:V,u:number)=>P(mix(a.x,b.x,u),mix(a.y,b.y,u));
export const cutAt=(s:number)=>{const g=sourceMap.segments.find(g=>s>=g.a&&s<=g.b);return g?g.n+s-g.a:sourceMap.segments.find(g=>g.a>s)?.n??story.duration;};
export const speakerAt=(t:number):Role=>(story.speakerCues.find(c=>t>=c.from&&t<c.to)?.role as Role)??'father';
const isVoiced=(t:number)=>story.words.some(w=>t>=w.s-.015&&t<w.e+.018);
const actorById=(role:Role)=>cast.find(c=>c.id===role)!;
const ar=(n:number)=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)]);
const ownPhrases=(role:Role,beat:Beat):SpeechInterval[]=>{
 const edges=[beat.from,...story.speakerCues.flatMap(c=>[c.from,c.to]).filter(t=>t>beat.from&&t<beat.to),beat.to].sort((a,b)=>a-b);
 return edges.slice(0,-1).map((from,i)=>({from,to:edges[i+1]})).filter(p=>speakerAt((p.from+p.to)/2)===role);
};
function armTo(s:State,j:number,world:V){
 const c=actorById(s.role),k=s.scale*c.height,root=s.pose.rootX;
 const target=P((world.x-s.x)/(k*(s.flip?-1:1))-root,(world.y-s.y)/k),a=s.pose.shoulders[j];
 const dx=target.x-a.x,dy=target.y-a.y,raw=Math.hypot(dx,dy),d=Math.max(.2,Math.min(112.97,raw)),ux=dx/(raw||1),uy=dy/(raw||1),along=(56*56-57*57+d*d)/(2*d),h=Math.sqrt(Math.max(0,56*56-along*along));
 const bend=j===0?-1:1;
 s.pose.wrists[j]=P(a.x+ux*d,a.y+uy*d);s.pose.elbows[j]=P(a.x+ux*along-uy*h*bend,a.y+uy*along+ux*h*bend);
}
const wrist=(s:State,j=1)=>{const k=s.scale*actorById(s.role).height,p=s.pose.wrists[j];return P(s.x+k*(p.x+s.pose.rootX)*(s.flip?-1:1),s.y+k*p.y);};
const localPoint=(s:State,p:V)=>{const k=s.scale*actorById(s.role).height;return P(s.x+k*p.x*(s.flip?-1:1),s.y+k*p.y);};
const Gfx:React.FC<{children:React.ReactNode}>=({children})=>(getInputProps() as {hideGfx?:boolean}).hideGfx?null:<>{children}</>;

const Defs:React.FC=()=> <defs>
 <pattern id="eid-wall" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M50 8L62 38L92 50L62 62L50 92L38 62L8 50L38 38Z" fill="none" stroke={C.gold} strokeWidth="1.4" opacity=".22"/><circle cx="50" cy="50" r="5" fill="none" stroke={C.woodLight} opacity=".3"/></pattern>
 <pattern id="eid-rug" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M35 6L64 35 35 64 6 35Z" fill="none" stroke={C.card} strokeWidth="2.5"/><circle cx="35" cy="35" r="5" fill={C.goldLight}/></pattern>
 <pattern id="eid-wood" width="90" height="55" patternUnits="userSpaceOnUse"><path d="M0 10Q32 0 90 12M0 29Q50 45 90 31M22 50Q50 40 75 50" fill="none" stroke={C.woodDeep} strokeWidth="1.4" opacity=".22"/></pattern>
 </defs>;
const Window:React.FC<{x:number;y:number;w?:number;h?:number;afternoon?:boolean}>=({x,y,w=260,h=430,afternoon=false})=><g transform={`translate(${x} ${y})`} stroke={C.wood} strokeWidth="7"><path d={`M0 ${h}V${w*.42}Q${w/2} ${-w*.43} ${w} ${w*.42}V${h}Z`} fill={afternoon?C.goldLight:C.sky}/><path d={`M${w/2} 0V${h} M0 ${h*.56}H${w}`} fill="none"/><path d={`M-18 ${h+8}H${w+18}`} strokeWidth="15"/></g>;
const Plant:React.FC<{x:number;y:number;s?:number}>=({x,y,s=1})=><g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.ink} strokeWidth="3"><path d="M-35-88H35L25 0H-25Z" fill={C.mark}/><path d="M0-88V-260" stroke={C.green} strokeWidth="8"/><path d="M0-128Q-85-130-67-205Q-12-195 0-128M0-165Q89-165 62-237Q5-218 0-165M0-216Q-42-241-18-279Q22-246 0-216" fill={C.green}/></g>;
const Sofa:React.FC=()=> <g stroke={C.ink} strokeWidth="5"><rect x="95" y="1160" width="890" height="220" rx="46" fill={C.accent}/><rect x="115" y="1260" width="850" height="150" rx="30" fill={C.paper2}/><path d="M140 1408L125 1465M940 1408L955 1465" stroke={C.wood} strokeWidth="16"/>{[245,540,835].map((x,i)=><g key={x} transform={`translate(${x} 1250) rotate(${i%2?6:-5})`}><rect x="-68" y="-45" width="136" height="96" rx="15" fill={i%2?C.goldLight:C.card}/><path d="M-54-30H54V35H-54Z" fill="none" stroke={C.woodLight} strokeWidth="2"/></g>)}</g>;
const Table:React.FC<{x:number;y:number;w:number}>=({x,y,w})=><g transform={`translate(${x} ${y})`} stroke={C.ink} strokeWidth="4"><path d={`M18 10L2 195M${w-18} 10L${w-2} 195`} stroke={C.wood} strokeWidth="14"/><rect x="-5" y="-8" width={w+10} height="28" rx="10" fill={C.woodLight}/><rect x="0" y="-6" width={w} height="21" rx="8" fill="url(#eid-wood)"/></g>;
const Background:React.FC<{beat:Beat;t:number}>=({beat,t})=>{
 const yard=beat.environment==='courtyard-current',hall=beat.environment==='hallway',study=beat.environment.startsWith('study'),afternoon=t>=cutAt(58.71);
 return <g data-setting={beat.environment}>
  <rect width="1080" height="1920" fill={yard?C.sky:C.wallLight}/><rect width="1080" height="1330" fill="url(#eid-wall)"/><rect y="1330" width="1080" height="590" fill={C.floor}/><rect y="1330" width="1080" height="590" fill="url(#eid-wood)"/>
  <path d="M0 1330H1080M0 1360H1080" stroke={C.woodLight} strokeWidth="7"/><path d="M0 1780H1080M200 1330L90 1920M880 1330L990 1920" stroke={C.floorDark} strokeWidth="3"/>
  {yard?<><path d="M20 1330V600Q20 400 240 400Q460 400 460 600V1330M620 1330V600Q620 400 840 400Q1060 400 1060 600V1330" stroke={C.woodLight} strokeWidth="26" fill={C.wallLight}/><Window x={110} y={580} w={250} h={430}/><Window x={720} y={580} w={250} h={430}/><Plant x={550} y={1380} s={.85}/></>:hall?<><path d="M295 1370V650Q540 290 785 650V1370Z" fill={C.woodLight} stroke={C.woodDeep} strokeWidth="14"/><path d="M540 475V1370M318 760H762M318 1080H762" stroke={C.wood} strokeWidth="6"/><circle cx="590" cy="1040" r="15" fill={C.goldLight}/><Plant x={130} y={1410}/></>:<>
   <Sofa/><Window x={study?705:75} y={415} w={260} h={420} afternoon={afternoon}/><Plant x={980} y={1430} s={.72}/>
   {study?<g stroke={C.wood} strokeWidth="11"><path d="M55 620H330M55 845H330"/>{[85,128,173,225,275].map((x,i)=><rect key={x} x={x} y={i%2?680:657} width="30" height={i%2?146:169} rx="3" fill={i%2?C.mark:C.navy} stroke={C.ink} strokeWidth="3"/>)}</g>:<g stroke={C.wood} strokeWidth="5"><path d="M760 570H1000M760 800H1000"/>{[800,885,965].map((x,i)=><g key={x}><path d={`M${x} 574V${i%2?670:645}`} fill="none"/><path d={`M${x-20} ${i%2?670:645}L${x} ${i%2?650:625}L${x+20} ${i%2?670:645}V${i%2?730:705}H${x-20}Z`} fill={C.goldLight}/></g>)}</g>}
  </>}
  {!hall&&t>=cutAt(1.35)&&<g stroke={C.wood} strokeWidth="3"><path d="M35 355Q540 600 1045 355" fill="none" strokeWidth="4"/>{Array.from({length:13},(_,i)=>{const x=65+i*78,y=355+120*Math.sin((i+.4)/13*Math.PI);return <path key={i} d={`M${x} ${y}L${x+29} ${y+74}L${x+57} ${y+6}Z`} fill={[C.goldLight,C.accent,C.mark,C.paper2][i%4]}/>;})}</g>}
  <ellipse cx="540" cy="1710" rx="430" ry="102" fill={C.mark} opacity=".96"/><ellipse cx="540" cy="1704" rx="404" ry="80" fill="url(#eid-rug)"/>
 </g>;
};
const Banknote:React.FC<Cash>=({x,y,amount,angle=-8})=><g transform={`translate(${x+44} ${y}) rotate(${angle})`} data-prop="cash" data-amount={amount} stroke={C.ink} strokeWidth="3.2"><rect x="-42" y="-24" width="84" height="48" rx="5" fill={C.card}/><rect x="-35" y="-17" width="70" height="34" rx="3" fill="none" stroke={C.wood} strokeWidth="1.8"/><path d="M-28-11V11M28-11V11" stroke={C.woodLight} strokeWidth="3"/>{amount>0&&<text y="10" textAnchor="middle" fill={C.ink} stroke="none" fontFamily={FONT_TITLE()} fontSize="27" fontWeight="800">{ar(amount)}</text>}</g>;
const BagBack:React.FC<{open:number}>=({open})=><g data-prop="bag"><path d="M551 1300V1266Q551 1225 586 1225Q621 1225 621 1266V1300" fill="none" stroke={C.ink} strokeWidth="9"/><path d="M551 1300V1266Q551 1225 586 1225Q621 1225 621 1266V1300" fill="none" stroke={C.mark} strokeWidth="4"/><ellipse cx="586" cy="1306" rx="63" ry={5+15*open} fill={C.ink}/><path d={`M526 1303Q586 ${1303-62*open} 646 1303`} fill={C.mark} stroke={C.ink} strokeWidth="5"/></g>;
const BagFront:React.FC=()=> <g data-bag-front=""><path d="M525 1306Q586 1323 647 1306L657 1430Q657 1453 635 1453H537Q515 1453 515 1430Z" fill={actorById('girl').cloth} stroke={C.ink} strokeWidth="5"/><path d="M535 1330V1426Q535 1437 547 1437H625Q637 1437 637 1426V1330" fill="none" stroke={C.mark} strokeDasharray="5 6" strokeWidth="2"/><path d="M552 1353H620V1410H552Z" fill={C.paper} stroke={C.ink} strokeWidth="3"/><path d="M579 1370L586 1362L593 1370L586 1390Z" fill={C.mark} stroke={C.ink} strokeWidth="2"/></g>;

function makeActor(role:Role,beat:Beat,t:number,x:number,y:number,scale:number,flip=false,expression:Expression='smile'):State{
 const pose=poseAt(t,'talk',ownPhrases(role,beat));
 const state:State={role,pose,x,y,scale,flip,expression};
 if(role==='father'){const w=pose.wrists[1];armTo(state,1,localPoint(state,P(61+(w.x-61)*.6,w.y)));}
 return state;
}
const Actor:React.FC<{s:State;t:number}>=({s,t})=>{
 const active=speakerAt(t)===s.role,voiced=active&&isVoiced(t),i=Math.max(0,Math.min(envelope.values.length-1,Math.round(t*30))),mouth=voiced?Math.min(1,.025+.95*envelope.values[i]):0;
 const html=characterMarkup(actorById(s.role),t,'talk',{pose:s.pose,expression:s.expression,flip:s.flip,mouthOpen:mouth,hands:['rest','rest'],look:s.look});
 return <g transform={`translate(${s.x} ${s.y}) scale(${s.scale})`} data-actor={s.role} data-talking={voiced?'true':'false'} data-expression={s.expression}><ellipse cy="5" rx="44" ry="6" fill={C.navyDeep} opacity=".14"/><g dangerouslySetInnerHTML={{__html:html}}/></g>;
};
export function sceneAt(t:number,beat:Beat){
 const a=beat.action,local=t-beat.from,duration=beat.to-beat.from,u=ease(local/Math.max(.1,duration)),actors:State[]=[],cash:Cash[]=[];
 let bag=false,bagOpen=0;
 const father=makeActor('father',beat,t,350,1645,2.7,false,'smile'),girl=makeActor('girl',beat,t,755,1645,2.7,true,'smile');
 let camera='';
 const hold=(s:State)=>localPoint(s,P(64,-180)),rest=(s:State)=>localPoint(s,P(61,-120));
 const held=(s:State,n:number)=>{armTo(s,1,hold(s));cash.push({...wrist(s),amount:n});};
 const couple=()=>{father.look=P(4,2);girl.look=P(4,-2);father.pose.angle+=6;girl.pose.angle+=7;actors.push(father,girl);};
 const soloFather=()=>{father.x=540;camera='translate(540 1170) scale(1.1) translate(-540 -1170)';actors.push(father);};
 const exchange=(sender:State,receiver:State,n:number)=>{
  couple();const M=P(586,1230),p=ease(local/Math.min(1.45,duration*.57)),r=ease((local-.16)/Math.min(1.22,duration*.48)),contact=Math.min(1.55,duration*.6),ret=ease((local-contact)/Math.max(.24,duration-contact));
  const handS=lerp(lerp(hold(sender),M,p),rest(sender),ret),handR=lerp(lerp(rest(receiver),M,r),hold(receiver),ret);
  armTo(sender,1,handS);armTo(receiver,1,handR);
  cash.push({...wrist(local<contact?sender:receiver),amount:n===5&&t<cutAt(23.71)?0:n});
 };
 if(a==='question'){const host=makeActor('uncle',beat,t,540,1645,2.7,false,'curious');actors.push(host);}
 else if(['reminisce','aside','cost','predicament'].includes(a)){soloFather();if(a==='cost'||a==='predicament'){father.expression='curious';father.pose.angle=-5*ease(local/.5);}}
 else if(a==='grandchildren'){
  father.x=540;actors.push(father);
  if(t>=cutAt(9.25))for(const [role,x,scale,flip]of[['boy-big',180,2.6,false],['boy-small',895,2.6,true]]as const){const kid=makeActor(role,beat,t,x,1645,scale,flip,'happy');kid.pose=poseAt(Math.max(0,t-cutAt(9.25)), 'wave',[]);actors.push(kid);}
 }else if(a==='flashback'){girl.x=540;girl.flip=false;girl.pose=poseAt(Math.min(6,local),'wave',[]);camera='translate(540 1170) scale(1.25) translate(-540 -1170)';actors.push(girl);}
 else if(a==='gift-five')exchange(father,girl,5);
 else if(a==='donate-five')exchange(girl,father,5);
 else if(a==='donate-ten')exchange(girl,father,10);
 else if(a==='donate-twenty')exchange(girl,father,20);
 else if(a==='take-twenty'){couple();held(father,20);}
 else if(a==='hide-prep'){soloFather();held(father,5);father.expression='curious';}
 else if(['stash-ten','stash-twenty','stash-forty'].includes(a)){
  const n=a==='stash-ten'?10:a==='stash-twenty'?20:40,showAt=story.amounts.find(m=>m.value===n)!.at;
  const reveal=a==='stash-ten'?cutAt(43.99):beat.from;
  bag=t>=reveal;bagOpen=bag?ease((t-reveal)/.2):0;
  if(!bag){soloFather();armTo(father,1,localPoint(father,P(65,-165)));}
  else{actors.push(father);const reach=ease((t-reveal)/Math.max(.25,beat.to-reveal-.23));armTo(father,1,lerp(hold(father),P(542,1301),reach));}
  if(t>=showAt){const release=beat.to-.19,p=wrist(father);cash.push({...p,y:t<release?p.y:mix(p.y,1343,ease((t-release)/.18)),amount:n,grip:t<release});}
 }else if(['find-ten','find-twenty','hundred'].includes(a)){
  bag=true;bagOpen=ease(local/.5);camera='translate(540 1210) scale(1.22) translate(-586 -1290)';girl.look=P(2,2);actors.push(girl);
  const contact=Math.min(1.1,duration*.45),lift=ease((local-contact)/Math.max(.3,duration-contact-.1));
  const target=local<contact?lerp(rest(girl),P(542,1343),ease(local/contact)):lerp(P(542,1343),hold(girl),lift);
  armTo(girl,1,target);const n=a==='find-ten'?10:a==='find-twenty'?20:100;
  cash.push({...((local<contact)?P(542,1343):wrist(girl)),amount:a==='hundred'&&t<cutAt(73.04)?0:n,grip:local>=contact});
 }else if(a==='joy-ten'){girl.x=650;camera='translate(540 1170) scale(1.27) translate(-650 -1170)';girl.look=P(4,-2);girl.expression='happy';actors.push(girl);held(girl,10);}
 else if(a==='listen'){girl.x=650;camera='translate(540 1170) scale(1.27) translate(-650 -1170)';girl.look=P(4,-2);girl.pose.angle+=7;girl.expression='curious';actors.push(girl);held(girl,5);}
 else if(a==='punchline'){
  couple();girl.expression=t<cutAt(81.8)?'curious':'happy';
  const hug=ease((t-cutAt(81.98))/.58);armTo(girl,1,localPoint(girl,P(mix(64,43,hug),mix(-180,-193,hug))));cash.push({...wrist(girl),amount:100});
 }else{
  couple();if(['advice'].includes(a))held(girl,5);if(['explain-delay','reward'].includes(a)){held(girl,100);girl.expression='curious';}
 }
 // The prop is behind the grip, then masked by the front of the bag on insertion.
 return{actors,cash,bag,bagOpen,u,camera};
}
const Captions:React.FC<{t:number}>=({t})=>{
 const p=story.captions.find(p=>t>=p.from&&t<p.to);if(!p)return null;const words=p.words.filter(w=>w.at<=t);if(!words.length)return null;
 return <div data-caption="" dir="rtl" style={{position:'absolute',top:76,left:64,width:952,minHeight:104,boxSizing:'border-box',padding:'17px 24px',border:`4px solid ${C.wood}`,borderRadius:19,background:C.card,color:C.ink,fontFamily:FONT_TITLE(),fontWeight:800,fontSize:50,lineHeight:1.7,textAlign:'center',boxShadow:`0 8px 0 ${C.woodDeep}25`}}>{words.map((w,i)=><span key={i} data-at={w.at} style={{textDecoration:i===words.length-1?'underline':'none',textDecorationColor:C.wood,textUnderlineOffset:10}}>{i?' ':''}{w.text}</span>)}</div>;
};
export const AbuKhattEid:React.FC=()=>{
 const t=useCurrentFrame()/30,beat=story.beats.find(b=>t>=b.from&&t<b.to)??story.beats[story.beats.length-1],scene=sceneAt(t,beat);
 return <AbsoluteFill style={{background:C.wallLight,color:C.ink,forcedColorAdjust:'none',colorScheme:'only light'}}><Audio src={staticFile(story.audio)}/><Gfx><svg width="1080" height="1920" viewBox="0 0 1080 1920" data-scene={beat.id}><Defs/><g transform={scene.camera}><Background beat={beat} t={t}/>{scene.bag&&<><Table x={495} y={1455} w={185}/><BagBack open={scene.bagOpen}/></>}{scene.actors.map(s=><Actor key={s.role} s={s} t={t}/>)}{scene.cash.map((c,i)=><g key={i}><Banknote {...c}/>{c.grip!==false&&<ellipse cx={c.x} cy={c.y} rx="9" ry="11" fill={C.ink}/>}</g>)}{scene.bag&&<BagFront/>}</g></svg><Captions t={t}/></Gfx></AbsoluteFill>;
};
