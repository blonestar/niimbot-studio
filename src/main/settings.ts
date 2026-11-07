import { app } from "electron";
import { readFileSync } from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DEFAULT_SETTINGS, LOCALE_IDS, type AppSettings, type SettingsPatch } from "../shared/settings";

const file = () => join(app.getPath("userData"), "settings.json");

/** Accept only known fields with the right types; anything else falls back to the default. */
function parse(raw: unknown): AppSettings {
  const r = (raw ?? {}) as Partial<AppSettings>;
  const u = (r.updates ?? {}) as Partial<AppSettings["updates"]>;
  return {
    locale: LOCALE_IDS.includes(r.locale as never) ? (r.locale as AppSettings["locale"]) : DEFAULT_SETTINGS.locale,
    profileId: typeof r.profileId === "string" ? r.profileId : DEFAULT_SETTINGS.profileId,
    updates: {
      auto: typeof u.auto === "boolean" ? u.auto : DEFAULT_SETTINGS.updates.auto,
      beta: typeof u.beta === "boolean" ? u.beta : DEFAULT_SETTINGS.updates.beta,
    },
  };
}

let current: AppSettings | undefined;
const listeners = new Set<(s: AppSettings) => void>();

export function getSettings(): AppSettings {
  if (!current) {
    try {
      current = parse(JSON.parse(readFileSync(file(), "utf8")));
    } catch {
      current = parse(undefined);
    }
  }
  return current;
}

export async function updateSettings(patch: SettingsPatch): Promise<AppSettings> {
  const prev = getSettings();
  current = parse({ ...prev, ...patch, updates: { ...prev.updates, ...patch.updates } });
  const tmp = `${file()}.tmp`;
  await writeFile(tmp, JSON.stringify(current, null, 2), "utf8");
  await rename(tmp, file());
  for (const l of listeners) l(current);
  return current;
}

export function onSettingsChanged(listener: (s: AppSettings) => void): void {
  listeners.add(listener);
}
