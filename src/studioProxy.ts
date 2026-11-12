/**
 * Studio-only light copies of heavy videos (user 2026-11-09: «يقطع ويتوقف صوته… بدي التعديلات دائمة»).
 * Any <video>/<audio> whose src ends with a file listed in data/preview_proxies.json ({"<rel>": "<version>"}) is switched to its light copy
 * (<name>_prev_<version>.mp4 for video, .m4a for audio; made by tools/make_preview_proxy.mjs, automatic in `stage.mjs check`).
 * The version is part of the file name, so a rebuilt proxy is a NEW url (no stale bytes in the browser cache).
 * It hooks the element itself, so EVERY composition benefits (Video, OffthreadVideo-in-Studio, Audio, SafeVideo, MaskedVideo) with no per-file code.
 * Renders and stills (getRemotionEnvironment().isRendering) are never touched: they use the full files.
 */
import { getRemotionEnvironment } from "remotion";
import proxies from "../data/preview_proxies.json";

const map = proxies as unknown as Record<string, string>;
const rels = Object.keys(map);
const rendering = (): boolean => { try { return getRemotionEnvironment().isRendering; } catch { return true; } };

const swap = (v: string, audio: boolean): string => {
  if (!v || !rels.length || rendering()) return v;
  const m = v.match(/^([^#?]*)([#?].*)?$/);
  if (!m) return v;
  const path = m[1];
  let dec = path; try { dec = decodeURIComponent(path); } catch { /* keep raw */ }
  if (!/\.mp4$/i.test(dec) || /_prev(_\w+)?\.mp4$/i.test(dec)) return v;
  const rel = rels.find((r) => dec.endsWith("/" + r) || dec === r);
  if (!rel) return v;
  return path.replace(/\.mp4$/i, `_prev_${map[rel]}.${audio ? "m4a" : "mp4"}`) + (m[2] ?? "");
};

const g = globalThis as unknown as { __studioProxy?: boolean };
if (typeof window !== "undefined" && !g.__studioProxy) {
  g.__studioProxy = true;
  const proto = HTMLMediaElement.prototype;
  const d = Object.getOwnPropertyDescriptor(proto, "src");
  if (d?.set && d.get) {
    Object.defineProperty(proto, "src", { configurable: true, enumerable: d.enumerable, get: d.get, set(this: HTMLMediaElement, v: string) { d.set!.call(this, swap(String(v), this instanceof HTMLAudioElement || this.tagName === "AUDIO")); } });
  }
  const sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
    if (name === "src" && (this.tagName === "VIDEO" || this.tagName === "AUDIO")) value = swap(String(value), this.tagName === "AUDIO");
    return sa.call(this, name, value);
  };
}
