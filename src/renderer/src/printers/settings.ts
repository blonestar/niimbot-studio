import { create } from "zustand";
import { DEFAULT_PROFILE, profileById } from "./profiles";
import type { PrinterProfile } from "./types";

type Settings = { profile: PrinterProfile; setProfile(id: string): void };

export const useSettings = create<Settings>((set) => ({
  profile: profileById(window.api.settings.initial.profileId ?? DEFAULT_PROFILE.id),
  setProfile(id) {
    set({ profile: profileById(id) });
    void window.api.settings.update({ profileId: id });
  },
}));

export const useProfile = () => useSettings((s) => s.profile);
