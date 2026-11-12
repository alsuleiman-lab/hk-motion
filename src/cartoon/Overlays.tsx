import React from 'react';
import {FONT_TITLE, FONT_QURAN, QURAN_FONT} from '../localFonts';

/** Reusable cartoon overlays: social watermark (user order, every cartoon) and the word-timed Arabic caption (top safe area). */

const Icon: React.FC<{k: 'fb' | 'ig' | 'tt'}> = ({k}) => (
  <svg width={34} height={34} viewBox="0 0 34 34">
    {k === 'fb' && <><circle cx={17} cy={17} r={16} fill="#1877f2" /><path d="M18.6 28V18.4h3.2l.5-3.8h-3.7v-2.4c0-1.1.3-1.8 1.9-1.8h2V7c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.9H11.8v3.8H15V28z" fill="#fff" /></>}
    {k === 'ig' && <><defs><linearGradient id="ov-ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#fdb750" /><stop offset=".5" stopColor="#e1306c" /><stop offset="1" stopColor="#833ab4" /></linearGradient></defs><rect x={1} y={1} width={32} height={32} rx={9} fill="url(#ov-ig)" /><circle cx={17} cy={17} r={7.2} fill="none" stroke="#fff" strokeWidth={2.6} /><circle cx={25} cy={9} r={1.9} fill="#fff" /></>}
    {k === 'tt' && <><rect x={1} y={1} width={32} height={32} rx={9} fill="#111" /><path d="M18.5 8v12.2a3.6 3.6 0 1 1-3.6-3.6" fill="none" stroke="#25f4ee" strokeWidth={3} transform="translate(-1.2 .8)" /><path d="M18.5 8v12.2a3.6 3.6 0 1 1-3.6-3.6M18.5 8c.4 2.8 2.2 4.3 5 4.5" fill="none" stroke="#fe2c55" strokeWidth={3} transform="translate(1.2 -.4)" /><path d="M18.5 8v12.2a3.6 3.6 0 1 1-3.6-3.6M18.5 8c.4 2.8 2.2 4.3 5 4.5" fill="none" stroke="#fff" strokeWidth={3} /></>}
  </svg>
);

/** icons + handle, centred, inside the fourth fifth of the frame (centre y≈1344), ~70% opaque, no box */
export const Watermark: React.FC = () => (
  <div style={{position: 'absolute', left: 540, top: 1326, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, opacity: .7, direction: 'ltr', fontFamily: 'Almarai, Arial, sans-serif', fontWeight: 800, fontSize: 30, color: '#fff', textShadow: '0 0 5px #000, 0 0 3px #000'}}>
    <Icon k="fb" /><Icon k="ig" /><Icon k="tt" /><span style={{marginLeft: 6}}>@3la_fetra</span>
  </div>
);

export type CapWord = {t: string; at: number; to: number; q?: boolean};
export type CapPage = {from: number; to: number; words: CapWord[]};

/** greedy pages of ≤4 words / ≤22 characters from word-timed lines */
export const capPages = (lines: {words: CapWord[]}[]): CapPage[] => {
  const out: CapPage[] = [];
  for (const l of lines) {
    let cur: CapWord[] = [];
    const flush = () => { if (cur.length) out.push({from: cur[0].at, to: cur[cur.length - 1].to, words: cur}); };
    for (const w of l.words) {
      const next = [...cur, w];
      if (cur.length && (next.length > 4 || next.map((x) => x.t).join(' ').length > 22)) { flush(); cur = [w]; } else cur = next;
    }
    flush();
  }
  return out;
};

/** Arabic RTL caption pill at the top safe area: each word appears at its own onset, future words are never shown */
export const Captions: React.FC<{t: number; pages: CapPage[]}> = ({t, pages}) => {
  FONT_TITLE(); FONT_QURAN();
  const pg = pages.find((p) => t >= p.words[0].at && t < p.to + 0.12);
  if (!pg) return null;
  const shown = pg.words.filter((w) => t >= w.at - 0.001);
  const chars = shown.map((w) => w.t).join(' ').length, quran = pg.words.every((w) => w.q);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', direction: 'rtl'}}>
      <div style={{background: 'rgba(40,30,24,.9)', borderRadius: 28, padding: '18px 38px', fontFamily: quran ? `"${QURAN_FONT}", serif` : '"Noto Kufi Arabic", sans-serif', fontWeight: quran ? 400 : 800, fontSize: quran ? (chars > 22 ? 64 : 74) : chars > 22 ? 54 : 64, color: '#fff7e6', lineHeight: 1.25, border: '4px solid #141414', whiteSpace: 'nowrap'}}>
        {shown.map((w, i) => <span key={i} style={{display: 'inline-block', marginInline: 9, unicodeBidi: 'isolate'}}>{w.t}</span>)}
      </div>
    </div>
  );
};
