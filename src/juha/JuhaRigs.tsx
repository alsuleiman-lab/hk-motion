import React, {useId} from "react";
import {staticFile} from "remotion";

const asset = (name: string) => staticFile(`juha_story/rig_v3/${name}.png`);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

type PersonProps = {x: number; floor: number; frame: number; scale?: number; boy?: boolean; walk?: number; seat?: number; gesture?: number; talking?: boolean; flip?: boolean; coat?: string};

export const PersonRig: React.FC<PersonProps> = ({x, floor, frame, scale = .88, boy, walk = 0, seat = 0, gesture = 0, talking, flip, coat}) => {
  const id = useId().replace(/:/g, "");
  const phase = frame * .25;
  const bob = -Math.abs(Math.sin(phase)) * 7 * walk + Math.sin(phase) * 2 * seat;
  const bodyLean = Math.sin(phase) * 1.8 * walk;
  const headTurn = talking ? Math.sin(frame * .22) * 3.5 : gesture * -3;
  const w = boy ? 240 : 214;
  const leg = (side: number) => {
    const swing = Math.sin(phase + (side < 0 ? Math.PI : 0));
    const lift = Math.max(0, Math.cos(phase + (side < 0 ? Math.PI : 0)));
    const hx = side * 25;
    const kx = mix(hx + swing * 34 * walk, hx + side * 38, seat);
    const ky = mix(-82, -97, seat);
    const fx = mix(hx + swing * 62 * walk, hx + side * 48 + 21, seat);
    const fy = mix(-lift * 30 * walk, -12, seat);
    return <g key={side}><path d={`M${hx},-174 Q${kx},${ky} ${fx},${fy}`} fill="none" stroke="#192027" strokeWidth={11} strokeLinecap="round"/><ellipse cx={fx + 8} cy={fy + 1} rx={18} ry={7} fill="#192027" transform={`rotate(${-swing * 10 * walk} ${fx} ${fy})`}/></g>;
  };
  const arm = (side: number) => {
    const swing = Math.sin(phase + (side > 0 ? Math.PI : 0)) * walk;
    const sx = side * 57, sy = -288;
    const ex = mix(side * (74 + swing * 12), side * 115, gesture);
    const ey = mix(-215, -328 + Math.sin(frame * .2) * 6, gesture);
    const hx = mix(side * (80 + swing * 31), side * 166, gesture);
    const hy = mix(-150 - Math.abs(swing) * 12, -351 + Math.sin(frame * .2) * 8, gesture);
    return <g key={side}><path d={`M${sx},${sy} Q${ex},${ey} ${hx},${hy}`} fill="none" stroke="#192027" strokeWidth={10} strokeLinecap="round"/><ellipse cx={hx} cy={hy} rx={10} ry={13} fill="#192027" transform={`rotate(${side * 25} ${hx} ${hy})`}/>{gesture > .2 && <path d={`M${hx},${hy - 4} l${side * 17},-9`} stroke="#192027" strokeWidth={6} strokeLinecap="round"/>}</g>;
  };
  return <g transform={`translate(${x} ${floor}) scale(${flip ? -scale : scale} ${scale})`}>
    <ellipse cx="2" cy="7" rx="77" ry="12" fill="#443426" opacity=".24"/>
    {leg(-1)}{leg(1)}
    <g transform={`translate(0 ${bob}) rotate(${bodyLean} 0 -170)`}>
      {arm(-1)}{arm(1)}
      <defs><clipPath id={`${id}-torso`}><rect x="-160" y="-305" width="320" height="153"/></clipPath><clipPath id={`${id}-head`}><rect x="-170" y="-540" width="340" height="247"/></clipPath></defs>
      <g clipPath={`url(#${id}-torso)`}><image href={asset(boy ? "boy" : "juha")} x={-w / 2} y={-525} width={w} height={360}/></g>
      {coat && <path d="M-46 -289 Q0 -274 46 -289 L82 -171 Q0 -149 -82 -171Z" fill={coat} stroke="#192027" strokeWidth={7}/>}
      <g transform={`rotate(${headTurn} 0 -300)`}><g clipPath={`url(#${id}-head)`}><image href={asset(boy ? "boy" : "juha")} x={-w / 2} y={-525} width={w} height={360}/></g></g>
    </g>
  </g>;
};

type DonkeyProps = {x: number; floor: number; frame: number; burden?: number; tired?: boolean};
export const DonkeyRig: React.FC<DonkeyProps> = ({x, floor, frame, burden = 0, tired}) => {
  const cadence = tired ? .17 : .25;
  const phase = frame * cadence;
  const bob = -Math.abs(Math.sin(phase)) * (tired ? 2 : 5);
  const leg = (hx: number, index: number, far: boolean) => {
    const t = phase + index * Math.PI * .83;
    const swing = Math.sin(t);
    const kx = hx + swing * 19, ky = -78 + burden * 7;
    const fx = hx + swing * 39, fy = -Math.max(0, Math.cos(t)) * 23;
    const path = `M${hx},-158 Q${kx},${ky} ${fx},${fy}`;
    return <g key={index}><path d={path} fill="none" stroke="#192027" strokeWidth={26} strokeLinecap="round"/><path d={path} fill="none" stroke={far ? "#79746d" : "#aaa39a"} strokeWidth={15} strokeLinecap="round"/><path d={`M${fx - 10},${fy - 3} q19 -7 26 3 v8 h-26Z`} fill="#192027"/></g>;
  };
  return <g transform={`translate(${x} ${floor + bob})`}>
    <ellipse cx="0" cy="8" rx="222" ry="20" fill="#443426" opacity=".25"/>
    {leg(-121, 0, true)}{leg(117, 2, true)}
    <path d={`M-203,-251 Q${-252 + Math.sin(frame * .13) * 18},-205 -252,-133`} fill="none" stroke="#192027" strokeWidth={10} strokeLinecap="round"/>
    <path d={`M-252,-151 q-17 18 -10 35 q15 -9 20 -27Z`} fill="#192027"/>
    <image href={asset("donkey_body")} x="-220" y={-370 + burden * 7} width="440" height="244"/>
    {leg(-166, 1, false)}{leg(153, 3, false)}
    <g transform={`rotate(${Math.sin(phase) * 3 + burden * 9} 172 -285)`}><image href={asset("donkey_head")} x="125" y="-490" width="184" height="241"/></g>
    {tired && [0, 1, 2].map(i => {
      const p = ((frame + i * 7) % 24) / 24;
      return <path key={i} d="M0 -10 Q-10 3 0 10 Q10 3 0 -10Z" transform={`translate(${295 + i * 17} ${-300 + p * 100}) rotate(-15)`} fill="#d9e9eb" stroke="#192027" strokeWidth="3" opacity={1 - p}/>;
    })}
  </g>;
};
