import { useEffect, useState } from "react";
import { saveCurrent } from "./library/library";
import { elementSpecs } from "./model/elements/registry";
import { useEditor } from "./model/editor";
import { useT } from "./i18n";
import { DevicePicker } from "./ui/DevicePicker";
import { Inspector } from "./ui/Inspector";
import { LabelCanvas } from "./ui/LabelCanvas";
import { LabelSizePicker } from "./ui/LabelSizePicker";
import { LibraryPanel } from "./ui/LibraryPanel";
import { PrintPanel } from "./ui/PrintPanel";
import { SettingsPage } from "./ui/SettingsPage";
import { TopBar } from "./ui/TopBar";

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && t.closest("input, textarea, select") !== null;

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveCurrent();
        return;
      }
      if (isTyping(e.target)) return;
      const { selectedId, doc, update, remove } = useEditor.getState();
      const el = doc.elements.find((x) => x.id === selectedId);
      if (!el) return;
      const step = e.shiftKey ? 1 : 0.1;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const d = nudge[e.key];
      if (d) {
        e.preventDefault();
        update(el.id, { x: Math.round((el.x + d[0]) * 10) / 10, y: Math.round((el.y + d[1]) * 10) / 10 });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        remove(el.id);
      } else if (e.key === "Enter" && el.kind === "text") {
        e.preventDefault();
        document.getElementById("text-input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function App() {
  useShortcuts();
  const add = useEditor((s) => s.add);
  const t = useT();
  const [view, setView] = useState<"editor" | "settings">("editor");

  return (
    <div className="app">
      <TopBar onSettings={() => setView((v) => (v === "settings" ? "editor" : "settings"))} />
      {view === "settings" ? (
        <SettingsPage onClose={() => setView("editor")} />
      ) : (
        <div className="workspace">
          <LibraryPanel />
          <main className="editor">
            <div className="toolbar">
              <LabelSizePicker />
              <div className="add-buttons">
                {Object.values(elementSpecs).map((spec) => (
                  <button key={spec.kind} onClick={() => add(spec.kind)}>
                    {t("app.add", { what: t(spec.title) })}
                  </button>
                ))}
              </div>
            </div>
            <LabelCanvas />
          </main>
          <aside className="sidebar">
            <section>
              <h2>{t("inspector.title")}</h2>
              <Inspector />
            </section>
            <section>
              <h2>{t("print.title")}</h2>
              <PrintPanel />
            </section>
          </aside>
        </div>
      )}
      <DevicePicker />
    </div>
  );
}
