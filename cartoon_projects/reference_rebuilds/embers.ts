import {Stage,Fire} from '../../../Papermotion/src/index';
import {pt,ep,ease,mix,line,path,disk,paperPath,ik,hash,grainCanvas,hand,glow,type Paper,type V} from './art';
const NIGHT='#0c152b',FAR='#233348',ROCK='#403c46',COAT='#856c58',SKIN='#cda47d',LIGHT='#e6bf8e';
/** Newly authored scene; no example classes, assets, camera code or character implementations. */
export class EmbersStudy extends Stage{
 readonly fire=new Fire(pt(640,602),{seed:6201,width:69,height:127,sparks:14});
 private readonly grain=grainCanvas();private t=0;private held=true;private handAt=pt(0,0);
 constructor(canvas:HTMLCanvasElement){super(canvas,{duration:10,width:1920,height:1080,fps:30,preroll:.6});this.paper.light={x:-.2,y:1};this.paper.edgeColor='rgba(232,194,130,.18)';}
 protected update(t:number,dt:number){this.t=t;this.held=t<3.6;this.fire.update(dt,t,mix(.6,1.1,ease((t-2.9)/.8)),.035);}
 probe(){return {...super.probe(),authoredScene:'embers.ts',beat:this.t<2.5?'warm':this.t<3.6?'feed':this.t<5.3?'release':'look-up',held:this.held,hand:this.handAt,hipMotion:0,footMotion:0,fireHeat:this.fire.heat};}
 private stone(p:Paper,x:number,y:number,rx:number,ry:number,seed:number){p.blob(ep(x,y,rx,ry,14).map((a,i)=>pt(a.x+(hash(seed+i)-.5)*rx*.13,a.y+(hash(seed+i*7)-.5)*ry*.15)),ROCK,{seed,tear:.2,shadow:1,edge:false,texture:.17});p.line([pt(x-rx*.7,y+ry*.2),pt(x-rx*.2,y),pt(x+rx*.45,y+ry*.12)],'rgba(163,130,113,.28)',.8)}
 private pines(p:Paper,x:number,y:number,s:number,seed:number){for(let k=0;k<5;k++){const a=k*12*s;p.blob([pt(x,y-75*s+a),pt(x-15*s-k*2*s,y-28*s+a),pt(x+16*s+k*2*s,y-28*s+a)],k%2?'#2b424a':'#314950',{seed:seed+k,tear:.25,shadow:0,edge:false,texture:.1})}p.line([pt(x,y-70*s),pt(x,y+20*s)],'#2c3b45',3*s)}
 private childWrist(t:number):V{
  const push=ease((t-2.5)/.85),release=ease((t-3.6)/.7);
  return pt(mix(mix(185,225,push),185,release),mix(mix(-75,-25,push),-125,release));
 }
 private person(p:Paper,x:number,y:number,s:number,adult:boolean,t:number){
  const c=p.context,flip=adult?-1:1;c.save();c.translate(x,y);c.scale(s*flip,s);
  const outline='rgba(229,186,132,.68)',skin=adult?'#c5a17d':SKIN;
  const headY=adult?-340:-280,shoulder=pt(20,adult?-240:-185),wrist=adult?pt(mix(195,222,ease((t-5.3)/1)),mix(-145,-194,ease((t-5.3)/1))):this.childWrist(t);
  const elbow=ik(shoulder,wrist,adult?132:120,adult?150:145,1,1);
  if(!adult)this.handAt=pt(x+wrist.x*s,y+wrist.y*s);
  p.sheet({shadow:2,rim:{color:outline,width:1.1},shade:{color:'rgba(27,22,37,.25)',width:5},texture:.18,edge:false,anchor:pt(0,-150)},()=>{
   const c=p.context;
   paperPath(p,'M5 -5 Q54 -53 112 -69 Q137 -53 149 -6 L192 104 L149 115 Q117 69 96 13 L49 45 L-3 34Z','#38343e',[-25,-85,250,235],outline,1.2);
   paperPath(p,'M147 103 Q177 95 204 104 L236 116 Q238 131 215 134 L154 132 Q140 127 147 103Z','#292b34',[130,90,115,55],outline,1.1);
   const torso=adult?'M-40 5 Q-64 -71 -32 -211 Q-23 -259 3 -274 Q37 -264 53 -232 Q68 -159 62 -108 Q75 -33 56 6 Q12 30 -40 5Z':'M-36 9 Q-58 -60 -24 -164 Q-11 -207 10 -210 Q44 -199 51 -161 L55 -92 Q69 -35 51 7 Q9 29 -36 9Z';
   paperPath(p,torso,COAT,[-80,-290,170,340],outline,1.2);
   p.inside(()=>{
    for(let i=0;i<7;i++)p.line([pt(-36+(i%2)*9,-28-i*26),pt(-13+(i%2)*7,-39-i*26)],'rgba(217,181,137,.25)',1.8);
    p.line([pt(14,-211),pt(27,-141),pt(18,-72),pt(-3,-24)],'#b09974',1.7);
    p.line([pt(48,-80),pt(32,-92)],'#4d413c',4);
   });
   p.tube([shoulder,elbow,wrist],adult?44:37,adult?25:22,COAT,{seed:adult?101:102,tear:.2,shadow:0,edge:false});
   p.line([pt(shoulder.x+7,shoulder.y+7),pt(elbow.x+4,elbow.y+7),pt(wrist.x,wrist.y+7)],'rgba(227,190,139,.5)',1.2);
   hand(c,wrist,elbow,skin,adult?.78:.63,!this.held||adult);
   const turn=ease((t-5.3)/1.2)*(adult?-.16:-.09);
   c.save();c.translate(0,headY+74);c.rotate(turn);c.translate(0,-(headY+74));
   const hy=headY;
   paperPath(p,`M-15 ${hy+81} L-18 ${hy+50} L17 ${hy+45} L27 ${hy+80} L6 ${hy+94}Z`,skin,[-25,hy+40,70,70],outline,1);
   // Profile contour contains the nose, jaw and forehead as a single stable cutout.
   paperPath(p,`M-47 ${hy-38} Q-27 ${hy-72} 7 ${hy-61} Q39 ${hy-58} 46 ${hy-29} L48 ${hy-10} L64 ${hy+2} Q67 ${hy+8} 51 ${hy+12} Q51 ${hy+44} 29 ${hy+63} Q-4 ${hy+81} -28 ${hy+44} Q-43 ${hy+22} -47 ${hy-38}Z`,skin,[-55,hy-80,130,170],outline,1.1);
   paperPath(p,`M-45 ${hy+31} Q-66 ${hy-32} -38 ${hy-66} Q1 ${hy-88} 35 ${hy-54} L47 ${hy-26} Q22 ${hy-24} 6 ${hy-48} Q-12 ${hy-29} -30 ${hy-32} L-26 ${hy+24}Z`,adult?'#565457':'#34313c',[-80,hy-90,145,140],'rgba(166,151,142,.35)',1);
   disk(c,-31,hy+10,15,20,adult?'#ac7a60':'#b78365','rgba(88,63,56,.4)',1);line(c,[pt(-34,hy+5),pt(-22,hy+11),pt(-30,hy+19)],'#6e5449',1.5);
   disk(c,27,hy-14,8.5,9.4,'#2c2a31');disk(c,29,hy-17-ease((t-5.3)/1.2)*2,2.5,2.5,'#f6e9c6');
   line(c,[pt(12,hy-36),pt(34,hy-33)],'#4f4038',2.2);
   disk(c,27,hy+22,18,10,'rgba(224,150,115,.65)');
   line(c,[pt(42,hy+42),pt(29,hy+45)],'#695447',1.2);
   c.restore();
  });
  c.restore();
 }
 protected draw(t:number){
  const c=this.ctx,p=this.paper;p.setFrame(0);c.save();c.scale(1.5,1.5);
  const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,NIGHT);sky.addColorStop(1,'#243447');c.fillStyle=sky;c.fillRect(0,0,1280,720);
  for(let i=0;i<120;i++){const x=hash(i+6)*1280,y=hash(i*3+4)*390,r=i%17===0?1.7:.7;c.globalAlpha=.25+hash(i)*.4;disk(c,x,y,r,r,'#bbc5cd');if(i%17===0){line(c,[pt(x-4,y),pt(x+4,y)],'#a3b5c4',.5);line(c,[pt(x,y-4),pt(x,y+4)],'#a3b5c4',.5)}}c.globalAlpha=1;
  const wide=ease((t-5.15)/1.6),zoom=mix(1.55,1,wide),cy=mix(490,620,wide);
  c.save();c.translate(640,cy);c.scale(zoom,zoom);c.translate(-640,-600);
  p.blob([pt(-200,540),pt(180,420),pt(360,397),pt(570,480),pt(770,422),pt(1020,383),pt(1500,370),pt(1500,800),pt(-200,800)],FAR,{seed:710,tear:.3,shadow:0,edge:false,texture:.14});
  p.blob([pt(-100,650),pt(230,515),pt(510,488),pt(700,533),pt(960,449),pt(1410,557),pt(1410,800),pt(-100,800)],'#253544',{seed:711,tear:.3,shadow:0,edge:false,texture:.1});
  for(let i=0;i<16;i++)this.pines(p,60+i*100,615-hash(i+9)*75,.4+hash(i)*.4,750+i*9);
  p.blob([pt(-100,673),pt(300,638),pt(900,635),pt(1410,660),pt(1410,800),pt(-100,800)],'#252c37',{seed:720,tear:.1,shadow:0,edge:false,texture:.13});
  p.blob([pt(380,643),pt(480,588),pt(678,582),pt(915,610),pt(1040,645),pt(819,673),pt(470,670)],'#42363b',{seed:721,tear:.3,shadow:0,edge:false,texture:.1});
  this.stone(p,140,468,92,184,725);paperPath(p,'M73 635 L68 411 Q61 333 118 304 Q172 262 225 317 L224 367 L196 374 L174 458 L178 639Z','#48434a',[50,280,190,380],'rgba(177,144,121,.28)',1);
  for(let i=0;i<7;i++)p.line([pt(76,380+i*31),pt(134,359+i*34),pt(206,347+i*29)],'rgba(158,127,115,.28)',1);
  line(c,[pt(141,467),pt(138,440),pt(130,419)],'rgba(175,111,80,.55)',6);for(let i=0;i<4;i++)line(c,[pt(137+i*3,437),pt(128+i*7,414)],'rgba(175,111,80,.55)',2.8);
  line(c,[pt(260,652),pt(277,456)],'#927d58',3);path(c,'M269 468 L278 443 L284 470Z','#ad9e75','',0);
  path(c,'M304 647 Q330 644 351 648 Q343 668 328 668 Q310 666 304 647Z','#765b46','#b0926b',.8);
  for(let i=0;i<80;i++){const x=hash(i*19+8)*1280,y=636+hash(i*7)*150;if(i%3===0){disk(c,x,y,3+hash(i)*5,1.7,'#71645b')}else if(i%8===0){line(c,[pt(x,y),pt(x-4,y-15),pt(x-10,y-23)],'#827868',.8);}}
  this.stone(p,472,628,54,28,810);this.stone(p,835,617,82,37,811);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;this.stone(p,640+Math.cos(a)*76,609+Math.sin(a)*22,25,13,830+i)}
  // Logs are fixed on the ground. Their rings never drift independently.
  for(const [x,y,ang] of [[605,612,.13],[650,618,-.1],[640,600,.32]]){c.save();c.translate(x,y);c.rotate(ang);path(c,'M-53 -7 L45 -7 Q56 0 45 8 L-53 8Z','#6f4d3b','#99734e',1);disk(c,45,0,6.5,8,'#a57c50','#4f3e35',.8);disk(c,45,0,3,5,'#765438','#4f3e35',.7);for(let j=0;j<3;j++)line(c,[pt(-47,-4+j*4),pt(34,-3+j*4)],'#3e322e',.7);c.restore();}
  const releaseW=this.childWrist(Math.min(t,3.6)),a=pt(475+releaseW.x*.36,600+releaseW.y*.36),b=pt(a.x+101,a.y+31);
  line(c,[a,b],'#a48562',3.8);line(c,[pt(a.x+70,a.y+21),pt(a.x+83,a.y+10)],'#997b59',2.2);
  this.person(p,475,600,.36,false,t);this.person(p,835,575,.4,true,t);
  this.fire.glow(p,250);this.fire.draw(p);
  if(t>5.3){const u=ease((t-5.3)/1.2);c.save();c.globalAlpha=u*.65;const points=[pt(700,121),pt(735,84),pt(778,90),pt(820,44),pt(861,60),pt(904,31),pt(932,53)];line(c,points,'rgba(176,193,206,.35)',.6);for(const v of points)disk(c,v.x,v.y,1.7,1.7,'#b3bdc9');c.restore();}
  c.restore();c.save();c.globalAlpha=.3;c.drawImage(this.grain,0,0);c.restore();c.restore();
 }
}
