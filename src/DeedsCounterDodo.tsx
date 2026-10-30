import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {cast, characterMarkup, palette, speechAt, type Motion, type Expression, type SpeechInterval} from '../cartoon_projects/dodo_family/rig';
import captions from '../data/cartoon/aqmv_dodo1030_captions.json';
import {FONT_TEXT, FONT_TITLE} from './localFonts';

export const DEEDS_FRAMES = 507;
const fps = 30;
const friend = {...cast[0], name:'الصديق', cloth:'#efe4d1'};
const bilal = {...cast[1], name:'بلال', cloth:'#56806a'};
const sleeper = {...cast[1], name:'النائم', cloth:'#d6bd92'};
type Role = 'friend'|'bilal'|'sleeper';
const wordCues = captions as {startMs:number;endMs:number;text:string;pageBreakAfter?:boolean}[];
const speech:Record<Role,SpeechInterval[]> = {
  friend:[{from:0,to:2.1},{from:3.82,to:6.28},{from:11.92,to:12.56},{from:13.78,to:15.32},{from:15.567,to:16.58}],
  bilal:[{from:2.1,to:3.82},{from:6.28,to:11.92},{from:12.56,to:13.78}],
  sleeper:[],
};
const captionsPages = wordCues.reduce<{words:typeof wordCues;start:number;end:number}[]>((pages,w)=>{
  let p=pages[pages.length-1];
  if(!p){p={words:[],start:w.startMs/1000,end:w.endMs/1000};pages.push(p);}
  p.words.push(w);p.end=w.endMs/1000;
  if(w.pageBreakAfter)pages.push({words:[],start:w.endMs/1000,end:w.endMs/1000});
  return pages;
},[]).filter(p=>p.words.length);
const smoothStep=(value:number)=>{const u=Math.max(0,Math.min(1,value));return u*u*(3-2*u);};

const CounterCard:React.FC<{x:number;y:number;scale?:number;name:string;good:number;bad:number;accent:string;frame:number}> = ({x,y,scale=1,name,good,bad,accent,frame})=>{
  const pop=Math.max(0,1-(frame%90)/18);
  return <g transform={`translate(${x} ${y}) scale(${scale})`} style={{filter:'drop-shadow(0 9px 7px rgba(64,52,39,.15))'}}>
    <rect x="-185" y="-12" width="370" height="168" rx="34" fill="#fffdf8" stroke="#302920" strokeWidth="6"/>
    <rect x="-177" y="-4" width="354" height="48" rx="24" fill={accent} opacity=".22"/>
    <text x="0" y="29" textAnchor="middle" direction="rtl" fontSize="31" fontWeight="800" fill="#302920">{name}</text>
    <circle cx="-126" cy="87" r="16" fill="#39815b"/><path d="M-134 87l6 7 13-16" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="-60" y="97" textAnchor="middle" direction="rtl" fontSize="27" fontWeight="700" fill="#27332b">حسنات</text>
    <text x="138" y="99" textAnchor="end" fontSize="38" fontWeight="900" fill="#256e47">{good}</text>
    <circle cx="-126" cy="132" r="16" fill="#b94e46"/><path d="M-132 126l12 12m0-12l-12 12" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
    <text x="-60" y="142" textAnchor="middle" direction="rtl" fontSize="27" fontWeight="700" fill="#392d2b">سيئات</text>
    <text x="138" y="144" textAnchor="end" fontSize="38" fontWeight="900" fill="#a83e38" transform={`translate(0 ${pop*3})`}>{bad}</text>
  </g>;
};

