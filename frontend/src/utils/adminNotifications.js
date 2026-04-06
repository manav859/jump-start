const STORAGE_PREFIX = "jumpstart-admin-notifications";
const MAX_STORED_IDS = 200;

export const ADMIN_NOTIFICATIONS_REFRESH_EVENT =
  "jumpstart-admin-notifications:refresh";

const normalizeNotificationIds = (ids) =>
  Array.isArray(ids)
    ? ids
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    : [];

const getStorageKey = (identity) =>
  identity ? `${STORAGE_PREFIX}:${identity}` : "";

export const loadAdminNotificationState = (identity) => {
  if (typeof window === "undefined") {
    return { hasStoredState: false, ids: [] };
  }

  const storageKey = getStorageKey(identity);
  if (!storageKey) {
    return { hasStoredState: false, ids: [] };
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return { hasStoredState: false, ids: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { hasStoredState: true, ids: normalizeNotificationIds(parsed) };
    }

    return {
      hasStoredState: true,
      ids: normalizeNotificationIds(parsed?.ids),
    };
  } catch {
    return { hasStoredState: true, ids: [] };
  }
};

export const saveAdminNotificationState = (identity, ids) => {
  if (typeof window === "undefined") return;

  const storageKey = getStorageKey(identity);
  if (!storageKey) return;

  const nextIds = normalizeNotificationIds(ids).slice(-MAX_STORED_IDS);
  window.localStorage.setItem(storageKey, JSON.stringify({ ids: nextIds }));
};

export const mergeAdminNotificationIds = (currentIds, nextIds) =>
  [...new Set([...normalizeNotificationIds(currentIds), ...normalizeNotificationIds(nextIds)])].slice(
    -MAX_STORED_IDS
  );

export const emitAdminNotificationsRefresh = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_NOTIFICATIONS_REFRESH_EVENT));
};

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!window.__jumpstartAdminNotificationAudioContext) {
    window.__jumpstartAdminNotificationAudioContext = new AudioContextClass();
  }

  return window.__jumpstartAdminNotificationAudioContext;
};

export const primeAdminNotificationAudio = () => {
  if (typeof window === "undefined") return () => {};

  let detached = false;
  const events = ["pointerdown", "keydown", "touchstart"];

  const detach = () => {
    if (detached) return;
    detached = true;
    events.forEach((eventName) => {
      window.removeEventListener(eventName, handlePrimeAudio, true);
    });
  };

  const handlePrimeAudio = async () => {
    const audioContext = getAudioContext();
    if (!audioContext) {
      detach();
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    } catch {
      // Ignore blocked resumes; the next user gesture can unlock audio again.
    }

    detach();
  };

  events.forEach((eventName) => {
    window.addEventListener(eventName, handlePrimeAudio, true);
  });

  return detach;
};

export const playAdminNotificationSound = async () => {
  const audioContext = getAudioContext();
  if (!audioContext) return false;

  try {
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  } catch {
    return false;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.setValueAtTime(1174, now + 0.14);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.3);

  oscillator.onended = () => {
    oscillator.disconnect();
    gainNode.disconnect();
  };

  return true;
};
