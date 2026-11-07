import { create } from "zustand";
import { DOC_VERSION, type ElementKind, type LabelDoc, type LabelElement, type LabelSize } from "../../../shared/doc";
import { elementSpecs } from "./elements/registry";
import { textSummary } from "./elements/text";
import { useSettings } from "../printers/settings";
import { newId } from "./units";

export function newDoc(label: LabelSize): LabelDoc {
  const now = new Date().toISOString();
  return {
    version: DOC_VERSION,
    id: newId(),
    name: "",
    label,
    elements: [elementSpecs.text.create(label)],
    createdAt: now,
    updatedAt: now,
  };
}

/** The user's name for the label, else its first line of text; empty when it has neither. */
export function displayName(doc: Pick<LabelDoc, "name" | "elements">): string {
  if (doc.name.trim()) return doc.name.trim();
  const firstText = doc.elements.find((e) => e.kind === "text");
  return firstText ? textSummary(firstText) : "";
}

type EditorState = {
  doc: LabelDoc;
  selectedId: string | null;
  /** Bumped on every edit; compared with savedRevision to know about unsaved changes. */
  revision: number;
  savedRevision: number;

  open(doc: LabelDoc): void;
  reset(): void;
  markSaved(revision: number): void;
  rename(name: string): void;
  setLabel(label: LabelSize): void;
  add(kind: ElementKind): void;
  update(id: string, patch: Partial<LabelElement>): void;
  remove(id: string): void;
  select(id: string | null): void;
};

export const useEditor = create<EditorState>((set) => {
  const edit = (fn: (doc: LabelDoc) => LabelDoc) =>
    set((s) => ({ doc: { ...fn(s.doc), updatedAt: new Date().toISOString() }, revision: s.revision + 1 }));

  const initial = newDoc(useSettings.getState().profile.defaultLabel);
  return {
    doc: initial,
    selectedId: initial.elements[0]?.id ?? null,
    revision: 0,
    savedRevision: 0,

    open: (doc) => set((s) => ({ doc, selectedId: null, revision: s.revision + 1, savedRevision: s.revision + 1 })),
    reset: () =>
      set((s) => {
        const doc = newDoc(s.doc.label);
        return { doc, selectedId: doc.elements[0]?.id ?? null, revision: s.revision + 1, savedRevision: s.revision + 1 };
      }),
    markSaved: (revision) => set({ savedRevision: revision }),
    rename: (name) => edit((d) => ({ ...d, name })),
    setLabel: (label) =>
      edit((d) => {
        const sx = label.widthMm / d.label.widthMm;
        const sy = label.heightMm / d.label.heightMm;
        const r = (n: number) => Math.round(n * 10) / 10;
        const elements = d.elements.map((e) => ({ ...e, x: r(e.x * sx), y: r(e.y * sy), w: r(e.w * sx), h: r(e.h * sy) }));
        return { ...d, label, elements };
      }),
    add: (kind) => {
      const el = elementSpecs[kind].create(useEditor.getState().doc.label);
      edit((d) => ({ ...d, elements: [...d.elements, el] }));
      set({ selectedId: el.id });
    },
    update: (id, patch) =>
      edit((d) => ({ ...d, elements: d.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as LabelElement) : e)) })),
    remove: (id) => {
      edit((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== id) }));
      set((s) => (s.selectedId === id ? { selectedId: null } : {}));
    },
    select: (selectedId) => set({ selectedId }),
  };
});

export const useSelected = () => useEditor((s) => s.doc.elements.find((e) => e.id === s.selectedId) ?? null);
export const useDirty = () => useEditor((s) => s.revision !== s.savedRevision);
