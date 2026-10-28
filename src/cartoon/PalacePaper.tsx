import React from 'react';
import { CARTOON_PALETTE as B } from './palette';

// Analytic paper rig. All coordinates are rooted at the planted feet. No world
// is advanced while drawing, so seeking and out-of-order renders are identical.
export const unit = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => { const u = unit(v); return u * u * (3 - 2 * u); };
export type Point = [number, number];
export type PaperRole = 'king' | 'poet' | 'minister';
export type Pose = 'rest' | 'praise' | 'order' | 'joy' | 'ask' | 'deny' | 'complain' | 'explain' | 'yes';
const line = (p: Point) => p.join(',');
const mix = (a:number,b:number,p:number) => a+(b-a)*p;
const handAngle = (elbow:Point,wrist:Point) => {
  const dx=wrist[0]-elbow[0],dy=wrist[1]-elbow[1];
  return Math.atan2(dx,-dy)*180/Math.PI;
};
export function elbow(a: Point, b: Point, l1 = 99, l2 = 102, bend = 1): Point {
  const dx=b[0]-a[0], dy=b[1]-a[1], d=Math.max(.1, Math.min(Math.hypot(dx,dy),l1+l2-1));
  const h=(l1*l1-l2*l2+d*d)/(2*d), n=Math.sqrt(Math.max(0,l1*l1-h*h));
  const norm=Math.hypot(dx,dy)||1;
  return [a[0]+h*dx/norm-bend*n*dy/norm,a[1]+h*dy/norm+bend*n*dx/norm];
}

export const PaperDefs: React.FC = () => <defs>
  <linearGradient id="cloth" x1="0" x2="1"><stop stopColor={B.poetDark}/><stop offset=".35" stopColor={B.poetLight}/><stop offset="1" stopColor={B.poet}/></linearGradient>
  <linearGradient id="royal" x1="0" x2="1"><stop stopColor={B.kingDark}/><stop offset=".38" stopColor={B.kingLight}/><stop offset="1" stopColor={B.king}/></linearGradient>
  <linearGradient id="minister" x1="0" x2="1"><stop stopColor={B.ministerDark}/><stop offset=".38" stopColor={B.ministerLight}/><stop offset="1" stopColor={B.minister}/></linearGradient>
  <linearGradient id="ivory" x1="0" y1="0" x2="1" y2="1"><stop stopColor={B.card}/><stop offset=".65" stopColor={B.paper}/><stop offset="1" stopColor={B.gray}/></linearGradient>
  <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stopColor={B.skinLight}/><stop offset=".65" stopColor={B.skin}/><stop offset="1" stopColor={B.skinShade}/></linearGradient>
  <linearGradient id="wall" x1="0" y1="0" x2=".6" y2="1"><stop stopColor={B.wallLight}/><stop offset="1" stopColor={B.base}/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stopColor={B.floor}/><stop offset="1" stopColor={B.floorDark}/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop stopColor={B.woodDeep}/><stop offset=".3" stopColor={B.woodLight}/><stop offset="1" stopColor={B.wood}/></linearGradient>
  <pattern id="woven" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0h12M0 6h12M0 0v12M6 0v12" stroke={B.card} strokeWidth=".7" opacity=".09"/></pattern>
  <pattern id="tile" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M48 5L59 30L86 20L76 47L92 59L65 65L59 92L47 76L20 86L30 59L5 48L30 37L20 10L47 20Z" fill="none" stroke={B.accentDeep} strokeWidth="1.4" opacity=".18"/><circle cx="48" cy="48" r="8" fill="none" stroke={B.gold} opacity=".4"/></pattern>
  <pattern id="grain" width="73" height="67" patternUnits="userSpaceOnUse"><path d="M5 11h2m25 13h3m23 29h2m-46 8h1m41-56h2M17 37h2m22 17h1" stroke={B.paper} strokeWidth="1" opacity=".12"/></pattern>
  <filter id="paperShadow" x="-40%" y="-20%" width="180%" height="150%"><feDropShadow dx="5" dy="8" stdDeviation="3" floodColor={B.ink} floodOpacity=".38"/></filter>
  <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>;

