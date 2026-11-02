import * as brush from 'p5.brush/standalone';
import {hash} from './art';
const W=1280,H=720;
export interface BikePaint{sky:HTMLCanvasElement;fields:HTMLCanvasElement}
export function makeBikePaint():BikePaint{
 const source=brush.createCanvas(W,H,{pixelDensity:1,id:'paint'}) as HTMLCanvasElement;
 brush.seed(312);brush.noiseSeed(312);brush.translate(-W/2,-H/2);brush.noStroke();brush.fillBleed(.12);brush.fillTexture(.62,.35);
 const poly=(pts:number[][],color:string,alpha=190)=>{brush.fill(color,alpha);brush.polygon(pts)};
 const blob=(x:number,y:number,rx:number,ry:number,color:string,seed:number,alpha=170)=>poly(Array.from({length:28},(_,i)=>{const a=i/28*Math.PI*2,j=1+(hash(seed+i)-.5)*.17;return [x+Math.cos(a)*rx*j,y+Math.sin(a)*ry*j]}),color,alpha);
 brush.clear('#eeeedd');poly([[0,0],[W,0],[W,400],[0,400]],'#8cb8cf',180);
 blob(1050,80,210,230,'#efd68b',39,100);blob(1050,80,73,90,'#e5bf62',49,130);
 for(let i=0;i<14;i++)blob(hash(i*5)*1400-60,20+hash(i*11)*240,100+hash(i+8)*180,22+hash(i+4)*24,'#f4f0dc',60+i,195);
 for(let k=0;k<4;k++){const y=230+k*31;const pts:number[][]=[[0,380]];for(let i=0;i<13;i++)pts.push([i*120-70,y+(hash(i+k*31)-.5)*110]);pts.push([1400,400]);poly(pts,['#80a5bc','#7a9fb4','#85adc0','#a0bdba'][k],125);}
 poly([[0,355],[200,323],[470,350],[800,325],[1280,350],[1280,425],[0,425]],'#acc699',190);
 brush.render();const copy=()=>{const cn=document.createElement('canvas');cn.width=W;cn.height=H;cn.getContext('2d')!.drawImage(source,0,0);return cn};const sky=copy();
 brush.clear();brush.seed(817);brush.noStroke();
 const colors=['#b6c56f','#d6cf79','#90b766','#b9d3c4','#8ebd62','#cfcc84'];
 for(let row=0;row<5;row++){const yy=350+row*58;for(let col=0;col<9;col++){const x=col*180-100+(row%2)*64;poly([[x,yy],[x+188,yy-7],[x+193,yy+68],[x-6,yy+67]],colors[(col+row*2)%colors.length],200);}}
 poly([[0,552],[1280,552],[1280,593],[0,590]],'#bd986e',220);
 poly([[0,594],[1280,594],[1280,720],[0,720]],'#7da951',195);
 brush.render();const fields=copy();source.remove();return {sky,fields};
}
