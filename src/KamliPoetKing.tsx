import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { CARTOON_PALETTE as B } from './cartoon/palette';
import { FONT_TITLE } from './localFonts';
import {CartoonGfx as Gfx, AmountCard} from './cartoon/StoryCards';
import { CartoonCaptions } from './cartoon/CartoonCaptions';
import { PaperDefs, PalaceSet, Throne, LedgerDesk, OfficeChair, smooth, unit } from './cartoon/PalacePaper';
import {cast as dodoCast,characterMarkup,poseAt,type Motion,type Expression,type V,type SpeechInterval} from '../cartoon_projects/dodo_family/rig';
import plan from '../data/cartoon/kamli_poet_king_storyboard.json';
import words from '../data/cartoon/kamli_poet_king_words.json';

export const KAMLI_FRAMES = 1569;
const DIR='kamli_poet_king/';
const STORY_SCALE=1.25;
type StoryRole='king'|'poet'|'minister';
type StoryPose='rest'|'praise'|'joy'|'order'|'ask'|'explain'|'complain'|'yes'|'deny';
type ActorProps={role:StoryRole;x:number;y:number;scale:number;pose?:StoryPose;speech?:number;progress?:number;scroll?:boolean;scrollOpen?:number;flip?:boolean;seated?:boolean;leftHand?:[number,number];rightHand?:[number,number];headTilt?:number;walk?:number;stride?:number};
const dodoById=(id:string)=>dodoCast.find(c=>c.id===id)!;
const MINISTER={...dodoById('uncle'),id:'minister',name:'الوزير',cloth:'#9babc0',description:'وزير بأسلوب دودو'};
const storyCast:Record<StoryRole,typeof dodoCast[number]>={king:dodoById('father'),poet:dodoById('uncle'),minister:MINISTER};
const motionFor=(p:StoryPose):Motion=>({rest:'idle',praise:'explain',joy:'wave',order:'point',ask:'listen',explain:'explain',complain:'angry',yes:'talk',deny:'angry'}[p] as Motion);
const armTo=(pose:ReturnType<typeof poseAt>,j:number,target:V)=>{
  const a=pose.shoulders[j],dx=target.x-a.x,dy=target.y-a.y,raw=Math.hypot(dx,dy),d=Math.max(.2,Math.min(145.9,raw)),ux=dx/(raw||1),uy=dy/(raw||1),along=d/2,h=Math.sqrt(Math.max(0,73*73-along*along)),bend=j===0?-1:1;
  pose.wrists[j]={x:a.x+ux*d,y:a.y+uy*d};pose.elbows[j]={x:a.x+ux*along-uy*h*bend,y:a.y+uy*along+ux*h*bend};
};
const DodoActor:React.FC<ActorProps>=({role,x,y,scale,pose='rest',speech=0,progress=0,scroll=false,scrollOpen=0,flip=false,seated=false,leftHand,rightHand,headTilt=0,walk=0,stride=28})=>{
  const t=useCurrentFrame()/30,c=storyCast[role],beat=plan.beats.find(b=>t>=b.from&&t<b.to),intervals:SpeechInterval[]=beat?.speaker===role?words.filter(w=>w.s>=beat.from&&w.s<beat.to).map(w=>({from:w.s,to:w.e})):[],motion:Motion=seated?'sit':walk?'walk':pose==='ask'&&intervals.length?'talk':motionFor(pose);
  const p=poseAt(t,motion,intervals);p.rootX=0;
  if(pose==='joy'){
    const bounce=Math.max(0,Math.sin(progress*Math.PI*4));p.dy=-10*bounce;p.angle=headTilt+4*Math.sin(progress*Math.PI*4);
    armTo(p,0,{x:-116,y:-302});armTo(p,1,{x:116,y:-302});
  }else if(headTilt)p.angle=headTilt;
  const custom=(j:number,h?:[number,number])=>{if(!h)return;const factor=c.height;armTo(p,j,{x:h[0]/factor,y:h[1]/factor});};
  if(pose!=='joy'){custom(0,leftHand);custom(1,rightHand);}
  const isSpeaking=beat?.speaker===role&&intervals.some(w=>t>=w.from&&t<w.to),current=intervals.find(w=>t>=w.from&&t<w.to),mouth=isSpeaking?Math.min(1,.28+.72*Math.abs(Math.sin((t-(current?.from??t))*15))):undefined;
  const html=characterMarkup(c,t,motion,{flip,pose:p,expression:(pose==='complain'||pose==='deny')?'angry':pose==='ask'?'curious':pose==='joy'?'happy':'smile',mouthOpen:mouth,openHands:pose==='joy',showSeat:false,speech:intervals,look:role==='king'?{x:-3,y:1}:role==='poet'?{x:3,y:1}:{x:0,y:1},idPrefix:`kamli-${role}`});
  const crown=role==='king'?<path d="M-50 -352L-43 -390L-17 -369L0 -403L20 -368L45 -390L51 -352Z" fill={B.goldLight} stroke={B.ink} strokeWidth="7"/>:null;
  const cape=role==='king'?<path d="M-52 -199Q0 -222 52 -199L78 -25Q0 10 -78 -25Z" fill={B.woodDeep} stroke={B.ink} strokeWidth="7" opacity=".9"/>:null;
  const scrollMark=role==='poet'&&scroll?<g transform={`translate(94 -172) rotate(-12)`} opacity={.45+.55*scrollOpen}><rect x="-17" y="-51" width="34" height="103" rx="15" fill={B.card} stroke={B.ink} strokeWidth="5"/><path d="M-8-22H8M-8-5H8M-8 12H8" stroke={B.wood} strokeWidth="3"/></g>:null;
  return <g transform={`translate(${x} ${y}) scale(${STORY_SCALE})`} data-dodo-role={role} data-talking={isSpeaking?'true':'false'}>
    {cape}
    <g dangerouslySetInnerHTML={{__html:html}}/>
    {crown}{scrollMark}
  </g>;
};