const Rosette: React.FC<{x:number;y:number;r?:number}> = ({x,y,r=34}) => <g transform={`translate(${x} ${y})`} stroke={B.light} fill="none" opacity=".48">
  {Array.from({length:8},(_,i)=><path key={i} d={`M0,-${r} Q${r*.7},-${r*.7} 0,0 Q-${r*.7},-${r*.7} 0,-${r}`} transform={`rotate(${i*45})`} strokeWidth="1.6"/>)}<circle r={r*.3} strokeWidth="2"/>
</g>;

const Arch: React.FC<{x:number;y:number;w:number;h:number;window?:boolean}> = ({x,y,w,h,window=false}) => {
  const d=`M${x} ${y+h}V${y+w*.45}Q${x} ${y+w*.15} ${x+w/2} ${y}Q${x+w} ${y+w*.15} ${x+w} ${y+w*.45}V${y+h}Z`;
  return <g><path d={d} fill={window?B.sky:B.wallShade} stroke={B.goldLight} strokeWidth="13"/><path d={d} fill="url(#tile)" stroke={B.accentDeep} strokeWidth="4"/>{window&&<g stroke={B.paper} opacity=".7">{Array.from({length:6},(_,i)=><path key={i} d={`M${x+w*(i+1)/7} ${y+100}V${y+h}`} strokeWidth="6"/>)}{Array.from({length:8},(_,i)=><path key={i} d={`M${x+10} ${y+150+i*80}H${x+w-10}`} strokeWidth="4"/>)}</g>}</g>;
};

