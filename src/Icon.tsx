import React from "react";
import { IconName } from "./data";

const paths: Record<IconName, React.ReactNode> = {
  wall: (
    <>
      <rect x="6" y="12" width="52" height="40" rx="2" />
      <path d="M6 25h52M6 38h52M20 12v13M38 12v13M13 25v13M31 25v13M49 25v13M20 38v14M38 38v14" />
    </>
  ),
  lotus: (
    <>
      <path d="M32 14c8 8 8 22 0 30-8-8-8-22 0-30z" />
      <path d="M32 44C20 44 10 38 8 26c10 0 18 6 24 18zM32 44c12 0 22-6 24-18-10 0-18 6-24 18z" />
      <path d="M10 50h44" />
    </>
  ),
  om: <text x="32" y="46" textAnchor="middle" fontSize="44" fill="currentColor" stroke="none" style={{ fontFamily: "Noto Sans Devanagari" }}>ॐ</text>,
  book: (
    <>
      <path d="M8 12h20a4 4 0 014 4v36a4 4 0 00-4-4H8zM56 12H36a4 4 0 00-4 4v36a4 4 0 014-4h20z" />
    </>
  ),
  scroll: (
    <>
      <path d="M14 10h34a6 6 0 016 6v6H20v26a6 6 0 01-12 0V16a6 6 0 016-6z" />
      <path d="M20 22v30h30a6 6 0 006-6v-6H28M28 30h18M28 38h14" />
    </>
  ),
  phone: (
    <>
      <rect x="18" y="6" width="28" height="52" rx="5" />
      <path d="M28 51h8M26 16h12M26 24h12M26 32h8" />
    </>
  ),
  search: (
    <>
      <circle cx="27" cy="27" r="16" />
      <path d="M39 39l16 16" />
    </>
  ),
  shield: (
    <>
      <path d="M32 6l20 8v16c0 14-9 22-20 28C21 52 12 44 12 30V14z" />
      <path d="M22 32l8 8 14-16" />
    </>
  ),
  warning: (
    <>
      <path d="M32 8l26 46H6z" />
      <path d="M32 24v14M32 45v2" />
    </>
  ),
  check: <path d="M10 34l14 14L54 16" />,
  cross: <path d="M14 14l36 36M50 14L14 50" />,
  brain: (
    <>
      <path d="M32 10c-6-4-16 0-16 9-6 2-8 12-2 16-2 8 8 14 14 10 6 4 16-2 14-10 6-4 4-14-2-16 0-9-10-13-8-9z" />
      <path d="M32 10v44" />
    </>
  ),
  kaaba: (
    <>
      <path d="M8 22l24-10 24 10v30L32 58 8 52z" />
      <path d="M8 22l24 10 24-10M32 32v26M8 28l24 10 24-10" />
    </>
  ),
  dome: (
    <>
      <path d="M12 44c0-16 8-24 20-30 12 6 20 14 20 30z" />
      <path d="M32 6v8M8 44h48M8 56h48M20 44v12M44 44v12" />
    </>
  ),
  scales: (
    <>
      <path d="M32 8v44M18 52h28M12 18h40" />
      <path d="M12 18L4 36h16zM52 18l-8 18h16z" />
    </>
  ),
  wave: <path d="M4 32c6-16 12-16 18 0s12 16 18 0 12-16 20 0" />,
  clock: (
    <>
      <circle cx="32" cy="32" r="24" />
      <path d="M32 18v14l10 6" />
    </>
  ),
  globe: (
    <>
      <circle cx="32" cy="32" r="24" />
      <path d="M8 32h48M32 8c-12 12-12 36 0 48M32 8c12 12 12 36 0 48" />
    </>
  ),
  star: <path d="M32 6l7 17 18 2-14 12 5 18-16-10-16 10 5-18L7 25l18-2z" />,
  heart: <path d="M32 54C8 38 6 22 18 16c6-3 11 0 14 6 3-6 8-9 14-6 12 6 10 22-14 38z" />,
  question: (
    <>
      <circle cx="32" cy="32" r="24" />
      <path d="M24 26c0-10 16-10 16-1 0 7-8 7-8 14M32 47v2" />
    </>
  ),
};

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; stroke?: number }> = ({ name, size = 120, color = "#d9b45a", stroke = 2.6 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
    {paths[name]}
  </svg>
);
