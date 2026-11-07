import { ipcMain, type WebContents } from "electron";
import type { BluetoothCandidate } from "../shared/api";

/**
 * Electron has no built-in Bluetooth device chooser. While navigator.bluetooth.requestDevice()
 * is pending, Chromium keeps firing select-bluetooth-device with the growing device list;
 * we forward it to the renderer, which shows its own picker and answers via bt:choose.
 */
export function attachBluetoothChooser(contents: WebContents): void {
  let pending: ((deviceId: string) => void) | undefined;

  contents.on("select-bluetooth-device", (event, devices, callback) => {
    event.preventDefault();
    pending = callback;
    const candidates: BluetoothCandidate[] = devices.map((d) => ({ deviceId: d.deviceId, deviceName: d.deviceName }));
    contents.send("bt:candidates", candidates);
  });

  ipcMain.on("bt:choose", (event, deviceId: string | null) => {
    if (event.sender !== contents || !pending) return;
    const answer = pending;
    pending = undefined;
    answer(deviceId ?? "");
  });
}
