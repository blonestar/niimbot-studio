/**
 * A label design. All geometry is in millimetres, measured on the label as the
 * user sees it in the editor (width runs along the feed direction).
 * Bump DOC_VERSION and add a migration in library/migrate when the shape changes.
 */
export const DOC_VERSION = 1;

export type LabelSize = { widthMm: number; heightMm: number };

export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "middle" | "bottom";

type ElementBase = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TextElement = ElementBase & {
  kind: "text";
  text: string;
  fontFamily: string;
  /** Font size in typographic points. Ignored for drawing when autoFit is on. */
  fontSizePt: number;
  /** Shrink or grow the font so the text fills the box. */
  autoFit: boolean;
  bold: boolean;
  italic: boolean;
  align: HAlign;
  vAlign: VAlign;
  /** Line height as a multiple of the font size. */
  lineHeight: number;
};

/** Add new element kinds (image, barcode, qr, ...) to this union and to the element registry. */
export type LabelElement = TextElement;
export type ElementKind = LabelElement["kind"];

export type LabelDoc = {
  version: typeof DOC_VERSION;
  id: string;
  name: string;
  label: LabelSize;
  elements: LabelElement[];
  createdAt: string;
  updatedAt: string;
};

/** What the library knows about a saved label without loading it. */
export type DocSummary = {
  id: string;
  name: string;
  label: LabelSize;
  updatedAt: string;
  lastPrintedAt?: string;
  thumbnail?: string;
};

/** On-disk record: the document plus library metadata. */
export type StoredDoc = {
  doc: LabelDoc;
  thumbnail?: string;
  lastPrintedAt?: string;
};
