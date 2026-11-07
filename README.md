# Niimbot Studio

Desktop app to design and print labels on NIIMBOT thermal printers over Bluetooth. It runs on
Windows and Linux, and its interface is in Serbian (Latin and Cyrillic) and English.

## Develop

```sh
npm install
npm run dev
```

If Electron fails to start with "Electron uninstall", run `node node_modules/electron/install.js`.

## Project layout

| Path | Contents |
| --- | --- |
| `src/shared/` | Types shared by the main process and the UI: the label document, settings, IPC API |
| `src/main/` | Electron main process: window, Bluetooth device chooser, label library, settings, updater |
| `src/renderer/src/model/` | The label editor state and the element kinds (`elements/registry.ts`) |
| `src/renderer/src/printers/` | Printer models (`profiles.ts`) and drivers (`niimbot.ts`) |
| `src/renderer/src/i18n/` | Translations. `sr.ts` is the source; Cyrillic is generated from it |

### Add a printer model

Add a profile to `src/renderer/src/printers/profiles.ts` with its label rolls. For a printer
brand that NIIMBOT's protocol does not cover, implement `PrinterDriver` from `printers/types.ts`.

### Add a language

Copy `src/renderer/src/i18n/en.ts`, translate it, and register it in `i18n/index.ts`.

## Release

See [RELEASING.md](RELEASING.md).
