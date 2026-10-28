import React from 'react';
import {getInputProps, useCurrentFrame} from 'remotion';
import {FONT_TITLE} from '../localFonts';
import {CARTOON_PALETTE as C} from './palette';
import {smooth} from './PalacePaper';

export const CartoonGfx:React.FC<{children:React.ReactNode}> = ({children}) => (getInputProps() as {hideGfx?:boolean}).hideGfx?null:<>{children}</>;

/** A spoken promise, on a piece of paper; it never becomes a paid transfer. */
export const AmountCard:React.FC<{at:number;until:number;amount:string}> = ({at,until,amount}) => {
  const t=useCurrentFrame()/30;
  if(t<at||t>=until)return null;
  const u=smooth((t-at)/.16);
  return <div style={{position:'absolute',left:300,top:228+(1-u)*20,width:480,height:180,background:C.card,color:C.accentDeep,border:`5px solid ${C.gold}`,borderRadius:15,boxShadow:`8px 14px 0 ${C.woodDeep}30`,fontFamily:FONT_TITLE(),fontWeight:800,fontSize:82,lineHeight:'170px',textAlign:'center',transform:'rotate(-2deg)',direction:'rtl'}}>
    <span style={{position:'absolute',left:15,top:15,width:27,height:27,borderRadius:'50%',background:C.mark,border:`4px solid ${C.goldLight}`}}/>{amount}
  </div>;
};

export const CartoonWord:React.FC<{from:number;to:number;children:React.ReactNode;y?:number}> = ({from,to,children,y=1700}) => {
  const t=useCurrentFrame()/30;if(t<from||t>=to)return null;
  return <div style={{position:'absolute',left:'50%',top:y,transform:`translate(-50%,-50%) rotate(-2deg) scale(${.96+.04*smooth((t-from)/.12)})`,padding:'12px 42px 20px',borderRadius:15,background:C.accentDeep,color:C.card,border:`3px solid ${C.goldLight}`,fontFamily:FONT_TITLE(),fontWeight:800,fontSize:72,boxShadow:`7px 10px 0 ${C.woodDeep}30`,direction:'rtl'}}>{children}</div>;
};
