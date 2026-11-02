import React from 'react';
import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';
import {frameSvg,sourceTimeAtOutputTime} from '../cartoon_projects/aqnd_dialogue18/scene';
import timing from '../cartoon_projects/aqnd_dialogue18/timing.json';
import {FONT_TITLE,FONT_QURAN} from './localFonts';
export const AQND18_FRAMES=Math.ceil(timing.duration*timing.fps);
// Portrait illustration revision 8: keep scene cards filled with the active phrase.
export const AqndDialogue18:React.FC=()=>{const t=useCurrentFrame()/30;FONT_TITLE();FONT_QURAN();return <AbsoluteFill style={{backgroundColor:'#f0e5d2'}}><div style={{width:1080,height:1920}} dangerouslySetInnerHTML={{__html:frameSvg(sourceTimeAtOutputTime(t))}}/><Audio src={staticFile('aqnd_dialogue18/dialogue_nomusic_cut_v3.wav')}/></AbsoluteFill>};
