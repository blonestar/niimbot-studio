import { create } from "zustand";
import type { DocSummary } from "../../../shared/doc";
import { displayName, useEditor } from "../model/editor";
import { useSettings } from "../printers/settings";
import { dotsPerMm } from "../printers/types";
import { renderLabel } from "../render/renderLabel";

type LibraryState = { items: DocSummary[]; error?: string };

export const useLibrary = create<LibraryState>(() => ({ items: [] }));

export async function refreshLibrary(): Promise<void> {
  try {
    useLibrary.setState({ items: await window.api.library.list(), error: undefined });
  } catch (err) {
    useLibrary.setState({ error: String(err) });
  }
}

/** Save the open label. A label without a name gets one from its first line of text. */
export async function saveCurrent(): Promise<void> {
  const { doc, revision } = useEditor.getState();
  const named = { ...doc, name: displayName(doc) };
  useEditor.setState({ doc: named });
  const thumbnail = renderLabel(named, dotsPerMm(useSettings.getState().profile)).toDataURL("image/png");
  await window.api.library.save(named, thumbnail);
  useEditor.getState().markSaved(revision);
  await refreshLibrary();
}

export async function openFromLibrary(id: string): Promise<void> {
  useEditor.getState().open(await window.api.library.load(id));
}

export async function removeFromLibrary(id: string): Promise<void> {
  await window.api.library.remove(id);
  await refreshLibrary();
}

export async function markPrinted(id: string): Promise<void> {
  await window.api.library.markPrinted(id);
  await refreshLibrary();
}
