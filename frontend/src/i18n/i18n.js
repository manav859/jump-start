// Frontend i18n bootstrap.
//
// Phase 1 scope (groundwork only): English (en) is the default;
// Gujarati (gu) is registered as the first regional locale so the
// nav-bar language toggle has somewhere to switch to. Page-level
// content is NOT translated yet — only the navigation strings live
// in the `common` namespace. New strings should land in
// `locales/<lang>/common.json` until we shard into per-page
// namespaces.
//
// Persistence: the chosen language is stored in localStorage under
// `jumpstart.lang` so a refresh keeps the student's preference.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import guCommon from "./locales/gu/common.json";

export const SUPPORTED_LANGUAGES = ["en", "gu"];
export const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "jumpstart.lang";

const readStoredLanguage = () => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    // localStorage may be unavailable (SSR / private mode). Fall back
    // to the default — non-fatal.
  }
  return DEFAULT_LANGUAGE;
};

// Reflect the active language on the <html> element so CSS selectors
// like `:lang(gu)` and screen readers pick up the change. The init
// call below sets it on first load; setLanguage() keeps it in sync
// when the user toggles via the nav.
const syncHtmlLang = (lang) => {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.lang = lang;
  } catch {
    // Document may not be available (SSR); non-fatal.
  }
};

const initialLanguage = readStoredLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    gu: { common: guCommon },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    // React already escapes — no need for i18next to do it again.
    escapeValue: false,
  },
});

syncHtmlLang(initialLanguage);

export const setLanguage = (lang) => {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  i18n.changeLanguage(lang);
  syncHtmlLang(lang);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  } catch {
    // Storage failure is non-fatal; the in-memory change still applies.
  }
};

export default i18n;
