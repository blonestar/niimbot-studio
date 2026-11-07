const DIGRAPHS: Record<string, string> = { lj: "љ", nj: "њ", dž: "џ", Lj: "Љ", LJ: "Љ", Nj: "Њ", NJ: "Њ", Dž: "Џ", DŽ: "Џ" };
const LETTERS: Record<string, string> = Object.fromEntries(
  [..."abcčćdđefghijklmnoprsštuvzž"].flatMap((l, i) => {
    const c = "абцчћдђефгхијклмнопрсштувзж"[i]!;
    return [
      [l, c],
      [l.toUpperCase(), c.toUpperCase()],
    ];
  }),
);
const PATTERN = /dž|DŽ|Dž|lj|LJ|Lj|nj|NJ|Nj|./gsu;

/** Serbian Latin to Cyrillic. Letters without a Cyrillic counterpart (q, w, x, y) are kept. */
export function toCyrillic(latin: string): string {
  return latin.replace(PATTERN, (m) => DIGRAPHS[m] ?? LETTERS[m] ?? m);
}
