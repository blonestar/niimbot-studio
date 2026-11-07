import { useMemo, type ReactNode } from "react";
import type { UpdateState } from "../../../shared/settings";
import { LOCALES, useI18n, useT, type Locale, type Translate } from "../i18n";
import { useEditor } from "../model/editor";
import { useConnection } from "../printers/connection";
import { PROFILES } from "../printers/profiles";
import { useSettings } from "../printers/settings";
import { printheadMm, rollSize } from "../printers/types";
import { useUpdates } from "../updates";

const PROJECT_URL = "https://github.com/blonestar/niimbot-studio";
const vendors = [...new Set(PROFILES.map((p) => p.vendor))];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function GeneralSection() {
  const { choice, setLocale } = useI18n();
  const t = useT();
  return (
    <Section title={t("settings.general")}>
      <label className="field">
        <span>{t("settings.language")}</span>
        <select value={choice ?? "system"} onChange={(e) => setLocale(e.target.value === "system" ? null : (e.target.value as Locale))}>
          <option value="system">{t("settings.systemLanguage")}</option>
          {LOCALES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
    </Section>
  );
}

function PrinterSection() {
  const { profile, setProfile } = useSettings();
  const connected = useConnection((s) => s.status === "connected");
  const t = useT();

  const choose = (id: string) => {
    setProfile(id);
    const next = useSettings.getState().profile;
    const { doc, setLabel } = useEditor.getState();
    const fits = next.labels.some((l) => l.widthMm === doc.label.widthMm && l.heightMm === doc.label.heightMm);
    const roll = next.labels[0];
    if (roll && !fits) setLabel({ widthMm: roll.widthMm, heightMm: roll.heightMm });
  };

  return (
    <Section title={t("settings.printer")}>
      <label className="field">
        <span>{t("settings.model")}</span>
        <select value={profile.id} disabled={connected} onChange={(e) => choose(e.target.value)}>
          {vendors.map((v) => (
            <optgroup key={v} label={v}>
              {PROFILES.filter((p) => p.vendor === v).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {connected && <p className="hint">{t("settings.autoModel")}</p>}
      <dl className="specs">
        <dt>{t("settings.resolution")}</dt>
        <dd>{profile.dpi} dpi</dd>
        <dt>{t("settings.head")}</dt>
        <dd>{t("settings.headValue", { mm: printheadMm(profile).toFixed(1), dots: profile.printheadPx })}</dd>
        <dt>{t("settings.density")}</dt>
        <dd>
          {profile.density.min}–{profile.density.max}
        </dd>
        <dt>{t("settings.rolls")}</dt>
        <dd>{profile.labels.map((l) => `${rollSize(profile, l)} ${t("unit.mm")}`).join(", ")}</dd>
      </dl>
    </Section>
  );
}

function describeUpdate(s: UpdateState, t: Translate, fmt: (iso: string) => string): string {
  switch (s.kind) {
    case "unsupported":
      return t("update.unsupported");
    case "idle":
      return t("update.idle");
    case "checking":
      return t("update.checking");
    case "upToDate":
      return t("update.upToDate", { date: fmt(s.checkedAt) });
    case "downloading":
      return t("update.downloading", { version: s.version, percent: s.percent });
    case "ready":
      return t("update.ready", { version: s.version });
    case "noReleases":
      return t("update.noReleases");
    case "error":
      return t("update.error", { message: s.message });
  }
}

function UpdatesSection() {
  const { state, prefs, setPrefs } = useUpdates();
  const locale = useI18n((s) => s.locale);
  const t = useT();
  const fmt = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
    return (iso: string) => f.format(new Date(iso));
  }, [locale]);
  const busy = state.kind === "checking" || state.kind === "downloading";

  return (
    <Section title={t("settings.updates")}>
      <p className="version">{t("settings.version", { version: window.api.app.version })}</p>
      <label className="check">
        <input type="checkbox" checked={prefs.auto} onChange={(e) => setPrefs({ auto: e.target.checked })} />
        {t("settings.autoUpdate")}
      </label>
      <label className="check">
        <input type="checkbox" checked={prefs.beta} onChange={(e) => setPrefs({ beta: e.target.checked })} />
        {t("settings.beta")}
      </label>
      <p className={state.kind === "error" ? "error" : "hint"}>{describeUpdate(state, t, fmt)}</p>
      <div className="row">
        <button disabled={busy || state.kind === "unsupported"} onClick={() => void window.api.updater.check()}>
          {t("settings.checkNow")}
        </button>
        {state.kind === "ready" && (
          <button className="primary" onClick={() => window.api.updater.install()}>
            {t("settings.installNow")}
          </button>
        )}
      </div>
    </Section>
  );
}

function AboutSection() {
  const t = useT();
  return (
    <Section title={t("settings.about")}>
      <p>
        <strong>Niimbot Studio</strong> {window.api.app.version}
      </p>
      <p className="hint">{t("settings.license", { license: "MIT" })}</p>
      <div className="row">
        <button className="link" onClick={() => window.api.openExternal(PROJECT_URL)}>
          {t("settings.project")}
        </button>
        <button className="link" onClick={() => void window.api.library.reveal()}>
          {t("library.reveal")}
        </button>
      </div>
    </Section>
  );
}

export function SettingsPage({ onClose }: { onClose(): void }) {
  const t = useT();
  return (
    <div className="settings-page">
      <div className="settings-inner">
        <div className="settings-head">
          <button className="link" onClick={onClose}>
            {t("settings.back")}
          </button>
          <h1>{t("app.settings")}</h1>
        </div>
        <GeneralSection />
        <PrinterSection />
        <UpdatesSection />
        <AboutSection />
      </div>
    </div>
  );
}