// One restrained hand accent at spaced phrase onsets; never a per-syllable twitch.
export function voicePulse(t:number, from:number, to:number):number {
  let v=0;
  let last=-Infinity;
  for(const w of words) {
    if(w.s<from || w.s>=to || w.s-last<.72)continue;
    last=w.s;
    if(t<w.s || t>w.s+.34)continue;
    v=Math.max(v,Math.sin(Math.PI*unit((t-w.s)/.34)));
  }
  return v;
}

const Shot:React.FC<{index:number;t:number}> = ({index,t}) => {
  const beat=plan.beats[index], local=t-beat.from, duration=beat.to-beat.from;
  const progress=unit(local/Math.min(.7,duration*.55));
  const pulse=voicePulse(t,index===2?6.453:beat.from,beat.to);
  const speak=(role:string)=>beat.speaker===role?pulse:0;
  const kind=(beat.environment==='office'?'office':beat.environment==='corridor'?'corridor':'palace') as 'office'|'corridor'|'palace';
  const actor=(role:StoryRole,x:number,y:number,scale:number,pose:StoryPose='rest',extra:Partial<ActorProps>={})=><DodoActor role={role} x={x} y={y} scale={scale} pose={pose} speech={speak(role)} progress={progress} scroll={role==='poet'&&index>0} scrollOpen={0} {...extra}/>;
  const king=(x=715,_sc=1.18,pose:StoryPose='rest',extra:Partial<ActorProps>={})=><><Throne x={x} y={1510} scale={STORY_SCALE}/>{actor('king',x,1420,STORY_SCALE,pose,{flip:true,seated:true,...extra})}</>;
  let people:React.ReactNode;
  switch(index){
    case 0: {
      const u=smooth(local/1.9), x=130+245*u;
      people=<>{t>=1.613&&king(795,.93)}{actor('poet',x,1660,1.16,'rest',{walk:(x-130)/134,stride:28,scroll:false})}</>;break;
    }
    case 1:{
      const open=unit(local/.85);
      people=<>{king(790,1.04)}{actor('poet',350,1670,1.42,'praise',{scroll:true,scrollOpen:open,leftHand:[125-133*smooth(open),-388],headTilt:8*smooth(local/.5)})}</>;break;
    }
    case 2:people=<>{actor('minister',210,1650,1.2,'rest')}{king(680,1.4,'order',{headTilt:7*smooth(local/.5)})}</>;break;
    case 3:{
      const open=1-smooth((local-.25)/.7),release=smooth((local-1)/.4);
      const lead=111-133*smooth(open);
      people=<>{actor('poet',520,1680,1.72,'joy',{progress:unit(local/duration),scroll:true,scrollOpen:open,rightHand:[125,-305],leftHand:[lead+(-157-lead)*release,-313-122*release],headTilt:11*(1-smooth((local-.5)/.7))})}</>;break;
    }
    case 4:people=<>{actor('poet',240,1710,1.06,'rest',{progress:.8})}{king(710,1.3,'ask')}</>;break;
    case 5:people=<>{actor('minister',210,1680,1.2)}{king(700,1.45,'order')}</>;break;
    case 6:people=<>{actor('poet',540,1665,1.63,'joy',{progress:unit(local/duration)})}</>;break;
    case 7:people=<>{actor('poet',265,1720,1.12,'rest',{flip:true,progress:.8})}{king(740,1.2,'ask')}</>;break;
    case 8:people=king(600,1.55,'order');break;
    case 9: {
      const x=230+440*smooth(local/duration);
      people=actor('poet',x,1640,1.3,'rest',{walk:(x-230)/134,stride:33});break;
    }
    case 10:{
      const hand:[number,number]=[-48,-125];
      people=<><OfficeChair x={800} y={1500} scale={STORY_SCALE}/>{actor('minister',800,1361,STORY_SCALE,'rest',{flip:true,seated:true,leftHand:hand})}{actor('poet',310,1700,STORY_SCALE,'ask')}<LedgerDesk/></>;break;
    }
    case 11:{
      const hand:[number,number]=[(745-875)/STORY_SCALE,(1143-1311)/STORY_SCALE];
      people=<><OfficeChair x={745} y={1450} scale={STORY_SCALE}/>{actor('minister',745,1311,STORY_SCALE,'ask',{flip:true,seated:true,leftHand:hand})}<LedgerDesk/></>;break;
    }
    case 12:people=<>{actor('poet',385,1690,1.55,'explain')}<LedgerDesk/></>;break;
    case 13:{
      const close=smooth(local/.6), angle=close*Math.PI;
      const hand:[number,number]=[(745-(765+110*Math.cos(angle)))/STORY_SCALE,((1143-60*Math.sin(angle))-1311)/STORY_SCALE];
      people=<><OfficeChair x={745} y={1450} scale={STORY_SCALE}/>{actor('minister',745,1311,STORY_SCALE,'deny',{flip:true,seated:true,leftHand:hand})}<LedgerDesk closed={close}/></>;break;
    }
    case 14: {
      const u=smooth(local/duration), x=820-480*u;
      people=actor('poet',x,1640,1.3,'rest',{flip:true,walk:(820-x)/134,stride:32});break;
    }
    case 15:people=<>{king(790,1.03)}{actor('poet',345,1700,1.4,'complain')}</>;break;
    case 16:people=king(590,1.55,'ask');break;
    case 17:people=actor('poet',490,1710,1.73,'explain');break;
    case 18:people=king(610,1.55,'ask');break;
    case 19:people=actor('poet',510,1700,1.7,'yes',{progress:unit(local/.6)});break;
    case 20:people=king(650,1.45,'explain');break;
    case 21:people=king(730,1.27,'explain');break;
    case 22:people=king(730,1.27,'explain');break;
    case 23:people=king(560,1.56,'ask');break;
    case 24:{
      const self=smooth((t-48.2)/.3);
      people=<>{actor('poet',270,1700,1.1)}{king(740,1.25,'explain',{rightHand:[170-150*self,-350-55*self]})}</>;break;
    }
    default:{
      const self=1-smooth((t-49.966)/.36);
      people=<>{actor('poet',270,1710,1.27,'ask',{speech:0,progress:1})}{king(810,.95,'explain',{rightHand:[170-150*self,-350-55*self]})}</>;
    }
  }
  return <>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
      <PaperDefs/><PalaceSet kind={kind} side={index%2?1:-1}/>
      {index===0&&<path d="M20 390H165V1350H20Z" fill={B.base3} stroke={B.light} strokeWidth="8"/>}
      {people}
    </svg>
    {index===21&&<div style={{position:'absolute',left:95,top:315,width:395,height:395,borderRadius:'50%',background:B.seaDark,boxShadow:`10px 18px 0 ${B.woodDeep}30`}}><Img src={staticFile(DIR+'moon_colour_v1.svg')} style={{position:'absolute',left:15,top:15,width:365,height:365,transform:`translateY(${20*(1-smooth(local/.25))}px)`}}/></div>}
    {index===22&&<div style={{position:'absolute',left:25,top:250,width:575,height:465,overflow:'hidden',borderRadius:140,border:`5px solid ${B.goldLight}`,boxShadow:`12px 15px 0 ${B.woodDeep}30`}}><Img src={staticFile(DIR+'sea_colour_v1.svg')} style={{position:'absolute',width:750,height:465,left:-85-18*smooth(local/duration),objectFit:'cover'}}/></div>}
  </>;
};

