import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import {frameSvg} from '../cartoon_projects/aqnd_dialogue18/scene';
import {FONT_TITLE,FONT_QURAN} from './localFonts';
export const AQND18_FRAMES=1071;
// Portrait illustration revision 4: 1080 × 1920 with compact, rounded hands.
export const AqndDialogue18:React.FC=()=>{const t=useCurrentFrame()/30;FONT_TITLE();FONT_QURAN();return <AbsoluteFill style={{backgroundColor:'#f0e5d2'}}><div style={{width:1080,height:1920}} dangerouslySetInnerHTML={{__html:frameSvg(t)}}/><Audio src={staticFile('aqnd_dialogue18/dialogue_nomusic_v1.wav')}/></AbsoluteFill>};
