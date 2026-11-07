const MM_PER_PT = 25.4 / 72;

export const ptToMm = (pt: number) => pt * MM_PER_PT;
export const mmToPt = (mm: number) => mm / MM_PER_PT;
export const round1 = (n: number) => Math.round(n * 10) / 10;
export const newId = () => crypto.randomUUID().replaceAll("-", "").slice(0, 16);
