import {Stage} from '../../../Papermotion/src/index';
import {pt,ep,ease,mix,line,path,disk,paperPath,hash,grainCanvas,glow,type Paper,type V} from './art';
/** Authored independent reconstruction using generic Paper primitives and attached wing frames. */
export class MothStudy extends Stage{
 private readonly grain=grainCanvas();private at=pt(330,420);private angle=0;private touch=0;
 constructor(canvas:HTMLCanvasElement){super(canvas,{duration:10,width:1920,height:1080,fps:30,preroll:0});this.paper.light={x:-.65,y:.8};this.paper.edgeColor='rgba(231,220,172,.3)';}
 protected update(t:number){
  const a=ease(t/3.2),b=ease((t-4.7)/2.3);this.at=pt(t<3.2?mix(330,600,a):mix(600,656,b),t<3.2?mix(420,355,a):mix(355,360,b));
  this.angle=t<3.2?-.08*(1-a):0;this.touch=ease((t-7)/.45);
 }
 probe(){const tip=pt(this.at.x+63,this.at.y-19.6);return {...super.probe(),authoredScene:'moth.ts',beat:this.time<3.2?'approach':this.time<4.7?'hover':this.time<7?'touch':'respond',moth:this.at,antennaTip:tip,target:pt(719,340),gap:Math.hypot(tip.x-719,tip.y-340),bodyMorph:0};}
 private pendant(p:Paper,t:number){
  const c=p.context;c.save();c.translate(777,340);line(c,[pt(0,-340),pt(0,-49)],'#a48f66',.8);
  const open=ease((t-7.4)/1.5);
  for(let i=0;i<15;i++){const a=i*Math.PI*2/15;const x=Math.cos(a)*45,y=Math.sin(a)*45;c.save();c.translate(x,y);c.rotate(a+.1*open);p.blob([pt(-7,-5),pt(9,-8),pt(15,0),pt(9,8),pt(-7,5)],i%2?'#3d626c':'#bca87b',{seed:400+i,tear:.25,shadow:0,edge:false,texture:.1});c.restore();}
  p.piece(ep(0,0,48,48),'#c99661',{seed:440,tear:.2,shadow:3,texture:.16,rim:{color:'#ead19c',width:1}});
  p.piece(ep(0,0,38,38),'#2a3547',{seed:441,tear:.1,shadow:0,edge:false,texture:.12});
  c.save();c.beginPath();c.arc(0,0,36,0,Math.PI*2);c.clip();disk(c,-4,0,25,31,'#cfb179');disk(c,9,-5,25,32,'#2a3547');c.restore();
  if(open>0)glow(c,0,0,95,'rgba(218,185,114,'+(open*.16)+')');
  c.restore();
 }
 private insect(p:Paper,t:number){
  const c=p.context;c.save();c.translate(this.at.x,this.at.y);c.rotate(this.angle);c.scale(.7,.7);
  // Both wings hinge at (-8, 5). Their material paths never regenerate or morph.
  const wing=(far:boolean)=>{
   p.sheet({shadow:2,rim:{color:'#f4dfb0',width:.8},texture:.16,shade:{color:'rgba(84,47,63,.16)',width:3},edge:false,anchor:pt(-8,5)},()=>{
    const g=p.context;g.save();g.translate(-8,5);g.rotate((far?.25:-.45)+(far?-.12:.14)*Math.sin(t*9.5));g.scale(far?.84:1,1);
    paperPath(p,'M8 6 Q-47 -4 -85 -56 Q-113 -96 -80 -118 Q-45 -142 -3 -102 Q25 -73 22 -31 Q23 -8 8 6Z',far?'#796676':'#c18b66',[-115,-145,155,170],'rgba(241,220,178,.6)',1.2);
    paperPath(p,'M7 4 Q-41 -5 -75 -48 Q-86 -77 -67 -98 Q-35 -110 -7 -88 Q16 -60 17 -24Z','#e7cc95',[-90,-115,120,135],'rgba(95,67,66,.25)',.8);
    p.inside(()=>{const d=p.context;for(let i=0;i<8;i++){const x=-76+i*12,y=-85+Math.abs(i-4)*2;line(d,[pt(8,2),pt(x*.35,y*.44),pt(x,y)],'rgba(116,89,74,.4)',.7)}disk(d,-39,-77,15.5,16.5,'#504553');disk(d,-39,-77,9,10,'#efd795');disk(d,-37,-80,3,3,'#b79a75');});
    g.restore();
   });
  };
  wing(true);
  p.sheet({shadow:1,rim:{color:'#e4c68d',width:1},texture:.16,edge:false},()=>{const g=p.context;
   paperPath(p,'M-38 7 Q-8 -4 39 1 Q62 -6 66 9 Q63 26 35 27 L-30 26 Q-45 20 -38 7Z','#caa16e',[-50,-15,130,55],'rgba(92,67,59,.5)',.9);
   p.inside(()=>{const d=p.context;for(let i=0;i<8;i++)line(d,[pt(-28+i*9,5),pt(-28+i*9,27)],'#9a7257',1.2)});
   disk(g,50,6,7.5,8,'#3a303c');disk(g,52,3,2.6,2.6,'#fff0c6');
   line(g,[pt(55,-2),pt(72,-15),pt(90,-28)],'#eed8a6',1.2);line(g,[pt(48,-2),pt(61,-23),pt(72,-36)],'#eed8a6',1.1);
  });
  wing(false);c.restore();
 }
 protected draw(t:number){
  const c=this.ctx,p=this.paper;p.setFrame(0);c.save();c.scale(1.5,1.5);
  const g=c.createRadialGradient(710,720,5,710,360,850);g.addColorStop(0,'#293e4a');g.addColorStop(.6,'#14243b');g.addColorStop(1,'#0b1429');c.fillStyle=g;c.fillRect(0,0,1280,720);
  const zoom=1+.43*ease((t-3.1)/2.8);c.save();c.translate(800,360);c.scale(zoom,zoom);c.translate(-800,-360);
  for(let k=0;k<3;k++){const points=Array.from({length:81},(_,i)=>{const a=Math.PI+i/80*Math.PI;return pt(800+Math.cos(a)*(753-k*27),750+Math.sin(a)*(785-k*24))});p.tube(points,12,12,['#273e4d','#203849','#294351'][k],{seed:200+k,tear:.25,shadow:0,edge:false,texture:.1})}
  for(let i=0;i<5;i++){c.beginPath();c.ellipse(777,360,170+i*108,150+i*100,0,0,Math.PI*2);c.strokeStyle='rgba(153,130,92,.06)';c.lineWidth=.6;c.stroke()}
  for(let i=0;i<60;i++){const x=hash(i*13)*1360,y=hash(i*7+5)*760;disk(c,x,y,.4,.4,'rgba(225,222,171,.3)')}
  for(let i=0;i<10;i++){const x=65+i*137,y=620+hash(i*7)*50;line(c,[pt(x,750),pt(x-8,y)],'rgba(103,132,123,.2)',1);p.blob([pt(x-8,y),pt(x-25,y-15),pt(x-20,y-40),pt(x-10,y-51),pt(x+3,y-33),pt(x+6,y-13)],'rgba(93,126,122,.3)',{seed:260+i,tear:.2,shadow:0,edge:false,texture:.1});}
  this.pendant(p,t);this.insect(p,t);
  if(t>=7.4){const u=ease((t-7.4)/2.2);for(let i=0;i<18;i++){const a=i*2.399,x=777+Math.cos(a)*u*(70+i*6),y=340+Math.sin(a)*u*(50+i*4);disk(c,x,y,1.2,1.2,`rgba(233,208,151,${u*.5})`);}}
  c.restore();if(t<3){c.save();c.fillStyle='#b7ad8b';c.textAlign='center';c.font='500 11px Georgia,serif';(c as any).letterSpacing='3px';c.fillText('A PAPER NOCTURNE',640,633);c.restore();}
  c.save();c.globalAlpha=.3;c.drawImage(this.grain,0,0);c.restore();c.restore();
 }
}
