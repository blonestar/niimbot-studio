import { useEffect, useMemo, useState } from "react";
import type { DocSummary } from "../../../shared/doc";
import { useI18n, useT } from "../i18n";
import { openFromLibrary, refreshLibrary, removeFromLibrary, useLibrary } from "../library/library";
import { useDirty, useEditor } from "../model/editor";
import { useProfile } from "../printers/settings";
import { rollSize } from "../printers/types";

export function LibraryPanel() {
  const { items, error } = useLibrary();
  const currentId = useEditor((s) => s.doc.id);
  const dirty = useDirty();
  const profile = useProfile();
  const locale = useI18n((s) => s.locale);
  const t = useT();
  const [query, setQuery] = useState("");
  const fmt = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
    return (iso: string) => f.format(new Date(iso));
  }, [locale]);

  useEffect(() => {
    void refreshLibrary();
  }, []);

  const open = (item: DocSummary) => {
    if (item.id === currentId) return;
    if (dirty && !confirm(t("app.discardChanges"))) return;
    void openFromLibrary(item.id);
  };

  const q = query.trim().toLowerCase();
  const shown = items.filter((i) => i.name.toLowerCase().includes(q));

  return (
    <aside className="library">
      <div className="library-head">
        <h2>{t("library.title")}</h2>
        <input type="search" placeholder={t("library.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <p className="hint">{t("library.empty", { shortcut: "Ctrl+S" })}</p>}
      <ul className="library-list">
        {shown.map((item) => (
          <li key={item.id} className={item.id === currentId ? "current" : ""}>
            <button className="library-item" onClick={() => open(item)}>
              {item.thumbnail && <img src={item.thumbnail} alt="" />}
              <span className="library-name">{item.name || t("app.untitled")}</span>
              <small>
                {rollSize(profile, item.label)} {t("unit.mm")} · {fmt(item.updatedAt)}
                {item.lastPrintedAt && <> · {t("library.printed", { date: fmt(item.lastPrintedAt) })}</>}
              </small>
            </button>
            <button
              className="icon"
              title={t("library.delete")}
              onClick={() => confirm(t("library.confirmDelete", { name: item.name })) && void removeFromLibrary(item.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button className="link" onClick={() => void window.api.library.reveal()}>
        {t("library.reveal")}
      </button>
    </aside>
  );
}
