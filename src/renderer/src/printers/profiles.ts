import { modelsLibrary, type PrinterModel } from "@mmote/niimbluelib";
import type { LabelPreset, PrinterProfile } from "./types";

const strip = (w: number, lengths: number[]): LabelPreset[] => lengths.map((l) => ({ id: `${w}x${l}`, widthMm: l, heightMm: w }));

const sheet = (sizes: [number, number][]): LabelPreset[] => sizes.map(([w, h]) => ({ id: `${w}x${h}`, widthMm: w, heightMm: h }));

/** Print geometry for NIIMBOT models comes from niimbluelib's model library, so it stays in sync with the protocol. */
function niimbot(model: `${PrinterModel}`, labels: LabelPreset[], detect: string[] = [model]): PrinterProfile {
  const meta = modelsLibrary.find((m) => m.model === model);
  if (!meta) throw new Error(`niimbluelib does not know model ${model}`);
  return {
    id: `niimbot-${model.toLowerCase()}`,
    vendor: "NIIMBOT",
    name: model.replaceAll("_", " "),
    driver: "niimbot",
    dpi: meta.dpi,
    printheadPx: meta.printheadPixels,
    printDirection: meta.printDirection,
    density: { min: meta.densityMin, max: meta.densityMax, default: meta.densityDefault },
    labels,
    detect,
  };
}

const D_SERIES_ROLLS: LabelPreset[] = [
  ...strip(12, [22, 30, 40, 50, 75]),
  { id: "12x109", widthMm: 109, heightMm: 12, note: "label.note.cable" },
];
const B_SERIES_ROLLS = sheet([
  [50, 30],
  [40, 30],
  [50, 50],
  [40, 20],
  [30, 15],
]);

export const PROFILES: PrinterProfile[] = [
  niimbot("D110", D_SERIES_ROLLS),
  niimbot("D110_M", D_SERIES_ROLLS),
  niimbot("D11", D_SERIES_ROLLS),
  niimbot("D11S", D_SERIES_ROLLS),
  niimbot("B1", B_SERIES_ROLLS),
  niimbot("B21", B_SERIES_ROLLS),
];

export const DEFAULT_PROFILE = PROFILES[0]!;

export const profileById = (id: string) => PROFILES.find((p) => p.id === id) ?? DEFAULT_PROFILE;
export const profileForModel = (model: string) => PROFILES.find((p) => p.detect.includes(model));
