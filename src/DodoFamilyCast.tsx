import React from 'react';
import {AbsoluteFill,getInputProps,useCurrentFrame,useVideoConfig} from 'remotion';
import {cast,characterMarkup,palette,type Motion,type Expression} from '../cartoon_projects/dodo_family/rig';
const Gfx:React.FC<{children:React.ReactNode}>=({children})=>(getInputProps() as {hideGfx?:boolean}).hideGfx?null:<>{children}</>;
export const DodoFamilyCast:React.FC<{motion?:Motion;expression?:Expression}>=({motion,expression})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps,moves:Motion[]=['wave','explain','point','wave','wave','listen','idle'];
 return <AbsoluteFill style={{background:palette.paper}}><Gfx><svg width="1080" height="1920" viewBox="0 0 1080 1920"><defs><pattern id="dodo-paper" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#ded5c5"/></pattern></defs><rect width="1080" height="1920" fill="url(#dodo-paper)"/>{cast.map((c,i)=><g key={c.id} transform={`translate(${180+(i%3)*360} ${560+Math.floor(i/3)*600}) scale(.86)`}><ellipse cy="7" rx="84" ry="8" fill="#d5dedc"/><g dangerouslySetInnerHTML={{__html:characterMarkup(c,t,motion??moves[i],{expression})}}/></g>)}</svg></Gfx></AbsoluteFill>;
};
