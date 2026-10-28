import React from 'react';
import type { Caption } from '@remotion/captions';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT_TITLE } from '../localFonts';
import { CARTOON_PALETTE as C } from './palette';
import timedCaptions from '../../data/cartoon/kamli_poet_king_captions.json';

const cues = timedCaptions as Caption[];
const pages: Caption[][] = [];
let page: Caption[] = [];
for (const cue of cues) {
  page.push(cue);
  if (cue.pageBreakAfter) {
    pages.push(page);
    page = [];
  }
}
if (page.length) pages.push(page);

/** Arabic word-timed subtitle card. Words appear only at their spoken onset. */
export const CartoonCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = frame / fps * 1000;
  const activePage = pages.find((p) => nowMs >= p[0].startMs && nowMs <= p[p.length - 1].endMs);
  if (!activePage) return null;
  const visible = activePage.filter((cue) => nowMs >= cue.startMs);
  if (!visible.length) return null;

  return <div dir="rtl" style={{
    position: 'absolute', left: 50, top: 72, width: 980, minHeight: 104,
    boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '15px 24px', borderRadius: 14, border: `4px solid ${C.gold}`,
    background: C.card, color: C.ink, boxShadow: `0 8px 0 ${C.woodDeep}55`,
    textAlign: 'center', fontFamily: FONT_TITLE(), fontWeight: 800, fontSize: 44,
    lineHeight: 1.3, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
  }}>
    <span>{visible.map((cue) => cue.text.trim()).join(' ')}</span>
  </div>;
};
