import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {FONT_TITLE, FONT_TEXT} from './localFonts';
import {Gfx} from './MG';

// Reference title treatment over aged newspaper; the second photograph is the actual respondent from the recording.
const C={ink:'#242218',white:'#fffdf6',yellow:'#beb5a0'};
const P='cov/ibnbaz-paper-v1/';
const T='cov/ibnbaz-source-v2/';
const photoFilter='saturate(.88) drop-shadow(3px 0 0 #fffdf6) drop-shadow(-3px 0 0 #fffdf6) drop-shadow(0 3px 0 #fffdf6) drop-shadow(0 -3px 0 #fffdf6) drop-shadow(0 12px 11px rgba(63,47,17,.19))';

const Slip:React.FC<{left:number;top:number;width:number;text:string;rot:number;size?:number}>=({left,top,width,text,rot,size=36})=><div style={{position:'absolute',left,top,width,height:92,transform:`rotate(${rot}deg)`}}>
  <Img src={staticFile(T+'paper-slip-v2.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Almarai',fontWeight:800,fontSize:size,color:C.ink,direction:'rtl',whiteSpace:'nowrap'}}>{text}</div>
</div>;

export const IbnBazPaperCover:React.FC=()=>{
  FONT_TITLE();FONT_TEXT();
  return <AbsoluteFill style={{background:C.yellow,overflow:'hidden'}}>
    <Img src={staticFile('cov/ibnbaz-source-v5/aged-newspaper-background-v5.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
    {/* The two real photographs remain the clean face-check reference layer. */}
    <Img
      src={staticFile(P+'mohammed-ready-v1.png')}
      style={{
        position: 'absolute',
        left: 335,
        top: 245,
        width: 1080,
        filter: photoFilter,
        scale: 1.073
      }}
    />
    <Img
      src={staticFile('cov/ibnbaz-opponent-v6/opponent-cutout-v6.png')}
      style={{
        position: 'absolute',
        left: -95,
        top: 370,
        width: 820,
        filter: photoFilter,
        translate: '-7.6px 66.7px',
        scale: 1.09
      }}
    />
    <Gfx>
      {/* Peripheral title scraps echo the reference collage; all wording belongs to this video's subject. */}
      <Slip left={54} top={48} width={374} text="صدقاً لا تواضعاً" rot={-3} size={40}/>
      <div style={{position:'absolute',left:568,top:100,width:454,height:111,transform:'rotate(1deg)'}}>
        <Img src={staticFile(T+'brush-dark-v2.png')} style={{width:'100%',height:'100%'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Almarai',fontSize:46,fontWeight:800,color:C.white,direction:'rtl'}}>نقل الإجماع!</div>
      </div>

      {/* Identical three-tier hierarchy to PAPER / TEXT / BRUSH TITLES in the source opening. */}
      <div style={{position:'absolute',left:25,top:1160,width:1030,height:590}}>
        <div style={{position:'absolute',left:226,top:5,width:700,height:161,transform:'rotate(-1deg)'}}>
          <Img src={staticFile(T+'brush-yellow-v2.png')} style={{width:'100%',height:'100%'}}/>
          <svg viewBox="0 0 700 161" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}><text x="350" y="105" textAnchor="middle" direction="rtl" fontFamily="Almarai" fontWeight="800" fontSize="75" fill={C.ink}>هل ابن تيمية</text></svg>
        </div>
        <Img src={staticFile(T+'newsprint-strip-v2.png')} style={{position:'absolute',left:0,top:139,width:1030,height:276}}/>
        <Img src={staticFile(T+'crosshatch-v2.png')} style={{position:'absolute',left:-52,top:136,width:1138,height:281}}/>
        <svg viewBox="0 0 1030 276" style={{position:'absolute',left:0,top:139,width:1030,height:276,overflow:'visible'}}><text x="515" y="198" textAnchor="middle" direction="rtl" fontFamily="Almarai" fontWeight="800" fontSize="180" textLength="620" lengthAdjust="spacingAndGlyphs" fill={C.white} style={{paintOrder:'stroke',stroke:'rgba(50,43,25,.25)',strokeWidth:1}}>أعلم</text></svg>
        <div style={{position:'absolute',left:57,top:398,width:940,height:169,transform:'rotate(.4deg)'}}>
          <Img src={staticFile(T+'brush-dark-v2.png')} style={{width:'100%',height:'100%'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Noto Kufi Arabic',fontWeight:800,fontSize:99,lineHeight:1.3,color:C.white,direction:'rtl'}}>من السلف؟</div>
        </div>
      </div>

      <div style={{position:'absolute',left:67,bottom:51,width:540,height:82,transform:'rotate(-1.2deg)'}}>
        <Img src={staticFile(T+'brush-dark-v2.png')} style={{width:'100%',height:'100%'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Almarai',fontWeight:800,fontSize:40,color:C.white,direction:'rtl',whiteSpace:'nowrap'}}>محمد بن شمس الدين</div>
      </div>
    </Gfx>
  </AbsoluteFill>;
};
