import { useT } from "../i18n";
import { connectPrinter, describeError, disconnectPrinter, useConnection } from "../printers/connection";

export function PrinterStatus() {
  const state = useConnection();
  const t = useT();
  if (state.status === "connected") {
    return (
      <div className="printer-status">
        <span className="dot ok" />
        <span className="printer-name">{state.printer.name}</span>
        {state.printer.battery !== undefined && <span className="battery">🔋 {state.printer.battery}%</span>}
        {state.job && <span className="busy">{t("printer.printing")}</span>}
        <button onClick={() => void disconnectPrinter()} disabled={!!state.job}>
          {t("printer.disconnect")}
        </button>
      </div>
    );
  }
  if (state.status === "connecting") {
    return (
      <div className="printer-status">
        <span className="dot wait" />
        <span>{t("printer.connecting")}</span>
      </div>
    );
  }
  const error = state.error === undefined ? undefined : describeError(state.error);
  return (
    <div className="printer-status">
      <span className="dot off" />
      <span className={error ? "error" : ""} title={error}>
        {error ?? t("printer.notConnected")}
      </span>
      <button className="primary" onClick={() => void connectPrinter()}>
        {t("printer.connect")}
      </button>
    </div>
  );
}
