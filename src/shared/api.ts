import type { DocSummary, LabelDoc } from "./doc";
import type { AppSettings, SettingsPatch, UpdateState } from "./settings";

export type BluetoothCandidate = { deviceId: string; deviceName: string };

/** The API the preload script exposes to the renderer as `window.api`. */
export type AppInfo = { version: string; platform: NodeJS.Platform };

export type Api = {
  app: AppInfo;
  settings: {
    /** Read synchronously at startup so the first render already has the right language and printer. */
    initial: AppSettings;
    update(patch: SettingsPatch): Promise<AppSettings>;
  };
  updater: {
    state(): Promise<UpdateState>;
    onState(listener: (state: UpdateState) => void): () => void;
    check(): Promise<void>;
    install(): void;
  };
  library: {
    list(): Promise<DocSummary[]>;
    load(id: string): Promise<LabelDoc>;
    save(doc: LabelDoc, thumbnail: string): Promise<void>;
    markPrinted(id: string): Promise<void>;
    remove(id: string): Promise<void>;
    reveal(): Promise<void>;
  };
  openExternal(url: string): void;
  bluetooth: {
    /** Called repeatedly while the OS is scanning; the list grows as devices appear. */
    onCandidates(listener: (devices: BluetoothCandidate[]) => void): () => void;
    /** Pick a candidate, or pass null to cancel the pending requestDevice(). */
    choose(deviceId: string | null): void;
  };
};