const DodoActor:React.FC<{role:Role;frame:number;scale:number}> = ({role,frame,scale})=>{
  const t=frame/fps, actor=role==='friend'?friend:role==='bilal'?bilal:sleeper;
  const interval=speech[role].find(s=>t>=s.from&&t<s.to);
  const local=interval? t-interval.from:0;
  const isSleeper=role==='sleeper';
  const sleeping=isSleeper;
  const questions=role==='bilal'&&t>=7.02&&t<9.7;
  const challenges=role==='friend'&&t>=15.57;
  const expression:Expression=isSleeper||sleeping?'smile':questions?'surprised':challenges?'curious':(role==='bilal'&&t>=3.82&&t<6.28?'angry':'smile');
  const motion:Motion=isSleeper?'idle':'sit';
  const mouthOpen=interval?speechAt(local,[{from:0,to:interval.to-interval.from}]).mouthOpen:undefined;
  const pose=characterMarkup(actor,t,motion,{expression,mouthOpen:interval?mouthOpen:undefined,speech:interval?[{from:0,to:interval.to-interval.from}]:[],openHands:questions,idPrefix:`deeds-${role}`});
  const x=role==='friend'?190:role==='bilal'?460:1000;
  const y=isSleeper?1230:1500;
  const s=isSleeper?scale*.68:scale;
  return <g transform={`translate(${x} ${y}) ${isSleeper?'rotate(-90) ':''}scale(${s})`}>
    <ellipse cy="6" rx="101" ry="14" fill="#9daea8" opacity=".55"/>
    <g dangerouslySetInnerHTML={{__html:pose}}/>
    {sleeping&&<g>
      <path d="M-68 -185 Q0 -211 68 -185 L76 -29 Q0 -16 -76 -29Z" fill="#ddc8a2" stroke="#665b4d" strokeWidth="6"/>
      <circle cx="-17" cy="-287" r="7" fill={palette.skin}/><circle cx="2" cy="-293" r="7" fill={palette.skin}/>
      <path d="M-26 -287q9 7 18 0 M-7 -293q9 7 18 0" fill="none" stroke={palette.ink} strokeWidth="4" strokeLinecap="round"/>
      <path d="M74 -337q36 -28 72 0q-36 24 -72 0Z" fill="#fffaf1" stroke="#665b4d" strokeWidth="4"/>
      <text x="101" y="-329" textAnchor="middle" fontSize="20" fontWeight="800" fill="#56806a">Z</text>
    </g>}
  </g>;
};

