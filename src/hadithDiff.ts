/* The word-by-word comparison of two wordings of a hadith (the HadithCompare element, src/PickKit2.tsx). No imports: the self-test loads it directly (tools/selftest_cases/o_hadith_compare.mjs). */
/** a word without tashkeel, tatweel or punctuation; hamza-alef, alef maqsura and taa marbuta unified; the honorific ligatures ﷺ ﷻ are signs, not words (Unicode counts them as letters) */
export const hnorm = (s: string): string => s.replace(/[ﷺﷻ]/g, "").replace(/[ً-ٰٟـ]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}]/gu, "");

/** which words of A and of B are NOT in the longest common sequence of the two wordings (true = differs); a token with no letters (a sign such as ﷺ) never differs */
export const hadithDiff = (a: string, b: string): [boolean[], boolean[]] => {
  const A = a.trim().split(/\s+/).filter(Boolean), B = b.trim().split(/\s+/).filter(Boolean), na = A.map(hnorm), nb = B.map(hnorm);
  const L: number[][] = Array.from({ length: A.length + 1 }, () => new Array<number>(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = na[i] === nb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const da = A.map(() => true), db = B.map(() => true);
  let i = 0, j = 0;
  while (i < A.length && j < B.length) { if (na[i] === nb[j]) { da[i] = false; db[j] = false; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return [da.map((d, q) => d && na[q] !== ""), db.map((d, q) => d && nb[q] !== "")];
};
