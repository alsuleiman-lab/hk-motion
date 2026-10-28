import React from "react";
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Gfx} from "../MG";
import {FONT_TEXT} from "../localFonts";
import {DonkeyRig, PersonRig} from "./JuhaRigs";
import {JUHA_CUES as C, JUHA_WORDS} from "./juhaTiming";

export const JUHA_ANIMATED_FRAMES = 450;
const font = FONT_TEXT();
const image = (name: string) => staticFile(`juha_story/rig_v3/${name}.png`);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (f: number, at: number, duration: number) => {
  const p = Math.max(0, Math.min(1, (f - at) / duration));
  return p * p * (3 - 2 * p);
};
const hop = (f: number, at: number, duration: number, height = 70) => f >= at && f <= at + duration ? Math.sin((f - at) / duration * Math.PI) * height : 0;

const SpokenWriting: React.FC = () => {
  const f = useCurrentFrame();
  const spoken = JUHA_WORDS.filter(w => w.at * 30 <= f);
  if (!spoken.length) return null;
  const last = spoken[spoken.length - 1];
  const words = spoken.filter(w => w.group === last.group);
  const text = words.map(w => w.text).join(" ");
  const age = f - last.at * 30;
  const pulse = Math.sin(age * .9) * Math.exp(-age / 4) * .045;
  const emphasis = last.group === 7;
  if (emphasis) return <div dir="rtl" style={{position:"absolute",top:490,left:60,right:60,textAlign:"center",fontFamily:font,fontSize:104,fontWeight:800,color:"#e6b54d",WebkitTextStroke:"2px #1c2938",paintOrder:"stroke fill",transform:`scale(${1 + pulse})`}}>{text}<svg width="700" height="35" viewBox="0 0 700 35" style={{display:"block",margin:"2px auto"}}><path d="M20 24 Q260 0 670 20" fill="none" stroke="#e6b54d" strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={interpolate(age,[0,8],[1,0],{extrapolateRight:"clamp"})}/></svg></div>;
  return <div style={{position:"absolute",top:160,left:"50%",maxWidth:910,width:"max-content",padding:"21px 35px 23px",boxSizing:"border-box",transform:`translateX(-50%) scale(${1 + pulse},${1 - pulse * .6}) rotate(${pulse * 2}deg)`,transformOrigin:"center bottom"}}>
    <svg viewBox="0 0 1000 200" preserveAspectRatio="none" width="100%" height="100%" style={{position:"absolute",inset:0,overflow:"visible"}}><path d="M27 8 Q220 3 455 9 T963 8 Q989 8 991 34 L989 169 Q988 192 960 191 Q650 196 470 190 T30 191 Q8 190 10 166 L8 34 Q9 10 27 8Z" fill="#fff8ec" stroke="#20272c" strokeWidth="4" vectorEffect="non-scaling-stroke"/></svg>
    <svg width="62" height="48" viewBox="0 0 62 48" style={{position:"absolute",left:last.group===3 || last.group===5 || last.group===8 ? "32%" : "61%",bottom:-33}}><path d="M3 0 L49 0 Q38 17 17 43 Q23 23 19 0" fill="#fff8ec" stroke="#20272c" strokeWidth="4" strokeLinejoin="round"/></svg>
    <div dir="rtl" style={{position:"relative",fontFamily:font,fontSize:text.length>27?58:64,fontWeight:700,lineHeight:1.3,textAlign:"center",color:"#20272c",whiteSpace:"normal"}}>{text}</div>
  </div>;
};

export const JuhaAnimated: React.FC = () => {
  const f = useCurrentFrame();
  const travel = smooth(f, 29, 14);
  const villageX = -travel * 1080;
  const marketX = (1 - travel) * 1080;
  const juhaSeat = smooth(f,C.ride,16) - smooth(f,C.down,14) + smooth(f,C.both,18) - smooth(f,C.walk,22);
  const boySeat = smooth(f,C.son+2,16) - smooth(f,C.walk,22);
  const afterWalk = smooth(f,C.walk,28);
  const endProgress = Math.max(0,Math.min(1,(f-C.walk)/153));
  const donkeyX = mix(mix(540,590,smooth(f,0,C.ride)),370 + endProgress*70,afterWalk);
  const juhaWalkX = mix(280 + smooth(f,0,C.ride)*55,760 + endProgress*35,afterWalk);
  const jx = mix(juhaWalkX,donkeyX-65,juhaSeat);
  const jy = mix(1555,1365,juhaSeat)-hop(f,C.ride,16)-hop(f,C.down,14,55)-hop(f,C.both,18)-hop(f,C.walk,22,85);
  const boyEnter = smooth(f,C.son,17);
  const boyWalkX = mix(mix(110,540,boyEnter),620+endProgress*30,afterWalk);
  const bx = mix(boyWalkX,donkeyX+65,boySeat);
  const by = mix(1555,1320,boySeat)-hop(f,C.son+2,16)-hop(f,C.walk,22,60);
  const crowd = smooth(f,C.people,12)*(1-smooth(f,C.walk,18));
  const burden = smooth(f,C.both,18)*(1-smooth(f,C.walk,22));
  const wise = smooth(f,C.speaking,12);
  return <AbsoluteFill style={{overflow:"hidden",backgroundColor:"#29384a"}}>
    <Audio src={staticFile("juha_story_narration_voicestudio_final.wav")}/>
    <AbsoluteFill style={{overflow:"hidden"}}>
      <Img src={image("village")} style={{position:"absolute",width:1080,height:1920,objectFit:"cover",transform:`translateX(${villageX}px) scale(1.015)`,filter:`blur(${travel*(1-travel)*10}px)`}}/>
      <Img src={image("market")} style={{position:"absolute",width:1080,height:1920,objectFit:"cover",transform:`translateX(${marketX}px) scale(1.015)`,filter:`blur(${travel*(1-travel)*10}px)`}}/>
    </AbsoluteFill>
    {["juha","boy","donkey_body","donkey_head"].map(name=><Img key={name} src={image(name)} style={{position:"absolute",width:1,height:1,opacity:0}}/>)}
    <Gfx>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:"absolute",inset:0,overflow:"visible"}}>
        <g opacity={crowd}>
          <PersonRig x={mix(-100,118,crowd)} floor={1558} frame={f} scale={.68} gesture={.78+Math.sin(f*.13)*.15} coat="#725345"/>
          <PersonRig x={mix(1180,962,crowd)} floor={1558} frame={f+12} scale={.67} gesture={.84+Math.sin(f*.15)*.12} flip coat="#a77d53"/>
        </g>
        <DonkeyRig x={donkeyX} floor={1560} frame={f} burden={burden} tired={f>260 && f<C.walk+16}/>
        <path d={`M${jx+64},${jy-174} Q${jx+190},${jy-108} ${donkeyX+265},${1560-283}`} fill="none" stroke="#71502f" strokeWidth="5" opacity=".95"/>
        <PersonRig x={jx} floor={jy} frame={f} seat={juhaSeat} walk={(1-juhaSeat)*(1-wise*.25)} gesture={wise*.85} talking={f>C.speaking}/>
        <g opacity={boyEnter}><PersonRig x={bx} floor={by} frame={f+7} scale={.64} boy seat={boySeat} walk={1-boySeat} gesture={f>355?Math.sin(f*.11)*.15+.15:0} talking={f>356 && f<400}/></g>
      </svg>
      <SpokenWriting/>
    </Gfx>
  </AbsoluteFill>;
};
