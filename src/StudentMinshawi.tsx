import React from 'react';
import {AbsoluteFill,Audio,OffthreadVideo,staticFile,useCurrentFrame} from 'remotion';
import {CartoonGfx as Gfx} from './cartoon/StoryCards';
import {FONT_TITLE,FONT_QURAN} from './localFonts';
import config from '../data/cartoon/cartoon_772465384/config.json';
import plan from '../data/cartoon/cartoon_772465384/plan.json';
import transcript from '../data/cartoon/cartoon_772465384/words.json';

export const EXAM_CARTOON_FRAMES=config.frames;
const C={ink:'#30473f',paper:'#fff7e6',line:'#648e74',accent:'#ae6549'}; // Verified text contrast: 9.39:1.
const DIR='cartoon_772465384/';
type Cue={s:number;e:number;w:string;uncertain?:boolean;quran?:boolean};
const cues=transcript as Cue[];
const pages:Cue[][]=[];let current:Cue[]=[];
for(const w of cues){
 const prev=current[current.length-1];
 if(prev&&(w.s-prev.e>.45||current.length>=5||current.map(v=>v.w).join(' ').length+w.w.length>38||!!prev.quran!==!!w.quran)){pages.push(current);current=[];}
 current.push(w);
}
if(current.length)pages.push(current);

const SpokenCaptions:React.FC=()=>{
 const t=useCurrentFrame()/30;
 const verse=plan.verses.find(v=>t>=v.cut[0]&&t<(cues.find(w=>Math.abs(w.s-v.cut[v.cut.length-1])<.1)?.e??v.cut[v.cut.length-1]+.4)+.08);
 const group=verse?cues.filter(w=>w.quran&&w.s>=verse.cut[0]-.05&&w.s<=verse.cut[verse.cut.length-1]+.05):pages.find(p=>t>=p[0].s&&t<p[p.length-1].e+.08);
 if(!group)return null;
 const spoken=group.filter(w=>w.s<=t);if(!spoken.length)return null;
 const last=spoken[spoken.length-1];if(!verse&&t>last.e+.22)return null;
 return <div dir="rtl" style={{position:'absolute',left:50,top:72,width:980,padding:verse?'22px 28px 18px':'18px 26px',boxSizing:'border-box',background:C.paper,color:C.ink,border:`3px solid ${C.line}`,borderRadius:15,boxShadow:'0 6px 0 rgba(48,71,63,.13)',textAlign:'center',fontFamily:verse?FONT_QURAN():FONT_TITLE(),fontSize:verse?72:43,fontWeight:verse?400:800,lineHeight:verse?1.55:1.45}}>
  <div>{spoken.map(w=>w.uncertain?'…':w.w).join(' ')}</div>
  {verse&&<div style={{fontFamily:FONT_TITLE(),fontSize:22,fontWeight:600,marginTop:4}}>المائدة: ٧٣</div>}
 </div>;
};

export const StudentMinshawi:React.FC=()=>{
 FONT_TITLE();FONT_QURAN();const f=useCurrentFrame();
 return <AbsoluteFill style={{background:C.paper}}>
  <OffthreadVideo src={staticFile(DIR+'painted_engine_v1.mp4')} muted style={{position:'absolute',width:1080,height:1920,objectFit:'cover'}}/>
  <Audio src={staticFile(config.audio)}/>
  <Gfx>
   {f<45&&<div dir="rtl" style={{position:'absolute',left:100,top:305,width:880,padding:'24px 20px',boxSizing:'border-box',transform:'rotate(-1deg)',background:C.paper,color:C.ink,borderRadius:12,border:`3px solid ${C.line}`,textAlign:'center',fontFamily:FONT_TITLE(),fontSize:59,fontWeight:800,lineHeight:1.6}}>
    طرفة تقليد المنشاوي<div style={{fontSize:34,color:C.accent}}>عثمان الخميس</div>
   </div>}
   <SpokenCaptions/>
  </Gfx>
 </AbsoluteFill>;
};
