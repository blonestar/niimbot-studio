import { create } from "zustand";
import type { AppSettings, UpdateState } from "../../shared/settings";

type UpdatesStore = { state: UpdateState; prefs: AppSettings["updates"]; setPrefs(p: Partial<AppSettings["updates"]>): void };

export const useUpdates = create<UpdatesStore>((set, get) => ({
  state: { kind: "idle" },
  prefs: window.api.settings.initial.updates,
  setPrefs(p) {
    set({ prefs: { ...get().prefs, ...p } });
    void window.api.settings.update({ updates: p });
  },
}));

void window.api.updater.state().then((state) => useUpdates.setState({ state }));
window.api.updater.onState((state) => useUpdates.setState({ state }));
