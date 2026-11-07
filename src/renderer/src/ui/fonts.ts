import { useEffect, useState } from "react";
import { DEFAULT_FONT } from "../model/elements/text";

const FALLBACK = [DEFAULT_FONT, "DejaVu Sans", "Liberation Sans", "Arial", "Segoe UI", "Verdana", "Times New Roman", "Courier New"];

let cache: Promise<string[]> | undefined;

/** Installed font families, via the Local Font Access API when the platform allows it. */
function loadFonts(): Promise<string[]> {
  cache ??= (async () => {
    try {
      const fonts = await window.queryLocalFonts?.();
      if (fonts?.length) return [...new Set(fonts.map((f) => f.family))].sort((a, b) => a.localeCompare(b));
    } catch (err) {
      console.warn("queryLocalFonts failed:", err);
    }
    return FALLBACK;
  })();
  return cache;
}

export function useFonts(): string[] {
  const [fonts, setFonts] = useState<string[]>(FALLBACK);
  useEffect(() => {
    void loadFonts().then(setFonts);
  }, []);
  return fonts;
}