export const DeedsCounterDodo:React.FC=()=>{
  FONT_TITLE();
  FONT_TEXT();
  const frame=useCurrentFrame(),t=frame/fps;
  const mosque=t>=2.1&&t<3.82;
  const base=2_000_000;
  const bilalGood=base+frame;
  const bilalSin=base-frame;
  const friendGood=base-Math.max(0,frame-Math.round(3.82*fps));
  const friendSin=base;
  const currentPage=captionsPages.find(p=>t>=p.start&&t<p.end+0.02);
  const focusSpans:[number,number,number][]=[[3.82,6.28,190],[6.28,11.92,460],[13.78,16.58,190]];
  let focus=0,focusX=190;
  for(const [from,to,x] of focusSpans){const amount=smoothStep((t-from)/.38)*(1-smoothStep((t-(to-.38))/.38));if(amount>focus){focus=amount;focusX=x;}}
  const zoom=1+.15*focus,tx=focus*(540-zoom*focusX),ty=focus*(960-zoom*1280);
  return <AbsoluteFill style={{background:palette.paper,fontFamily:'Almarai, sans-serif'}}>
    <Audio src={staticFile('aqmv_dodo1030/audio_v1.wav')}/>
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
      <defs>
        <pattern id="deeds-paper" width="56" height="56" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.2" fill="#bda985" opacity=".2"/><path d="M0 55.5H56" stroke="#fffdf8" strokeOpacity=".24"/></pattern>
        <linearGradient id="room-wall" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ece6d9"/><stop offset=".72" stopColor="#ded3bf"/><stop offset="1" stopColor="#c7b89c"/></linearGradient>
        <linearGradient id="couch-fabric" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5d7770"/><stop offset="1" stopColor="#3d5c56"/></linearGradient>
        <linearGradient id="sofa-sleeper" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#967b5b"/><stop offset="1" stopColor="#715a42"/></linearGradient>
        <linearGradient id="floor-wood" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c9ab81"/><stop offset="1" stopColor="#a7835d"/></linearGradient>
        <radialGradient id="warm-light"><stop stopColor="#fff5d9" stopOpacity=".9"/><stop offset="1" stopColor="#fff5d9" stopOpacity="0"/></radialGradient>
      </defs>
      <g transform={`translate(${tx} ${ty}) scale(${zoom})`}>
      <rect x="-500" y="-500" width="2080" height="3000" fill="url(#room-wall)"/><rect x="-500" y="-500" width="2080" height="3000" fill="url(#deeds-paper)"/>
      <ellipse cx="245" cy="520" rx="390" ry="420" fill="url(#warm-light)" opacity=".7"/>
      <path d="M0 1040H1080" stroke="#bcae96" strokeWidth="9"/>
      <path d="M0 1050H1080" stroke="#fff9ed" strokeWidth="4" opacity=".65"/>
      {/* Framed wall art and a warm side lamp give the room depth without distracting from the conversation. */}
      <g filter="drop-shadow(0 11px 12px rgba(51,43,32,.18))">
        <rect x="65" y="366" width="226" height="340" rx="16" fill="#654d39"/>
        <rect x="79" y="380" width="198" height="312" rx="7" fill="#efe3cd"/>
        <path d="M103 642Q165 563 248 601M124 642Q130 528 179 447M178 578Q211 507 251 486" fill="none" stroke="#65816c" strokeWidth="9" strokeLinecap="round"/>
        <ellipse cx="177" cy="450" rx="32" ry="14" transform="rotate(-32 177 450)" fill="#9ab192"/>
        <ellipse cx="228" cy="512" rx="31" ry="14" transform="rotate(26 228 512)" fill="#9ab192"/>
        <ellipse cx="133" cy="557" rx="30" ry="13" transform="rotate(31 133 557)" fill="#9ab192"/>
        <rect x="748" y="376" width="245" height="310" rx="9" fill="#8b684a"/>
        <rect x="766" y="394" width="209" height="274" fill="#d8c6a7"/>
        <path d="M776 452H965M776 524H965M776 596H965" stroke="#806343" strokeWidth="11"/>
        <path d="M798 438V411Q819 391 842 414V438M859 438V401Q883 380 908 407V438M924 438V411Q944 393 961 414V438" fill="#688078" stroke="#4b635c" strokeWidth="4"/>
        <path d="M791 510V474Q815 450 840 477V510M857 510V465Q881 443 906 469V510M923 510V480Q943 460 960 483V510" fill="#a77d50" stroke="#72563c" strokeWidth="4"/>
        <path d="M796 582V547Q820 523 842 550V582M859 582V542Q883 520 907 548V582M925 582V551Q944 531 962 555V582" fill="#6e7f95" stroke="#4c5c70" strokeWidth="4"/>
      </g>
      <g>
        <path d="M662 656H717L704 705H674Z" fill="#c99e62" stroke="#806343" strokeWidth="5"/>
        <path d="M655 657Q690 596 725 657Z" fill="#f0d4a0" stroke="#806343" strokeWidth="5"/>
        <ellipse cx="690" cy="716" rx="57" ry="14" fill="#785c40"/>
        <rect x="86" y="1178" width="88" height="232" rx="24" fill="#937556"/>
        <path d="M130 1192Q90 1103 136 1038Q182 1110 130 1192Z" fill="#55775e"/><path d="M132 1160Q190 1118 208 1051Q221 1140 132 1160Z" fill="#70906e"/>
      </g>
      <path d="M-520 1505 Q540 1360 1600 1505 L1600 2920H-520Z" fill="url(#floor-wood)"/>
      <g opacity=".25" stroke="#6f5138" strokeWidth="3"><path d="M-520 1570H1600M-520 1665H1600M-520 1760H1600M-520 1855H1600M-520 1950H1600M-520 2045H1600M-520 2140H1600"/><path d="M260 1505V2920M760 1505V2920"/></g>
      <path d="M72 1485Q340 1370 642 1475L670 1644Q380 1741 86 1638Z" fill="#b5a58b" opacity=".75"/>
      <path d="M112 1503Q355 1413 604 1494L626 1617Q371 1690 129 1618Z" fill="#7f9184" opacity=".75"/>
      {/* Main two-seat sofa: back cushions, piping, and wooden feet. */}
      <g filter="drop-shadow(0 15px 14px rgba(46,37,26,.18))">
        <path d="M70 1332Q70 1284 124 1284H590Q642 1284 642 1332V1518H70Z" fill="url(#couch-fabric)" stroke="#354e49" strokeWidth="10"/>
        <path d="M107 1310Q107 1298 132 1298H330V1412H108Z" fill="#718b81" stroke="#a4b5a8" strokeWidth="5"/>
        <path d="M344 1298H580Q606 1298 606 1322V1412H344Z" fill="#718b81" stroke="#a4b5a8" strokeWidth="5"/>
        <rect x="83" y="1399" width="545" height="94" rx="27" fill="#a0b1a3" stroke="#354e49" strokeWidth="7"/>
        <path d="M356 1405V1486" stroke="#71877d" strokeWidth="5"/>
        <path d="M97 1515L108 1550M611 1515L602 1550" stroke="#5d4630" strokeWidth="13" strokeLinecap="round"/>
      </g>
      {/* Separate sofa for the sleeping adult. */}
      <g filter="drop-shadow(0 12px 12px rgba(46,37,26,.17))">
        <path d="M672 1168Q672 1127 718 1127H1044Q1070 1127 1070 1165V1374H672Z" fill="url(#sofa-sleeper)" stroke="#5d4935" strokeWidth="9"/>
        <path d="M692 1180H1050V1271H692Z" fill="#aa8d68" stroke="#c3a981" strokeWidth="5"/>
        <path d="M684 1285H1057V1357Q1057 1372 1040 1372H704Q684 1372 684 1352Z" fill="#d7bd94" stroke="#7b6043" strokeWidth="6"/>
        <rect x="731" y="1126" width="190" height="90" rx="40" fill="#fffaf1" stroke="#c8b28e" strokeWidth="6"/>
        <path d="M714 1373L724 1410M1030 1373L1018 1410" stroke="#5d4630" strokeWidth="13" strokeLinecap="round"/>
      </g>
      {/* Coffee table and tea tray anchor the foreground. */}
      <g filter="drop-shadow(0 10px 8px rgba(46,37,26,.16))">
        <path d="M315 1702L330 1805M747 1702L731 1805" stroke="#684d32" strokeWidth="15"/>
        <rect x="272" y="1662" width="515" height="48" rx="18" fill="#8e6843" stroke="#60472f" strokeWidth="7"/>
        <ellipse cx="526" cy="1673" rx="135" ry="15" fill="#d4bd91" stroke="#776044" strokeWidth="5"/>
        <path d="M472 1665V1645Q472 1629 490 1629H505V1665M525 1665V1645Q525 1629 543 1629H558V1665" fill="#f4eee1" stroke="#68533d" strokeWidth="5"/>
      </g>
      {mosque&&<g>
        <ellipse cx="540" cy="700" rx="238" ry="180" fill="#fffdf8" stroke="#806343" strokeWidth="8"/>
        <circle cx="374" cy="850" r="17" fill="#fffdf8" stroke="#806343" strokeWidth="6"/>
        <circle cx="344" cy="875" r="9" fill="#fffdf8" stroke="#806343" strokeWidth="5"/>
        <g transform="translate(540 700) scale(.48) translate(-540 -830)">
        <path d="M320 1110V865Q320 735 540 735Q760 735 760 865V1110Z" fill="#e4d4b7" stroke="#76634c" strokeWidth="10"/>
        <path d="M275 800Q540 540 805 800" fill="#88a695" stroke="#435d50" strokeWidth="12"/>
        <path d="M480 1110V960Q480 885 540 885Q600 885 600 960V1110" fill="#8a7660" stroke="#5b4c3c" strokeWidth="8"/>
        <rect x="440" y="1090" width="200" height="18" rx="9" fill="#9c7951"/>
        <rect x="463" y="1020" width="66" height="55" rx="8" fill="#dcc99d" stroke="#5e5345" strokeWidth="6"/>
        <path d="M496 1020V1075" stroke="#5e5345" strokeWidth="5"/>
        {t<3.3&&(()=>{const u=Math.max(0,Math.min(1,(t-2.35)/.78)),x=890+(526-890)*u,y=1245+(1070-1245)*u;return <g transform={`translate(${x} ${y}) rotate(${-12+12*u})`}><rect x="-42" y="-28" width="84" height="56" rx="7" fill="#d8c69e" stroke="#534838" strokeWidth="6"/><path d="M0 -26V25M-34 -12h23M10 -12h23" stroke="#827358" strokeWidth="3"/></g>;})()}
        </g>
      </g>}
      <CounterCard x={190} y={1020} scale={.70} name="الأزرق" good={friendGood} bad={friendSin} accent="#9db6a4" frame={frame}/>
      <CounterCard x={460} y={1020} scale={.70} name="بلال" good={bilalGood} bad={bilalSin} accent="#9db6a4" frame={frame}/>
      <CounterCard x={805} y={1000} scale={.70} name="النائم" good={base} bad={base} accent="#d4c2a3" frame={frame}/>
      <DodoActor role="friend" frame={frame} scale={.90}/>
      <DodoActor role="bilal" frame={frame} scale={.90}/>
      <DodoActor role="sleeper" frame={frame} scale={.90}/>
      </g>
      {currentPage&&<g>
        <rect x="74" y="148" width="932" height="116" rx="30" fill="#fffdf8" stroke="#302920" strokeWidth="5" opacity=".98"/>
        <text x="540" y="222" textAnchor="middle" direction="rtl" fontSize="48" fontWeight="800" fill="#302920">
          {currentPage.words.filter(w=>t>=w.startMs/1000).map(w=>w.text).join(' ')}
        </text>
      </g>}
    </svg>
  </AbsoluteFill>;
};
