// Counselling slot vocabulary — the backend owns this list.
//
// Phase 2's frontend must offer exactly these slots, so it will read them
// from GET /v1/user/counselling/availability rather than hardcoding its own
// copy (BookCounselling.jsx currently has a literal array; that becomes the
// duplicate and gets deleted). One list, one owner.

// Wall-clock labels, exactly as the mock rendered them. These are display
// strings in IST — never instants.
export const COUNSELLING_SLOT_LABELS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

// India Standard Time, in minutes ahead of UTC. A fixed constant rather than
// a timezone library because IST has no DST — the offset has been +05:30
// since 1945 and there is no transition to model. If this product ever sells
// outside India, this is the thing to rip out first.
export const IST_OFFSET_MINUTES = 330;

const SLOT_LABEL_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Convert an IST wall-clock slot ("2026-08-24", "03:00 PM") into the UTC
 * instant it names. Returns null if either part is malformed or is not one
 * of the offered labels.
 */
export const slotStartFromLabel = (dateStr, timeLabel) => {
  const dateMatch = DATE_RE.exec(String(dateStr || "").trim());
  if (!dateMatch) return null;

  const label = String(timeLabel || "").trim().toUpperCase();
  // Only labels we actually offer may be booked. Without this a client could
  // reserve 03:17 AM and hold a slot the UI can never show or release.
  if (!COUNSELLING_SLOT_LABELS.includes(label)) return null;

  const timeMatch = SLOT_LABEL_RE.exec(label);
  if (!timeMatch) return null;

  const [, yy, mm, dd] = dateMatch;
  let hour = Number(timeMatch[1]) % 12;
  if (timeMatch[3].toUpperCase() === "PM") hour += 12;
  const minute = Number(timeMatch[2]);

  // Build the instant as if the wall clock were UTC, then step back by the
  // IST offset to get the real instant.
  const asUtc = Date.UTC(Number(yy), Number(mm) - 1, Number(dd), hour, minute, 0, 0);
  const instant = new Date(asUtc - IST_OFFSET_MINUTES * 60 * 1000);
  return Number.isNaN(instant.getTime()) ? null : instant;
};

/** The [start, end) UTC instants bounding one IST calendar day. */
export const istDayBounds = (dateStr) => {
  const dateMatch = DATE_RE.exec(String(dateStr || "").trim());
  if (!dateMatch) return null;
  const [, yy, mm, dd] = dateMatch;
  const startUtc = Date.UTC(Number(yy), Number(mm) - 1, Number(dd), 0, 0, 0, 0);
  const start = new Date(startUtc - IST_OFFSET_MINUTES * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

// How long a checkout may hold a slot before the reservation lapses.
export const RESERVATION_TTL_MS = 5 * 60 * 1000;

// Marker written into Razorpay order `notes`, so the shared webhook can tell
// a counselling payment from a package purchase.
export const COUNSELLING_NOTE_TYPE = "counselling";
