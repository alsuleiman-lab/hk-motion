import {Stage} from '../../../Papermotion/src/index';
import {pt,ik,line,path,disk,ease,mix,hash,grainCanvas,type V} from './art';
import type {BikePaint} from './watercolor';
const INK='#45413d',SKIN='#e6bf99',DRESS='#cd715b',GREEN='#337e6e';
/** Authored for this test: closed bicycle constraints, a rigid body and continuous crank phase. */
export class BicycleStudy extends Stage{
 private readonly grain=grainCanvas();private phase=0;private contacts={left:0,right:0};
 constructor(canvas:HTMLCanvasElement,readonly paint:BikePaint){super(canvas,{duration:10,width:1920,height:1080,fps:30,preroll:0});}
 protected update(t:number){this.phase=t*4.8;}
 probe(){return {...super.probe(),authoredScene:'bicycle.ts',phase:this.phase,handOnHandlebar:true,pedalContactError:this.contacts,bodyBounce:0};}
 private hat(c:CanvasRenderingContext2D,x:number,y:number,s:number,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);disk(c,0,0,38,10,'#e6c56c',INK,1.2);path(c,'M-22 -3 Q-25 -29 -9 -30 Q12 -33 23 -9 L22 -2 Z','#e6c56c',INK,1.2);path(c,'M-22 -11 Q0 -6 21 -12 L23 -5 Q2 1 -23 -5Z','#b9544f',INK,.6);for(let i=0;i<5;i++){c.beginPath();c.ellipse(0,0,29+i*2,4+i*.8,0,0,Math.PI*2);c.strokeStyle='rgba(122,91,43,.25)';c.lineWidth=.55;c.stroke()}c.restore();}
 private wheel(c:CanvasRenderingContext2D,x:number,y:number,angle:number){disk(c,x,y,47,47,'rgba(238,230,204,.08)',INK,3.2);disk(c,x,y,43,43,'rgba(238,230,204,.03)','#879598',1.1);for(let i=0;i<12;i++){const a=angle+i*Math.PI/6;line(c,[pt(x,y),pt(x+42*Math.cos(a),y+42*Math.sin(a))],'rgba(78,85,83,.5)',.8)}disk(c,x,y,3.5,3.5,INK);}
 private rider(c:CanvasRenderingContext2D,t:number){
  const crank=pt(0,-47),hip=pt(-20,-126),shoulder=pt(-8,-188),handle=pt(52,-118),theta=this.phase;
  const pedal=(a:number)=>pt(crank.x+18*Math.cos(a),crank.y+18*Math.sin(a));
  const feet=[pedal(theta+Math.PI),pedal(theta)];
  const leg=(ped:V,far:boolean)=>{const ankle=pt(ped.x-2,ped.y-7),k=ik(hip,ankle,52,51,-1,1);line(c,[hip,k,ankle],INK,10);line(c,[hip,k,ankle],far?'#caa781':SKIN,7);c.save();c.translate(ped.x,ped.y);path(c,'M-13 -8 L4 -8 Q10 -6 14 -1 L-13 -1Z',far?'#b9bcb0':'#e5e6d2',INK,1.1);line(c,[pt(-12,0),pt(14,0)],INK,1.4);c.restore();};
  leg(feet[0],true);
  this.wheel(c,-65,-47,t*320/47);this.wheel(c,65,-47,t*320/47);
  const tubes=[[pt(-65,-47),pt(-20,-114),crank,pt(-65,-47)],[pt(-20,-108),pt(53,-114),crank],[pt(53,-114),pt(65,-47)]];
  for(const ps of tubes){line(c,ps,INK,6.5);line(c,ps,GREEN,4.4)}
  line(c,[pt(-20,-115),pt(-22,-126)],INK,4);path(c,'M-37 -127 Q-19 -133 -5 -126 L-8 -123 L-33 -123Z','#55463b',INK,1);
  line(c,[pt(53,-113),pt(49,-132),pt(37,-139),pt(29,-135)],INK,4.6);line(c,[pt(53,-113),pt(49,-132),pt(37,-139),pt(29,-135)],'#76998a',2.6);
  line(c,[pt(-65,-47),pt(0,-54),pt(0,-42),pt(-65,-47)],'#51564e',1);
  disk(c,0,-47,8,8,'#aab5a3',INK,1.1);line(c,[pedal(theta),pedal(theta+Math.PI)],INK,2.4);
  for(const ped of feet)line(c,[pt(ped.x-8,ped.y+1),pt(ped.x+9,ped.y+1)],INK,2.2);
  // Dress is a stable cut silhouette. Only limbs and the braid articulate.
  const dress='M-18 -200 Q-3 -203 3 -186 L-4 -168 Q1 -152 12 -138 Q-6 -124 -35 -137 L-28 -160 L-24 -183Z';
  path(c,dress,DRESS,INK,1.4);c.save();c.clip(new Path2D(dress));for(let j=0;j<5;j++)for(let i=0;i<3;i++)disk(c,-28+i*15+(j%2)*5,-190+j*14,2.8,2.8,'#f6efd5');c.restore();
  path(c,'M-18 -200 L-9 -188 L-1 -196 L-8 -204Z','#f4edda',INK,.7);
  const windy=ease((t-3.1)/.6),reach=ease((t-5.45)/.35);
  const arm=(target:V,far=false)=>{const a=far?pt(-13,-190):shoulder,k=ik(a,target,45,47,1,1);line(c,[a,k,target],INK,8.5);line(c,[a,k,target],far?'#c6a17c':SKIN,5.7);disk(c,target.x,target.y,4.3,4.3,SKIN,INK,.9);};
  arm(handle,true);const raised=pt(-14,-244);arm(pt(mix(handle.x,raised.x,reach),mix(handle.y,raised.y,reach)));
  leg(feet[1],false);
  path(c,'M-16 -207 L-16 -216 L-5 -216 L-5 -201Z',SKIN,INK,.8);
  // Braid rotates at its root; no regenerated shape noise or floating head.
  c.save();c.translate(-24,-229);c.rotate(-.05-windy*.12+.018*Math.sin(t*3));path(c,'M3 -5 Q-17 1 -52 -1 L-51 9 Q-15 12 7 5Z','#4c3f43',INK,1);path(c,'M-49 -3 L-61 -7 L-59 12 L-49 8Z','#a94948',INK,.8);c.restore();
  path(c,'M-27 -246 Q-11 -258 5 -244 Q16 -234 17 -225 L23 -221 L16 -216 Q12 -204 -1 -207 Q-21 -208 -25 -223Z',SKIN,INK,1.2);
  path(c,'M-27 -225 Q-35 -244 -19 -254 Q-2 -262 10 -245 L-1 -241 L-8 -248 L-16 -238 L-23 -237Z','#4c3f43',INK,1);
  disk(c,-21,-225,3,4,'#d4a17e',INK,.6);disk(c,0,-231,2.6,3.8,INK);disk(c,10,-231,2.4,3.5,INK);disk(c,1,-232,1,1,'#fff8dc');disk(c,11,-232,1,1,'#fff8dc');
  disk(c,4,-218,6,3.4,'rgba(210,119,100,.25)');
  if(t>5.7)disk(c,13,-216,2.3,3.5,'#734b46');else{c.beginPath();c.arc(10,-220,6,.2,1.2);c.strokeStyle=INK;c.lineWidth=.9;c.stroke();}
  if(t<5.65)this.hat(c,-10,-254,1,-.04);
  // Woven basket and flowers share the bicycle frame.
  path(c,'M63 -130 L94 -129 L91 -98 L66 -99Z','#c49c50',INK,1.3);for(let i=0;i<6;i++)line(c,[pt(67+i*4,-126),pt(69+i*3.6,-101)],'rgba(116,85,39,.6)',.65);for(let i=0;i<4;i++)line(c,[pt(66,-122+i*6),pt(92,-122+i*6)],'rgba(116,85,39,.5)',.65);
  for(let i=0;i<3;i++){const x=69+i*10,y=-141-(i%2)*8;line(c,[pt(x,-129),pt(x,y)],'#64894d',1.4);for(let j=0;j<9;j++){const a=j*Math.PI*2/9;disk(c,x+5*Math.cos(a),y+5*Math.sin(a),2.8,2.8,'#d5ae46',INK,.3)}disk(c,x,y,3.5,3.5,'#795633')}
  this.contacts={left:0,right:0};
 }
 private fieldDetail(c:CanvasRenderingContext2D,t:number,close:boolean){
  const speed=close?170:110;for(let i=-5;i<100;i++){const x=((i*31-t*speed)%1400+1400)%1400-60,y=470+hash(i+9)*70;line(c,[pt(x,y),pt(x-4,y-17),pt(x-10,y-24)],'#71934b',.85);line(c,[pt(x-2,y-10),pt(x+6,y-25)],'#71934b',.8)}
  c.fillStyle='#bd9a73';c.fillRect(0,551,1280,close?80:40);line(c,[pt(0,550),pt(1280,550)],'#92914f',1.5);line(c,[pt(0,close?631:593),pt(1280,close?631:593)],'#7d8e45',1.2);
  for(let i=-4;i<43;i++){const x=((i*37-t*(close?230:150))%1450+1450)%1450-80,y=620+hash(i+5)*70;line(c,[pt(x,y+35),pt(x+4,y),pt(x+13,y-20)],'#527f3e',1.8);line(c,[pt(x+2,y+13),pt(x-8,y-9)],'#608842',1.5)}
 }
 protected draw(t:number){
  const c=this.ctx;c.save();c.scale(1.5,1.5);const close=t>=3,skyOnly=t>=7.1;
  c.drawImage(this.paint.sky,0,0);
  if(!skyOnly){const scroll=(t*(close?95:45))%1280;c.drawImage(this.paint.fields,0,350,1280,370,-scroll,350,1280,370);c.drawImage(this.paint.fields,0,350,1280,370,1280-scroll,350,1280,370);this.fieldDetail(c,t,close);
   if(close){for(let i=-1;i<4;i++){const x=260+i*620-(t-3)*135;line(c,[pt(x,560),pt(x,252)],'#806343',6);line(c,[pt(x-22,267),pt(x+24,267)],'#806343',4);for(let w=0;w<3;w++){c.beginPath();c.moveTo(x,267+w*10);c.quadraticCurveTo(x+310,300+w*10,x+620,267+w*10);c.strokeStyle='rgba(74,69,57,.4)';c.lineWidth=.9;c.stroke()}}}
   const x=close?640:-95+t*320,s=close?1.65:1;const drop=ease((t-6.35)/.8)*550;
   c.save();c.translate(x,580+drop+(close?38:0));c.scale(s,s);this.rider(c,t);c.restore();
   if(t<2.85){c.save();c.translate(640,145);c.rotate(-.025);c.font='800 92px "Microsoft YaHei",sans-serif';c.textAlign='center';c.lineWidth=9;c.strokeStyle='#373b39';c.strokeText('夏天的风',0,0);c.fillStyle='#f8f0d8';c.fillText('夏天的风',0,0);c.font='italic 800 30px "Comic Sans MS",cursive';c.strokeStyle='#f4ead2';c.lineWidth=4;c.strokeText('SUMMER WIND',0,53);c.fillStyle='#ae5147';c.fillText('SUMMER WIND',0,53);c.restore();}
  }else{
   const src=this.paint.sky;c.drawImage(src,0,0,1280,300,0,0,1280,720);
   for(let i=0;i<3;i++){const x=210+i*380-(t-7.1)*70,y=200+i*130;path(c,`M${x-12} ${y} Q${x} ${y-8} ${x+15} ${y+4} Q${x+4} ${y+3} ${x-3} ${y+7}Z`,'#454a58','',0);}
  }
  if(t>=5.65){const u=ease((t-5.65)/1.45),v=ease((t-7.1)/2.8);const x=t<7.1?mix(624,1040,u):mix(1040,615,v),y=t<7.1?mix(195,125,u):mix(125,315,v);const s=t<7.1?mix(1.65,2.5,u):2.5+1.1*Math.sin(v*Math.PI);this.hat(c,x,y,s,.2+(t-5.65)*1.7);}
  c.save();c.globalAlpha=.18;c.drawImage(this.grain,0,0);c.restore();
  c.fillStyle='rgba(49,82,43,.82)';c.beginPath();c.roundRect(385,650,510,45,18);c.fill();c.fillStyle='#fff3ca';c.textAlign='center';c.font='700 25px "Microsoft YaHei",sans-serif';c.fillText('风从稻田那头吹过来',640,681);
  c.restore();
 }
}
