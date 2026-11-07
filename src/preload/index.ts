import { contextBridge, ipcRenderer } from "electron";
import type { Api, AppInfo, BluetoothCandidate } from "../shared/api";
import type { AppSettings, UpdateState } from "../shared/settings";

const boot = ipcRenderer.sendSync("app:boot") as { info: AppInfo; settings: AppSettings };

const api: Api = {
  app: boot.info,
  settings: {
    initial: boot.settings,
    update: (patch) => ipcRenderer.invoke("settings:update", patch),
  },
  updater: {
    state: () => ipcRenderer.invoke("updater:state"),
    onState(listener) {
      const handler = (_e: unknown, s: UpdateState) => listener(s);
      ipcRenderer.on("updater:state", handler);
      return () => ipcRenderer.off("updater:state", handler);
    },
    check: () => ipcRenderer.invoke("updater:check"),
    install: () => ipcRenderer.send("updater:install"),
  },
  openExternal: (url) => ipcRenderer.send("app:openExternal", url),
  library: {
    list: () => ipcRenderer.invoke("library:list"),
    load: (id) => ipcRenderer.invoke("library:load", id),
    save: (doc, thumbnail) => ipcRenderer.invoke("library:save", doc, thumbnail),
    markPrinted: (id) => ipcRenderer.invoke("library:markPrinted", id),
    remove: (id) => ipcRenderer.invoke("library:remove", id),
    reveal: () => ipcRenderer.invoke("library:reveal"),
  },
  bluetooth: {
    onCandidates(listener) {
      const handler = (_e: unknown, devices: BluetoothCandidate[]) => listener(devices);
      ipcRenderer.on("bt:candidates", handler);
      return () => ipcRenderer.off("bt:candidates", handler);
    },
    choose: (deviceId) => ipcRenderer.send("bt:choose", deviceId),
  },
};

contextBridge.exposeInMainWorld("api", api);
