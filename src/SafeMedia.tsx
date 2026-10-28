import React, { useCallback, useEffect, useRef, useState } from "react";
import { Video } from "remotion";

/**
 * SafeVideo — «فيديو لا يُظهر خطأً» (user rule 2026-10-20: errors must never show; the video keeps working or loading instead).
 * Wraps Remotion's <Video>: on a decode/playback error it silently REMOUNTS the element (up to 3 tries, 0.7 s apart — typical when a file was just rewritten or a seek hits a
 * bad packet); if it still fails it falls back to a MUTED copy so the picture keeps playing (audio can still come from a separate <Audio>). Nothing is thrown, no red screen.
 * Use it for every project video instead of a bare <Video>. For files, run `node tools/media_check.mjs <file>` before using them.
 */
export const SafeVideo: React.FC<{
  src: string; style?: React.CSSProperties; startFrom?: number; endAt?: number; volume?: number; muted?: boolean; playbackRate?: number;
}> = ({ src, style, startFrom, endAt, volume, muted = false, playbackRate }) => {
  const [tries, setTries] = useState(0);
  const [mute, setMute] = useState(muted);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onError = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (tries < 3) setTries((t) => t + 1);
      else if (!mute) { setMute(true); setTries(0); }
    }, 700);
  }, [tries, mute]);
  return <Video key={`${tries}-${mute}`} src={src} style={style} startFrom={startFrom} endAt={endAt} volume={volume} muted={mute} playbackRate={playbackRate} onError={onError} />;
};
