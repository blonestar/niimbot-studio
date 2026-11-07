import { app, BrowserWindow } from "electron";
import electronUpdater from "electron-updater";
import type { UpdateState } from "../shared/settings";
import { getSettings, onSettingsChanged } from "./settings";

const { autoUpdater } = electronUpdater;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;
/** macOS only installs updates into a signed app; ours is not signed yet. */
const CAN_INSTALL = process.platform !== "darwin";

let state: UpdateState = app.isPackaged ? { kind: "idle" } : { kind: "unsupported", reason: "dev" };
let timer: NodeJS.Timeout | undefined;

/** electron-updater errors carry full HTTP dumps; the user needs one line, the log keeps the rest. */
function failed(err: unknown): UpdateState {
  const message = err instanceof Error ? err.message : String(err);
  if (/\b404\b/.test(message)) return { kind: "noReleases" };
  return { kind: "error", message: (message.split("\n")[0] ?? message).slice(0, 200) };
}

function set(next: UpdateState): void {
  state = next;
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send("updater:state", state);
}

export const getUpdateState = () => state;

export async function checkForUpdates(): Promise<void> {
  if (state.kind === "unsupported" || state.kind === "checking" || state.kind === "downloading") return;
  autoUpdater.allowPrerelease = getSettings().updates.beta;
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    set(failed(err));
  }
}

export function installUpdate(): void {
  if (state.kind === "ready") autoUpdater.quitAndInstall();
}

function schedule(): void {
  clearInterval(timer);
  timer = undefined;
  if (!getSettings().updates.auto) return;
  void checkForUpdates();
  timer = setInterval(() => void checkForUpdates(), CHECK_EVERY_MS);
}

/**
 * Updates come from GitHub Releases (see electron-builder.yml). A found update is downloaded
 * in the background and installed the next time the app quits, or right away on request.
 */
export function initUpdater(): void {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = CAN_INSTALL;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("checking-for-update", () => set({ kind: "checking" }));
  autoUpdater.on("update-not-available", () => set({ kind: "upToDate", checkedAt: new Date().toISOString() }));
  autoUpdater.on("update-available", (info) =>
    set(CAN_INSTALL ? { kind: "downloading", version: info.version, percent: 0 } : { kind: "available", version: info.version }),
  );
  autoUpdater.on("download-progress", (p) => {
    if (state.kind === "downloading") set({ ...state, percent: Math.round(p.percent) });
  });
  autoUpdater.on("update-downloaded", (info) => set({ kind: "ready", version: info.version }));
  autoUpdater.on("error", (err) => set(failed(err)));

  let auto = getSettings().updates.auto;
  onSettingsChanged((s) => {
    if (s.updates.auto !== auto) {
      auto = s.updates.auto;
      schedule();
    }
  });
  schedule();
}