const Opening:React.FC<{f:number}> = ({f}) => {
  if(f>=53)return null;
  const q=Math.floor(f/3)*3,u=smooth((q-3)/25);
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
    <PaperDefs/><PalaceSet kind="palace" side={-1}/><Throne x={790} y={1510} scale={STORY_SCALE}/>
    <DodoActor role="king" x={790} y={1420} scale={STORY_SCALE} pose="ask" flip seated/>
    <DodoActor role="poet" x={180+150*u} y={1660} scale={STORY_SCALE} pose="rest" scroll scrollOpen={u}/>
    <path d="M0 1780H1080" stroke={B.woodDeep} strokeWidth="8" opacity=".28"/>
  </svg>;
};

export const KamliPoetKing:React.FC = () => {
  FONT_TITLE();
  const f=useCurrentFrame(),t=f/30;
  const index=Math.max(0,plan.beats.findIndex(b=>t>=b.from&&t<b.to));
  return <AbsoluteFill style={{background:B.base3}}>
    <Audio src={staticFile('kamli_poet_king/voice_1793216306635.wav')}/>
    <Gfx>
      <Shot index={index} t={t}/>
      <AmountCard at={6.893} until={8.267} amount="١٠٬٠٠٠"/>
      <AmountCard at={16.4} until={17.6} amount="٥٠٬٠٠٠"/>
      <AmountCard at={24.373} until={25.053} amount="١٠٠٬٠٠٠"/>
      <Opening f={f}/>
      <CartoonCaptions />
    </Gfx>
  </AbsoluteFill>;
};
