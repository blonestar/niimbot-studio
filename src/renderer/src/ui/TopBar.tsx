import { useT } from "../i18n";
import { saveCurrent } from "../library/library";
import { displayName, useDirty, useEditor } from "../model/editor";
import { PrinterStatus } from "./PrinterStatus";

type Props = { onSettings(): void };

export function TopBar({ onSettings }: Props) {
  const doc = useEditor((s) => s.doc);
  const dirty = useDirty();
  const { rename, reset } = useEditor.getState();
  const t = useT();

  return (
    <header className="topbar">
      <div className="brand">Niimbot Studio</div>
      <div className="doc-controls">
        <button onClick={() => (!dirty || confirm(t("app.discardChanges"))) && reset()}>{t("app.new")}</button>
        <input
          className="doc-name"
          value={doc.name}
          placeholder={displayName(doc) || t("app.untitled")}
          onChange={(e) => rename(e.target.value)}
        />
        <button onClick={() => void saveCurrent()} title={t("app.saveHint", { shortcut: "Ctrl+S" })}>
          {t("app.save")}
          {dirty ? " •" : ""}
        </button>
      </div>
      <PrinterStatus />
      <button className="icon-button" onClick={onSettings} title={t("app.settings")}>
        ⚙
      </button>
    </header>
  );
}