export const Throne: React.FC<{x:number;y:number;scale?:number}> = ({x,y,scale=1}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M-190 0V-540Q-190-600-145-610Q-110-650-70-620Q0-705 70-620Q110-650 145-610Q190-600 190-540V0Z" fill={B.gold} stroke={B.wood} strokeWidth="8"/>
  <path d="M-150-150V-530Q-150-570-110-570Q0-650 110-570Q150-570 150-530V-150Z" fill={B.carpet} stroke={B.goldLight} strokeWidth="3"/>
  <path d="M-140-150V-530Q-140-555-105-555Q0-625 105-555Q140-555 140-530V-150Z" fill="url(#tile)"/>
  <Rosette x={0} y={-550} r={37}/><Rosette x={-170} y={-370} r={17}/><Rosette x={170} y={-370} r={17}/>
  <rect x={-225} y={-190} width={450} height={65} rx={20} fill={B.carpet} stroke={B.gold} strokeWidth="5"/>
  {[-1,1].map(s=><g key={s}><path d={`M${s*195} -160V-310Q${s*195}-355 ${s*220}-355Q${s*249}-355 ${s*249}-327V-120`} stroke={B.light} strokeWidth="13" fill="none"/><path d={`M${s*165}-125L${s*187} 32`} stroke={B.navyDeep} strokeWidth="28"/></g>)}
</g>;

export const PalaceSet: React.FC<{kind:'palace'|'office'|'corridor';side?:number}> = ({kind,side=0}) => <>
  <rect width="1080" height="1920" fill="url(#wall)"/>
  <rect x="24" y="35" width="1032" height="1780" rx="38" fill="none" stroke={B.gray} strokeWidth="2" opacity=".4"/>
  <rect width="1080" height="990" fill="url(#tile)" opacity=".38"/>
  <path d="M0 150H1080M0 164H1080M0 1150H1080M0 1168H1080" stroke={B.light} strokeWidth="5" opacity=".55"/>
  {kind==='palace'?<>
    <Arch x={120+side*40} y={205} w={840} h={1060}/>
    <Arch x={235+side*30} y={335} w={610} h={880}/>
    <path d="M-30 0H175V1160L120 1220L60 1150Z" fill={B.curtain} stroke={B.gold} strokeWidth="4"/>
    <path d="M1105 0H915V1160L970 1220L1030 1150Z" fill={B.curtain} stroke={B.gold} strokeWidth="4"/>
    {[-15,45,105,955,1015,1075].map((x,i)=><path key={i} d={`M${x} 45Q${x+40} 500 ${x} 1100`} fill="none" stroke={B.accent} opacity=".6" strokeWidth="5"/>)}
    <Rosette x={540} y={300} r={52}/>
    <rect x="0" y="1100" width="1080" height="200" fill="url(#tile)" opacity=".75"/>
  </>:kind==='office'?<>
    <Arch x={90} y={260} w={345} h={850} window/>
    <g transform="translate(540 300)"><rect width="420" height="760" rx="8" fill="url(#wood)" stroke={B.light} strokeWidth="8"/>{[0,1,2].map(i=><g key={i}><rect x="20" y={36+i*237} width="380" height="197" fill={B.base3}/>{Array.from({length:7},(_,j)=><g key={j} transform={`translate(${36+j*50} ${56+i*237}) rotate(${j%3-1})`}><rect width="34" height={150+j%3*6} rx="3" fill={j%2?B.paper2:B.accent}/><path d="M5 12h24M5 20h24M5 131h24" stroke={j%2?B.accentDeep:B.light} strokeWidth="3"/></g>)}</g>)}</g>
    <Rosette x={210} y={185} r={48}/>
  </>:<>
    <Arch x={95} y={270} w={360} h={1030}/><Arch x={625} y={270} w={360} h={1030}/>
    <path d="M450 0L480 1280M630 0L600 1280" stroke={B.gray} strokeWidth="16"/>
    <path d="M480 1280L0 1850M600 1280L1080 1850" stroke={B.light} strokeWidth="3" opacity=".4"/>
    <Rosette x={540} y={220} r={35}/>
  </>}
  <path d="M0 1270H1080V1920H0Z" fill="url(#floor)"/>
  {Array.from({length:9},(_,i)=><path key={i} d={`M540 1270L${-200+i*190} 1920`} stroke={B.light} opacity=".12" strokeWidth="2"/>)}
  {[1350,1480,1660,1890].map(y=><path key={y} d={`M0 ${y}H1080`} stroke={B.light} opacity=".13" strokeWidth="2"/>)}
  <path d="M340 1270H740L1010 1920H70Z" fill={B.carpet} stroke={B.goldLight} strokeWidth="4"/>
  <path d="M370 1270H710L940 1920H140Z" fill="url(#tile)"/>
  <path d="M0 0H1080V1920H0Z" fill="url(#grain)"/>
</>;

export const LedgerDesk: React.FC<{closed?:number}> = ({closed=0}) => {
  const angle=unit(closed)*Math.PI, edge=110*Math.cos(angle), lift=60*Math.sin(angle);
  return <g transform="translate(0 -190)">
  <path d="M470 1440L1040 1440L1015 1780H510Z" fill="url(#wood)" stroke={B.light} strokeWidth="6"/>
  <path d="M520 1485H980V1690H520Z" fill="url(#tile)"/><Rosette x={750} y={1590} r={64}/>
  <path d="M440 1395H1065V1450H440Z" fill={B.paper2} stroke={B.ink} strokeWidth="5"/>
  <path d="M452 1400H1054" stroke={B.card} strokeWidth="7"/>
  <g transform="translate(765 1395)">
    <path d="M-140-18L-130-100Q-65-120 0-75V-5Q-70-35-140-18Z" fill={B.accentDeep} stroke={B.light} strokeWidth="5"/>
    <path d="M-130-25L-122-95Q-60-112 0-71V-9Q-60-40-130-25Z" fill={B.paper}/>
    <path d={`M0-75Q${edge*.5} ${-120-lift} ${edge} ${-100-lift}L${edge} ${-25-lift}Q${edge*.5} ${-40-lift} 0-5Z`} fill={closed>.5?B.accentDeep:B.paper} stroke={B.light} strokeWidth="4"/>
    <path d="M0-71V-9" stroke={B.gray} strokeWidth="3"/>
    <g stroke={B.gray} opacity=".6">{[0,1,2,3].map(i=><path key={i} d={`M-18 ${-61+i*11}Q-60 ${-85+i*11} -104 ${-75+i*11}`} fill="none" strokeWidth="2"/>)}</g>
  </g>
  <path d="M993 1390l-22-115 19-8 24 123" fill={B.navyDeep} stroke={B.light} strokeWidth="3"/>
</g>;
};

export const OfficeChair:React.FC<{x:number;y:number;scale:number}> = ({x,y,scale}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M-114-100V-470Q-114-514 0-520Q114-514 114-470V-100" fill="url(#wood)" stroke={B.light} strokeWidth="6"/>
  <path d="M-88-155V-455Q0-500 88-455V-155Z" fill={B.navyDeep} stroke={B.gray} strokeWidth="3"/>
  <path d="M-80-155V-450Q0-495 80-450V-155Z" fill="url(#tile)"/>
  <path d="M-130-141H130M-92-120L-110 23M92-120L110 23" fill="none" stroke={B.gray} strokeWidth="16"/>
</g>;

const Hand: React.FC<{at:Point;angle?:number;open?:boolean}> = ({at,angle=0,open=true}) => <g transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}>
  <path d={open?'M-12 8Q-19 1-18-8L-16-27Q-14-31-11-25L-9-13L-7-33Q-4-37-1-32L0-13L3-34Q7-37 9-31L8-12L13-25Q17-29 19-23L17-8Q28-16 30-10Q28-4 19 6L11 19L-7 20Z':'M-13 10L-18-8Q-17-24-4-22L13-20Q24-16 20-3L15 15Z'} fill="url(#skin)" stroke={B.ink} strokeWidth="2.2" strokeLinejoin="round"/>
  <path d="M-5 8Q2-2 12-4" fill="none" stroke={B.gray} strokeWidth="1.4" opacity=".55"/>
</g>;

/** The contacting palm is painted in front of a held foreground prop. */
export const ContactPalm:React.FC<{x:number;y:number;scale:number;at:Point;flip?:boolean}> = ({x,y,scale,at,flip=true}) => <g transform={`translate(${x} ${y}) scale(${flip?-scale:scale} ${scale})`}><Hand at={at} angle={35}/></g>;

const Sleeve: React.FC<{a:Point;b:Point;c:Point;fill:string;near?:boolean}> = ({a,b,c,fill,near=false}) => {
  const dx=c[0]-b[0],dy=c[1]-b[1],len=Math.hypot(dx,dy)||1;
  const nx=-dy/len*23,ny=dx/len*23;
  return <g strokeLinejoin="round">
    <path d={`M${line(a)}L${line(b)}L${line(c)}`} fill="none" stroke={B.ink} strokeWidth={near?64:59} strokeLinecap="round"/>
    <path d={`M${line(a)}L${line(b)}L${line(c)}`} fill="none" stroke={fill} strokeWidth={near?59:54} strokeLinecap="round"/>
    <path d={`M${a[0]-9},${a[1]+1}L${b[0]-9},${b[1]-4}L${c[0]-9},${c[1]-5}`} fill="none" stroke={B.paper} strokeWidth="5" opacity=".18" strokeLinecap="round"/>
    <path d={`M${c[0]-nx*.72},${c[1]-ny*.72}L${c[0]+nx*.72},${c[1]+ny*.72}`} stroke={B.woodDeep} strokeWidth="6" opacity=".82" strokeLinecap="round"/>
  </g>;
};

export const PaperActor: React.FC<{
  role:PaperRole;x:number;y:number;scale?:number;flip?:boolean;pose?:Pose;
  speech?:number;progress?:number;walk?:number;stride?:number;seated?:boolean;scroll?:boolean;scrollOpen?:number;leftHand?:Point;rightHand?:Point;headTilt?:number;
}> = ({role,x,y,scale=1,flip=false,pose='rest',speech=0,progress=1,walk=0,stride=0,seated=false,scroll=false,scrollOpen=1,leftHand,rightHand,headTilt=0}) => {
  const king=role==='king', minister=role==='minister';
  const cloth=king?'url(#royal)':minister?'url(#minister)':'url(#cloth)';
  const p=smooth(progress), accent=unit(speech);
  const lift=pose==='joy'?-5*Math.sin(Math.PI*unit(progress)):0;
  const lean=pose==='complain'?-4*p:pose==='explain'?-2*p:pose==='praise'?-6*p:pose==='order'?4*p:0;
  const restR:Point=[112,-235],restL:Point=[-112,-235];
  let endR:Point=restR,endL:Point=restL;
  if(pose==='order')endR=[178,-337];
  if(pose==='praise'){endR=[140,-365];endL=[-105,-315];}
  if(pose==='joy'){endR=[126,-258];endL=[-158,-309];}
  if(pose==='ask'){endR=[166,-310];endL=[-116,-237];}
  if(pose==='deny'){endR=[174,-354];endL=[-113,-244];}
  if(pose==='complain'){endR=[165,-320];endL=[-132,-293];}
  if(pose==='explain'){endR=[155,-330];endL=[-132,-300];}
  if(pose==='yes'){endR=[123,-252];endL=restL;}
  let right:Point=[mix(restR[0],endR[0],p)+4*accent,mix(restR[1],endR[1],p)-4*accent];
  let left:Point=[mix(restL[0],endL[0],p),mix(restL[1],endL[1],p)];
  if(leftHand)left=leftHand;
  if(rightHand)right=rightHand;
  const a:Point=[76,-438], la:Point=[-75,-431];
  // Keep the elbow branch fixed while the speaker's hand pulses.
  const er=elbow(a,right,104,112,-1);
  const el=elbow(la,left,104,112,1);
  const turn=flip?-1:1;
  // During stance, world X = root travel + local foot X is constant.
  // A cycle covers 134 world pixels, matching the caller's walk = travel/134.
  const walkingFoot=(offset:number,base:number):Point=>{
    if(!stride)return [base,0];
    const phase=((walk+offset)%1+1)%1, cycle=134/scale;
    return [base+(phase<.5?.25-phase:phase-.75)*cycle,
      phase<.5?0:-Math.sin(Math.PI*(phase-.5)*2)*Math.min(31,stride)];
  };
  const footR=walkingFoot(0,43), footL=walkingFoot(.5,-43);
  const leg=(at:Point,near:boolean)=> <g key={near?'r':'l'}>
    <path d={seated?`M${near?28:-28} -176Q${near?93:-93} -186 ${near?65:-65} -99L${line(at)}`:`M${near?35:-35} -178Q${at[0]*.7} -76 ${line(at)}`} stroke={B.ink} strokeWidth="43" fill="none" strokeLinecap="round"/>
    <path d={seated?`M${near?28:-28} -176Q${near?93:-93} -186 ${near?65:-65} -99L${line(at)}`:`M${near?35:-35} -178Q${at[0]*.7} -76 ${line(at)}`} stroke={B.paper2} strokeWidth="35" fill="none" strokeLinecap="round"/>
    <path d={`M${at[0]-24} ${at[1]-13}Q${at[0]+2} ${at[1]-25} ${at[0]+27} ${at[1]-7}L${at[0]+49} ${at[1]+1}Q${at[0]+56} ${at[1]+14} ${at[0]+25} ${at[1]+14}H${at[0]-25}Z`} fill={B.ink} stroke={B.gray} strokeWidth="2"/>
  </g>;
  const nod=pose==='yes'?9*Math.sin(Math.PI*unit(progress*1.6)):pose==='joy'?-6:pose==='deny'?3:0;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="14" rx="143" ry="20" fill={B.ink} opacity=".3" filter="url(#softShadow)"/>
    <g transform={`scale(${turn} 1) translate(0 ${lift})`} filter="url(#paperShadow)">
      {leg(footL,false)}{leg(footR,true)}
      <g transform={`rotate(${lean} 0 -185)`}>
      <Sleeve a={la} b={el} c={left} fill={cloth}/><Hand at={left} angle={handAngle(el,left)}/>
      <path d={seated?'M-65-460Q-108-442-112-340L-129-178Q-98-80 5-108Q94-80 132-160L105-351Q105-440 65-460Z':'M-65-460Q-108-442-112-340L-137-55Q-63-12 0-36Q70-14 137-55L106-351Q105-440 65-460Z'} fill={cloth} stroke={B.ink} strokeWidth="4"/>
      <path d={seated?'M-65-460Q-108-442-112-340L-129-178Q-98-80 5-108Q94-80 132-160L105-351Q105-440 65-460Z':'M-65-460Q-108-442-112-340L-137-55Q-63-12 0-36Q70-14 137-55L106-351Q105-440 65-460Z'} fill="url(#woven)"/>
      <path d="M-57-448Q-77-279-70-83M-20-416Q-49-245-28-55M29-408Q17-254 46-61M66-428Q61-261 94-79" stroke={B.ink} opacity=".26" strokeWidth="5" fill="none"/>
      <path d="M-50-452Q-68-327-42-179M46-437Q23-315 59-200" stroke={B.light} opacity=".2" strokeWidth="7" fill="none"/>
      <path d="M-73-453L-30-334L-17-89M67-453L26-339L15-83" stroke={B.light} strokeWidth={king?10:5} fill="none" opacity={king?.8:.45}/>
      {king&&<g fill="none" stroke={B.light} strokeWidth="2" opacity=".6">{[-1,1].map(s=><path key={s} d={`M${s*44}-355q${s*18}22 0 40t0 40t0 40t0 40t0 40t0 40`}/>)}</g>}
      <path d="M-99-252Q-5-235 104-252L105-226Q5-209-102-225Z" fill={B.ink} stroke={B.gray} strokeWidth="2"/>
      <path d="M-17-248H18V-219H-17Z" fill={B.light} stroke={B.ink} strokeWidth="3"/>
      <Sleeve a={a} b={er} c={right} fill={cloth} near/><Hand at={right} angle={handAngle(er,right)} open={!scroll}/>
      {scroll&&<g transform={`translate(${right[0]-69} ${right[1]+7})`}>
        <path d={`M${55-133*smooth(scrollOpen)}-53Q0-71 69-49V30Q0 5 ${55-133*smooth(scrollOpen)} 23Z`} fill={B.paper} stroke={B.ink} strokeWidth="3"/>
        <path d={`M${55-133*smooth(scrollOpen)}-55v80M69-51v84`} stroke={B.light} strokeWidth="14" strokeLinecap="round"/>
        {scrollOpen>.7&&<path d="M-55-32H45M-55-18H45M-55-4H20" stroke={B.gray} strokeWidth="2" opacity=".5"/>}
      </g>}
      <g transform={`rotate(${nod+headTilt} 0 -499)`}>
        <path d="M-35-470V-508H35V-470L0-450Z" fill="url(#skin)" stroke={B.ink} strokeWidth="3"/>
        <path d="M-65-579Q-78-542-57-508Q-28-473 10-489Q64-500 68-552Q74-598 29-615Q-28-632-65-579Z" fill="url(#skin)" stroke={B.ink} strokeWidth="3"/>
        <path d="M-65-551Q-70-509-37-468Q-12-430 4-421Q36-450 54-482Q79-523 66-553Q36-530 4-539Q-35-533-65-551Z" fill={B.ink} stroke={B.navyDeep} strokeWidth="3"/>
        <path d="M-46-522Q-39-477-12-455M-19-517Q-20-477 4-444M18-518Q24-480 13-454M45-525Q49-498 29-469" fill="none" stroke={B.gray} opacity=".32" strokeWidth="2"/>
        <path d="M-79-564Q-91-591-68-615Q-51-656 4-651Q62-657 81-614Q94-578 72-563Q3-574-79-564Z" fill="url(#ivory)" stroke={B.ink} strokeWidth="3"/>
        <path d="M-72-605Q0-578 77-604M-71-616Q-1-600 67-625M-46-636Q0-612 42-641M-78-578Q0-589 77-575" fill="none" stroke={B.gray} strokeWidth="4"/>
        {king&&<><path d="M-65-587L-66-610L-38-598L-14-618L9-600L37-619L52-601L72-610L64-585Z" fill={B.accentDeep} stroke={B.light} strokeWidth="3"/><path d="M-2-609L11-592L-2-575L-15-592Z" fill={B.paper} stroke={B.ink} strokeWidth="2"/></>}
        {minister&&<path d="M-70-585Q-4-574 69-586" stroke={B.accentDeep} strokeWidth="13" fill="none"/>}
      </g>
      </g>
    </g>
  </g>;
};
