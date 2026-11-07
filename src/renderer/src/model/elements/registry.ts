import type { ElementKind, LabelElement } from "../../../../shared/doc";
import type { ElementSpec } from "./spec";
import { textSpec } from "./text";

type Registry = { [K in ElementKind]: ElementSpec<Extract<LabelElement, { kind: K }>> };

export const elementSpecs: Registry = {
  text: textSpec,
};

export function specFor<E extends LabelElement>(el: E): ElementSpec<E> {
  return elementSpecs[el.kind as ElementKind] as unknown as ElementSpec<E>;
}
