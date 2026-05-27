// Frontend i18n bootstrap.
//
// Current scope: site UI is English-only. The Gujarati locale resources
// and the SUPPORTED_LANGUAGES list are kept in place so the language
// toggle can be reinstated without re-instrumenting the pages — but the
// active language is hard-locked to `en` here, and `setLanguage()` is
// a no-op. The header toggle has been removed.
//
// Gujarati assessment content (the 500-question bank) is delivered as
// a separate test package whose `text` / `options` fields already carry
// the Gujarati strings — it does NOT depend on i18n locale switching.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import guCommon from "./locales/gu/common.json";

export const SUPPORTED_LANGUAGES = ["en", "gu"];
export const DEFAULT_LANGUAGE = "en";
// Storage key retained so a prior `gu` preference doesn't keep
// resurfacing — we clear it on bootstrap below.
const STORAGE_KEY = "jumpstart.lang";

// Reflect the active language on the <html> element so CSS selectors
// like `:lang(en)` and screen readers pick up the locale. Locked to
// English now that the toggle is gone.
const syncHtmlLang = (lang) => {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.lang = lang;
  } catch {
    // Document may not be available (SSR); non-fatal.
  }
};

// Clear any persisted preference from when the toggle existed — keeps
// returning users from being stuck in a locale the UI can no longer
// surface.
try {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
} catch {
  // Storage may be unavailable; non-fatal.
}

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    gu: { common: guCommon },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    // React already escapes — no need for i18next to do it again.
    escapeValue: false,
  },
});

syncHtmlLang(DEFAULT_LANGUAGE);

// Kept exported so future code that imports it doesn't break, but the
// function is a no-op while the site is English-only. If you want to
// re-enable the toggle, restore the original body and wire the header
// language switcher back on.
export const setLanguage = (_lang) => {
  // intentional no-op
};

export default i18n;
