import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import { join } from "node:path";
import icon from "../../build/icon.png?asset";
import type { LabelDoc } from "../shared/doc";
import { attachBluetoothChooser } from "./bluetooth";
import { library } from "./library";
import { getSettings, updateSettings } from "./settings";
import { checkForUpdates, getUpdateState, initUpdater, installUpdate } from "./updater";
import type { SettingsPatch } from "../shared/settings";

// Web Bluetooth on Linux is still behind Chromium's experimental flag.
if (process.platform === "linux") {
  app.commandLine.appendSwitch("enable-experimental-web-platform-features");
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    title: "Niimbot Studio",
    icon,
    backgroundColor: "#f4f4f2",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
    },
  });

  attachBluetoothChooser(win.webContents);

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

const PROJECT_URL = "https://github.com/blonestar/niimbot-studio";

function registerIpc(): void {
  ipcMain.on("app:boot", (e) => {
    e.returnValue = { info: { version: app.getVersion(), platform: process.platform }, settings: getSettings() };
  });
  ipcMain.handle("settings:update", (_e, patch: SettingsPatch) => updateSettings(patch));
  ipcMain.handle("updater:state", () => getUpdateState());
  ipcMain.handle("updater:check", () => checkForUpdates());
  ipcMain.on("updater:install", () => installUpdate());
  ipcMain.on("app:openExternal", (_e, url: string) => {
    if (typeof url === "string" && url.startsWith(PROJECT_URL)) void shell.openExternal(url);
  });
  ipcMain.handle("library:list", () => library.list());
  ipcMain.handle("library:load", (_e, id: string) => library.load(id));
  ipcMain.handle("library:save", (_e, doc: LabelDoc, thumbnail: string) => library.save(doc, thumbnail));
  ipcMain.handle("library:markPrinted", (_e, id: string) => library.markPrinted(id));
  ipcMain.handle("library:remove", (_e, id: string) => library.remove(id));
  ipcMain.handle("library:reveal", () => library.reveal());
}

void app.whenReady().then(() => {
  const allowed = new Set(["local-fonts", "bluetooth"]);
  session.defaultSession.setPermissionRequestHandler((_wc, permission, done) => done(allowed.has(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));

  registerIpc();
  createWindow();
  initUpdater();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
