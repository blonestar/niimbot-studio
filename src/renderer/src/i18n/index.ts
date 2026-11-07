import { create } from "zustand";
import type { Locale } from "../../../shared/settings";
import { toCyrillic } from "./cyrillic";
import { en } from "./en";
import { sr, type MessageKey, type Messages } from "./sr";

export type { Locale, MessageKey };

export const LOCALES: { id: Locale; name: string }[] = [
  { id: "sr-Latn", name: "Srpski (latinica)" },
  { id: "sr-Cyrl", name: "Српски (ћирилица)" },
  { id: "en", name: "English" },
];

const cyrillic = Object.fromEntries(
  Object.entries(sr).map(([k, v]) => [
    k,
    v
      .split(/(\{\w+\})/)
      .map((part) => (part.startsWith("{") ? part : toCyrillic(part)))
      .join(""),
  ]),
) as Messages;

const CATALOGS: Record<Locale, Messages> = { "sr-Latn": sr, "sr-Cyrl": cyrillic, en };

function systemLocale(): Locale {
  const sys = navigator.language.toLowerCase();
  if (sys.startsWith("sr")) return sys.includes("cyrl") ? "sr-Cyrl" : "sr-Latn";
  return /^(hr|bs|sh|cnr)/.test(sys) ? "sr-Latn" : "en";
}

type Params = Record<string, string | number>;

function format(locale: Locale, key: MessageKey, params?: Params): string {
  const template = CATALOGS[locale][key];
  return params ? template.replace(/\{(\w+)\}/g, (m, name: string) => String(params[name] ?? m)) : template;
}

type I18nState = {
  /** What the user picked; null follows the system language. */
  choice: Locale | null;
  locale: Locale;
  setLocale(choice: Locale | null): void;
};

const initialChoice = window.api.settings.initial.locale;

export const useI18n = create<I18nState>((set) => ({
  choice: initialChoice,
  locale: initialChoice ?? systemLocale(),
  setLocale(choice) {
    set({ choice, locale: choice ?? systemLocale() });
    void window.api.settings.update({ locale: choice });
  },
}));

const applyLang = (locale: Locale) => (document.documentElement.lang = locale);
applyLang(useI18n.getState().locale);
useI18n.subscribe((s) => applyLang(s.locale));

export type Translate = (key: MessageKey, params?: Params) => string;

/** For components: re-renders when the language changes. */
export function useT(): Translate {
  const locale = useI18n((s) => s.locale);
  return (key, params) => format(locale, key, params);
}

/** For code outside React (errors, confirm dialogs). */
export const t: Translate = (key, params) => format(useI18n.getState().locale, key, params);

/** An error whose message is a translation key, so it is shown in the user's language. */
export class AppError extends Error {
  constructor(readonly key: MessageKey) {
    super(sr[key]);
  }
}
