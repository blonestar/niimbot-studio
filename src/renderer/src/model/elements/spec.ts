import type { LabelElement, LabelSize } from "../../../../shared/doc";
import type { MessageKey } from "../../i18n";

/**
 * Everything the app needs to know about one element kind. Elements are laid out in mm;
 * render() draws onto a white, print-sized canvas at `dpmm` dots per millimetre.
 */
export type ElementSpec<E extends LabelElement> = {
  kind: E["kind"];
  title: MessageKey;
  create(label: LabelSize): E;
  render(ctx: CanvasRenderingContext2D, el: E, dpmm: number): void;
};
