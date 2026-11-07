export const LOCALE_IDS = ["sr-Latn", "sr-Cyrl", "en"] as const;
export type Locale = (typeof LOCALE_IDS)[number];

export type AppSettings = {
  /** null follows the operating system language. */
  locale: Locale | null;
  profileId: string | null;
  updates: {
    /** Check, download and install new versions without asking. */
    auto: boolean;
    /** Also offer pre-releases (tags like v1.2.0-beta.1). */
    beta: boolean;
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  locale: null,
  profileId: null,
  updates: { auto: true, beta: false },
};

export type SettingsPatch = Partial<Omit<AppSettings, "updates">> & { updates?: Partial<AppSettings["updates"]> };

export type UpdateState =
  | { kind: "unsupported"; reason: "dev" }
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "upToDate"; checkedAt: string }
  /** Found, but this install cannot update itself (unsigned macOS app): download it from the release page. */
  | { kind: "available"; version: string }
  | { kind: "downloading"; version: string; percent: number }
  | { kind: "ready"; version: string }
  | { kind: "noReleases" }
  | { kind: "error"; message: string };
