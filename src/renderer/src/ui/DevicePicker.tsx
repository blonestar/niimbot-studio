import { useEffect, useState } from "react";
import type { BluetoothCandidate } from "../../../shared/api";
import { useT } from "../i18n";
import { useConnection } from "../printers/connection";

const REMEMBERED = "niimbot.lastPrinterName";

function remembered(): string | null {
  try {
    return localStorage.getItem(REMEMBERED);
  } catch {
    return null;
  }
}

function remember(name: string) {
  try {
    localStorage.setItem(REMEMBERED, name);
  } catch {
    /* only a convenience */
  }
}

/**
 * Shown while a Bluetooth scan is running. The last used printer is picked automatically
 * as soon as the scan sees it; otherwise the user chooses from the list.
 */
export function DevicePicker() {
  const connecting = useConnection((s) => s.status === "connecting");
  const [devices, setDevices] = useState<BluetoothCandidate[]>([]);
  const t = useT();

  useEffect(() => {
    if (!connecting) {
      setDevices([]);
      return;
    }
    const last = remembered();
    return window.api.bluetooth.onCandidates((list) => {
      const known = last && list.find((d) => d.deviceName === last);
      if (known) {
        window.api.bluetooth.choose(known.deviceId);
        setDevices([]);
      } else {
        setDevices(list);
      }
    });
  }, [connecting]);

  if (!connecting) return null;

  const choose = (d: BluetoothCandidate) => {
    remember(d.deviceName);
    window.api.bluetooth.choose(d.deviceId);
    setDevices([]);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{t("printer.pickTitle")}</h2>
        <p className="hint">{t("printer.pickHint")}</p>
        {devices.length === 0 ? (
          <p className="scanning">{t("printer.scanning")}</p>
        ) : (
          <ul className="device-list">
            {devices.map((d) => (
              <li key={d.deviceId}>
                <button onClick={() => choose(d)}>
                  <strong>{d.deviceName || t("printer.unknownDevice")}</strong>
                  <small>{d.deviceId}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="row end">
          <button onClick={() => window.api.bluetooth.choose(null)}>{t("printer.cancel")}</button>
        </div>
      </div>
    </div>
  );
}
