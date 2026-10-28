import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';
import { CARTOON_PALETTE as B } from './cartoon/palette';
import { FONT_TITLE } from './localFonts';
import {CartoonGfx as Gfx, AmountCard, CartoonWord} from './cartoon/StoryCards';
import { PaperActor, PaperDefs, PalaceSet, Throne, LedgerDesk, OfficeChair, ContactPalm, smooth, unit, type Pose, type PaperRole } from './cartoon/PalacePaper';
import plan from '../data/cartoon/kamli_poet_king_storyboard.json';
import words from '../data/cartoon/kamli_poet_king_words.json';

export const KAMLI_FRAMES = 1569;
const TITLE='طرفة الشاعر والملك - سعيد الكملي';
const DIR='kamli_poet_king/';

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
  const actor=(role:PaperRole,x:number,y:number,scale:number,pose:Pose='rest',extra:Partial<React.ComponentProps<typeof PaperActor>>={})=><PaperActor role={role} x={x} y={y} scale={scale} pose={pose} speech={speak(role)} progress={progress} scroll={role==='poet'&&index>0} scrollOpen={0} {...extra}/>;
  const king=(x=715,sc=1.18,pose:Pose='rest',extra:Partial<React.ComponentProps<typeof PaperActor>>={})=><><Throne x={x} y={1510} scale={sc}/>{actor('king',x,1510,sc,pose,{flip:true,seated:true,...extra})}</>;
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
    case 2:people=<>{actor('minister',210,1650,.98,'rest')}{king(680,1.4,'order',{headTilt:7*smooth(local/.5)})}</>;break;
    case 3:{
      const open=1-smooth((local-.25)/.7),release=smooth((local-1)/.4);
      const lead=111-133*smooth(open);
      people=<>{actor('poet',520,1680,1.72,'joy',{progress:unit(local/duration),scroll:true,scrollOpen:open,rightHand:[125,-305],leftHand:[lead+(-157-lead)*release,-313-122*release],headTilt:11*(1-smooth((local-.5)/.7))})}</>;break;
    }
    case 4:people=<>{actor('poet',240,1710,1.06,'rest',{progress:.8})}{king(710,1.3,'ask')}</>;break;
    case 5:people=<>{actor('minister',210,1680,.95)}{king(700,1.45,'order')}</>;break;
    case 6:people=<>{actor('poet',540,1665,1.63,'joy',{progress:unit(local/duration)})}</>;break;
    case 7:people=<>{actor('poet',265,1720,1.12,'rest',{flip:true,progress:.8})}{king(740,1.2,'ask')}</>;break;
    case 8:people=king(600,1.55,'order');break;
    case 9: {
      const x=230+440*smooth(local/duration);
      people=actor('poet',x,1640,1.3,'rest',{walk:(x-230)/134,stride:33});break;
    }
    case 10:{
      const hand:[number,number]=[(800-875)/1.05,(1143-1500)/1.05];
      people=<><OfficeChair x={800} y={1500} scale={1.05}/>{actor('minister',800,1500,1.05,'rest',{flip:true,seated:true,leftHand:hand})}{actor('poet',310,1700,1.37,'ask')}<LedgerDesk/><ContactPalm x={800} y={1500} scale={1.05} at={hand}/></>;break;
    }
    case 11:{
      const hand:[number,number]=[(745-875)/1.47,(1143-1535)/1.47];
      people=<><OfficeChair x={745} y={1535} scale={1.47}/>{actor('minister',745,1535,1.47,'ask',{flip:true,seated:true,leftHand:hand})}<LedgerDesk/><ContactPalm x={745} y={1535} scale={1.47} at={hand}/></>;break;
    }
    case 12:people=<>{actor('poet',385,1690,1.55,'explain')}<LedgerDesk/></>;break;
    case 13:{
      const close=smooth(local/.6), angle=close*Math.PI;
      const hand:[number,number]=[(745-(765+110*Math.cos(angle)))/1.47,((1143-60*Math.sin(angle))-1535)/1.47];
      people=<><OfficeChair x={745} y={1535} scale={1.47}/>{actor('minister',745,1535,1.47,'deny',{flip:true,seated:true,leftHand:hand})}<LedgerDesk closed={close}/><ContactPalm x={745} y={1535} scale={1.47} at={hand}/></>;break;
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
  const q=Math.floor(f/3)*3;
  return <>
    {Array.from({length:5},(_,i)=>{
      const order=[1,0,2,4,3].indexOf(i), u=smooth((q-3-order*4)/25), exit=(i%2?-1:1)*1280*u;
      return <div key={i} style={{position:'absolute',inset:0,transform:`translate(${exit}px,${-200*u}px) rotate(${(i-2)*u*5}deg)`,clipPath:`polygon(${i*20}% 0, ${(i+1)*20}% 0, ${(i+1)*20}% 100%, ${i*20}% 100%)`,filter:`drop-shadow(7px 12px 7px ${B.ink}66)`}}>
        <Img src={staticFile(DIR+'cover_colour_v1.svg')} style={{width:1080,height:1920}}/>
        <Img src={staticFile(DIR+'saeed_kamli_commons_v1.jpg')} style={{position:'absolute',left:0,top:235,width:1080,height:607.5,objectFit:'contain'}}/>
      </div>;
    })}
  </>;
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
      <CartoonWord from={41.207} to={41.95} y={1460}>نعم</CartoonWord>
      <CartoonWord from={48.966} to={49.407}>بالكلام</CartoonWord>
      <CartoonWord from={50.926} to={52.273333}>بالكلام</CartoonWord>
      <Opening f={f}/>
      {f<53&&<div style={{position:'absolute',left:300,top:1430-1600*smooth((f-3)/35),width:480,padding:'10px 20px 18px',borderRadius:12,background:B.card,color:B.ink,fontFamily:FONT_TITLE(),fontSize:52,fontWeight:800,textAlign:'center'}}>سعيد الكملي</div>}
    </Gfx>
  </AbsoluteFill>;
};
