import type { LabelSize } from "../../../shared/doc";
import type { MessageKey } from "../i18n";

export type PrintDirection = "left" | "top";

export type LabelPreset = LabelSize & { id: string; note?: MessageKey };

/**
 * One printer model: its print geometry and the label rolls sold for it.
 * Add a model by adding a profile to profiles.ts; add a brand by writing a driver.
 */
export type PrinterProfile = {
  id: string;
  vendor: string;
  name: string;
  driver: DriverId;
  dpi: number;
  printheadPx: number;
  /** "left": the head runs across the label height and the image is rotated 90° clockwise; "top": across the width. */
  printDirection: PrintDirection;
  density: { min: number; max: number; default: number };
  labels: LabelPreset[];
  /** Model names the driver reports, used to pick this profile automatically on connect. */
  detect: string[];
};

export type DriverId = "niimbot";

export type ConnectedPrinter = { name: string; model: string; battery?: number };

export type PrintRequest = { canvas: HTMLCanvasElement; copies: number; density: number; profile: PrinterProfile };

export type DriverEvents = {
  onDisconnect(): void;
  onBattery(percent: number): void;
  onProgress(fraction: number): void;
};

/** What the app needs from a printer brand's protocol implementation. */
export type PrinterDriver = {
  connect(): Promise<ConnectedPrinter>;
  disconnect(): Promise<void>;
  print(req: PrintRequest): Promise<void>;
};

export const dotsPerMm = (p: PrinterProfile) => p.dpi / 25.4;
export const printheadMm = (p: PrinterProfile) => p.printheadPx / dotsPerMm(p);

/** The label dimension that lies across the print head. */
export const acrossHeadMm = (p: PrinterProfile, label: LabelSize) => (p.printDirection === "left" ? label.heightMm : label.widthMm);

/** Rolls are named the way they are sold: across the head × along the feed. */
export function rollSize(p: PrinterProfile, label: LabelSize): string {
  const across = acrossHeadMm(p, label);
  const along = p.printDirection === "left" ? label.widthMm : label.heightMm;
  return `${across} × ${along}`;
}
