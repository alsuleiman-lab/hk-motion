import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FONT_TITLE, FONT_TEXT} from './localFonts';
import {Gfx} from './MG';

// Landscape trial: preserve the user's paper treatment and visual hierarchy,
// adapting the spacing to 16:9 rather than scaling the portrait coordinates.
const C={ink:'#242218',white:'#fffdf6',paper:'#beb5a0'};
const T='cov/ibnbaz-source-v2/';
const photoFilter='saturate(.88) drop-shadow(3px 0 0 #fffdf6) drop-shadow(-3px 0 0 #fffdf6) drop-shadow(0 3px 0 #fffdf6) drop-shadow(0 -3px 0 #fffdf6) drop-shadow(0 12px 11px rgba(63,47,17,.19))';

export const IbnBazPaperCoverLandscape:React.FC<{introReveal?:boolean}>=({introReveal=false})=>{
  FONT_TITLE();FONT_TEXT();
  const frame=useCurrentFrame();
  const p=introReveal?interpolate(frame,[16,48],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic)}):0;
  const paper=staticFile('cov/ibnbaz-landscape-v1/aged-newspaper-landscape-v1.png');
  const video=staticFile('cov/ibnbaz-original-source-v1/source.mp4');
  const photoExit=(x:number,y:number,rotation:number)=>introReveal?{transform:`translate3d(${x*p}px,${y*p}px,0) rotate(${rotation*p}deg) scale(${1-.12*p})`,opacity:1-p}:{};
  const textExit=(x:number,y:number,rotation:number)=>introReveal?{transform:`translate3d(${x*p}px,${y*p}px,0) rotate(${rotation*p}deg)`,opacity:1-p}:{};
  const foldAngle=94*p;
  return <AbsoluteFill style={{background:C.paper,overflow:'hidden'}}>
    {introReveal?<>
      <OffthreadVideo src={video} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
      <AbsoluteFill style={{perspective:1700,perspectiveOrigin:'center center',zIndex:1}}>
        <div style={{position:'absolute',left:0,top:0,width:'50%',height:'100%',backgroundImage:`url("${paper}")`,backgroundSize:'1920px 1080px',backgroundPosition:'left center',backgroundRepeat:'no-repeat',transformOrigin:'right center',backfaceVisibility:'hidden',transform:`rotateY(${-foldAngle}deg) translateX(${-150*p}px)`,boxShadow:`${18*p}px 0 ${28*p}px rgba(48,34,17,${.24*p})`}}/>
        <div style={{position:'absolute',left:'50%',top:0,width:'50%',height:'100%',backgroundImage:`url("${paper}")`,backgroundSize:'1920px 1080px',backgroundPosition:'right center',backgroundRepeat:'no-repeat',transformOrigin:'left center',backfaceVisibility:'hidden',transform:`rotateY(${foldAngle}deg) translateX(${150*p}px)`,boxShadow:`${-18*p}px 0 ${28*p}px rgba(48,34,17,${.24*p})`}}/>
      </AbsoluteFill>
    </>:<Img src={paper} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>}
    <Img src={staticFile('cov/ibnbaz-paper-v1/mohammed-ready-v1.png')} style={{position:'absolute',left:1090,top:10,width:1400,filter:photoFilter,zIndex:2,...photoExit(560,-100,12)}}/>
    <Img src={staticFile('cov/ibnbaz-opponent-v6/opponent-cutout-v6.png')} style={{position:'absolute',left:-185,top:175,width:800,filter:photoFilter,zIndex:2,...photoExit(-500,100,-12)}}/>
    <Gfx><AbsoluteFill style={{zIndex:3,pointerEvents:'none'}}>
      <div style={{position:'absolute',left:64,top:45,width:430,height:92,transform:'rotate(-3deg)',...textExit(-420,-170,-10)}}>
        <Img src={staticFile(T+'paper-slip-v2.png')} style={{width:'100%',height:'100%'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Almarai',fontWeight:800,fontSize:44,color:C.ink,direction:'rtl',whiteSpace:'nowrap'}}>صدقاً لا تواضعاً</div>
      </div>
      <div style={{position:'absolute',left:1430,top:878,width:420,height:96,transform:'rotate(-1.5deg)',...textExit(400,180,12)}}>
        <Img src={staticFile(T+'paper-slip-v2.png')} style={{width:'100%',height:'100%'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Almarai',fontSize:40,fontWeight:800,color:C.ink,direction:'rtl',whiteSpace:'nowrap'}}>نقل الإجماع!</div>
      </div>

      <div style={{position:'absolute',left:520,top:480,width:1030,height:590,transform:`translate3d(0,${510*p}px,0) rotate(${10*p}deg) scale(${.84*(1-.22*p)})`,transformOrigin:'top left',opacity:1-p}}>
        <div style={{position:'absolute',left:226,top:5,width:700,height:161,transform:'rotate(-1deg)'}}>
          <Img src={staticFile(T+'brush-yellow-v2.png')} style={{width:'100%',height:'100%'}}/>
          <svg viewBox="0 0 700 161" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}><text x="350" y="105" textAnchor="middle" direction="rtl" fontFamily="Almarai" fontWeight="800" fontSize="75" fill={C.ink}>هل ابن تيمية</text></svg>
        </div>
        <Img src={staticFile(T+'newsprint-strip-v2.png')} style={{position:'absolute',left:0,top:139,width:1030,height:276}}/>
        <Img src={staticFile(T+'crosshatch-v2.png')} style={{position:'absolute',left:-52,top:136,width:1138,height:281}}/>
        <svg viewBox="0 0 1030 276" style={{position:'absolute',left:0,top:139,width:1030,height:276,overflow:'visible'}}><text x="515" y="198" textAnchor="middle" direction="rtl" fontFamily="Almarai" fontWeight="800" fontSize="180" textLength="620" lengthAdjust="spacingAndGlyphs" fill={C.white} style={{paintOrder:'stroke',stroke:'rgba(50,43,25,.25)',strokeWidth:1}}>أعلم</text></svg>
        <div style={{position:'absolute',left:57,top:398,width:940,height:169,transform:'rotate(.4deg)'}}>
          <Img
            src={staticFile(T+'brush-dark-v2.png')}
            style={{
              width: '100%',
              height: '100%',
              scale: 0.881
            }}
          />
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Noto Kufi Arabic',fontWeight:800,fontSize:99,lineHeight:1.3,color:C.white,direction:'rtl'}}>من السلف؟</div>
        </div>
      </div>

      <div style={{position:'absolute',left:60,bottom:42,width:520,height:82,transform:'rotate(-1.2deg)',...textExit(-370,220,-15)}}>
        <Img src={staticFile(T+'brush-dark-v2.png')} style={{width:'100%',height:'100%'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Almarai',fontWeight:800,fontSize:40,color:C.white,direction:'rtl',whiteSpace:'nowrap'}}>محمد بن شمس الدين</div>
      </div>
    </AbsoluteFill></Gfx>
  </AbsoluteFill>;
};
