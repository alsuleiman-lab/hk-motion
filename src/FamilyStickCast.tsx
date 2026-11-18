import React from 'react';
import {AbsoluteFill,getInputProps,useCurrentFrame,useVideoConfig, getRemotionEnvironment } from 'remotion';
import {cast,characterMarkup,palette,type Motion,type Expression} from '../cartoon_projects/family_stick/rig';
const Gfx:React.FC<{children:React.ReactNode}>=({children})=>((getRemotionEnvironment().isPlayer ? {} : getInputProps()) as {hideGfx?:boolean}).hideGfx?null:<>{children}</>;
export const FamilyStickCast:React.FC<{motion?:Motion;expression?:Expression}>=({motion,expression})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 const moves:Motion[]=['wave','explain','point','wave','wave','listen','idle'];
 return <AbsoluteFill style={{background:palette.paper}}><Gfx><svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><pattern id="familydots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#ddd4c4"/></pattern></defs><rect width="1080" height="1920" fill="url(#familydots)"/>{cast.map((c,i)=><g key={c.id} transform={`translate(${180+(i%3)*360} ${560+Math.floor(i/3)*600}) scale(.9)`}><ellipse cy="7" rx="84" ry="8" fill="#d7dfdc"/><g dangerouslySetInnerHTML={{__html:characterMarkup(c,t,motion??moves[i],{expression})}}/></g>)}</svg></Gfx></AbsoluteFill>;
};
