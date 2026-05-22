// Look up a localised label for one of the seeded assessment packages.
//
// Package titles, badges, features, descriptions, and duration captions are
// stored in MongoDB in English. Rather than migrate the schema to add
// per-locale columns for the three fixed packages, we keep the API value as
// the English source of truth and resolve a localised override from the
// i18n locale files at render time.
//
// Locale shape (in en/common.json + gu/common.json):
//   testCatalog.packages.<packageId>.{title|badge|description|durationText|features}
//
// `field` accepts: "title" | "badge" | "description" | "durationText" | "features"
// `fallback` is whatever the API gave us (English) — used when no locale
// override exists for this packageId (e.g. a future package not yet localised).
export const localisedPackageField = (t, packageId, field, fallback) => {
  if (!packageId) return fallback;
  const key = `testCatalog.packages.${packageId}.${field}`;
  const value = t(key, {
    defaultValue: "",
    returnObjects: field === "features",
  });
  if (field === "features") {
    return Array.isArray(value) && value.length ? value : fallback;
  }
  return value || fallback;
};
